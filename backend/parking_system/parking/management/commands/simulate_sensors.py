import random
import time
from django.core.management.base import BaseCommand
from django.db import transaction
from parking.models import ParkingSpot, ParkingLot
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class Command(BaseCommand):
    help = 'Simulates IoT parking sensors updating spot availability'

    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=float,
            default=2.0,
            help='Seconds between sensor updates (default: 2)'
        )

    def handle(self, *args, **options):
        interval = options['interval']
        channel_layer = get_channel_layer()

        self.stdout.write(self.style.SUCCESS(f'Starting sensor simulation (every {interval}s)...'))
        self.stdout.write('Press Ctrl+C to stop\n')

        try:
            while True:
                # Get a random spot ID first (outside transaction)
                spot_ids = list(ParkingSpot.objects.values_list('parking_spot_id', flat=True))
                if not spot_ids:
                    time.sleep(interval)
                    continue
                spot_id = random.choice(spot_ids)

                if random.random() < 0.6:
                    # Use transaction.atomic and select_for_update to prevent race conditions
                    with transaction.atomic():
                        spot = ParkingSpot.objects.select_for_update().get(pk=spot_id)
                        lot = ParkingLot.objects.select_for_update().get(pk=spot.parking_lot_id)

                        spot.availability = not spot.availability
                        spot.save()

                        lot.occupancy = lot.spots.filter(availability=False).count()
                        lot.save()

                        # Capture values for logging/broadcast
                        spot_available = spot.availability
                        spot_pk = spot.parking_spot_id
                        lot_id = lot.parking_lot_id
                        lot_name = lot.parking_lot_name
                        occupancy = lot.occupancy
                        total = lot.spots.count()

                    # Logging and broadcast outside transaction
                    action = "DEPARTED" if spot_available else "PARKED"
                    self.stdout.write(
                        f'[{lot_name}] Spot {spot_pk}: {action} '
                        f'(Lot: {occupancy}/{total} occupied)'
                    )

                    available = total - occupancy
                    async_to_sync(channel_layer.group_send)(
                        'parking_updates',
                        {
                            'type': 'parking_update',
                            'data': {
                                'lot_id': lot_id,
                                'lot_name': lot_name,
                                'spot_id': spot_pk,
                                'available': spot_available,
                                'available_spots': available,
                                'total_spots': total,
                                'occupancy_percent': round(occupancy / total * 100, 1) if total > 0 else 0
                            }
                        }
                    )

                time.sleep(interval)

        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('\nSimulation stopped.'))
