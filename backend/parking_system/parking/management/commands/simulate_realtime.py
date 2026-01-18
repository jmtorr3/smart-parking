import random
import time
from datetime import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from parking.models import ParkingLot
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


# Daily occupancy schedule - target occupancy percentage by hour
DAILY_SCHEDULE = [
    {'start': 0, 'end': 6, 'target': 0.10},    # Night: 10%
    {'start': 6, 'end': 8, 'target': 0.40},    # Early morning: 40%
    {'start': 8, 'end': 11, 'target': 0.80},   # Morning rush: 80%
    {'start': 11, 'end': 14, 'target': 0.90},  # Midday peak: 90%
    {'start': 14, 'end': 17, 'target': 0.60},  # Afternoon: 60%
    {'start': 17, 'end': 20, 'target': 0.30},  # Evening: 30%
    {'start': 20, 'end': 24, 'target': 0.15},  # Late night: 15%
]


def get_target_for_hour(hour):
    """Get target occupancy percentage for a given hour."""
    for block in DAILY_SCHEDULE:
        if block['start'] <= hour < block['end']:
            return block['target']
    return 0.3


def shuffle(items):
    """Randomly shuffle a list."""
    shuffled = list(items)
    random.shuffle(shuffled)
    return shuffled


class Command(BaseCommand):
    help = 'Simulates parking lot occupancy based on realistic daily patterns (real-time)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=float,
            default=5.0,
            help='Seconds between simulation ticks (default: 5)'
        )
        parser.add_argument(
            '--gain',
            type=float,
            default=0.35,
            help='How aggressively to approach target occupancy (0.0-1.0, default: 0.35)'
        )
        parser.add_argument(
            '--max-step-percent',
            type=float,
            default=0.15,
            help='Maximum percentage of spots to change per tick (default: 0.15)'
        )
        parser.add_argument(
            '--lot',
            type=int,
            default=None,
            help='Specific lot ID to simulate (default: all lots)'
        )

    def handle(self, *args, **options):
        interval = options['interval']
        gain = options['gain']
        max_step_percent = options['max_step_percent']
        lot_filter = options['lot']

        channel_layer = get_channel_layer()

        self.stdout.write(self.style.SUCCESS(
            'Starting real-time parking simulation...'
        ))
        self.stdout.write(f'  Interval: {interval}s')
        self.stdout.write(f'  Gain: {gain}')
        self.stdout.write(f'  Max step: {max_step_percent * 100}%')
        if lot_filter:
            self.stdout.write(f'  Lot filter: {lot_filter}')
        self.stdout.write('Press Ctrl+C to stop\n')

        try:
            while True:
                now = datetime.now()
                current_hour = now.hour
                target = get_target_for_hour(current_hour)

                # Get lots to simulate
                if lot_filter:
                    lots = ParkingLot.objects.filter(parking_lot_id=lot_filter)
                else:
                    lots = ParkingLot.objects.all()

                for lot in lots:
                    self.simulate_lot(
                        lot, target, gain, max_step_percent, channel_layer, now
                    )

                time.sleep(interval)

        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('\nSimulation stopped.'))

    def simulate_lot(self, lot, target, gain, max_step_percent, channel_layer, now):
        """Simulate occupancy changes for a single parking lot."""
        lot_id = lot.pk
        changes = []
        new_occupancy = 0
        total = 0
        lot_name = lot.parking_lot_name

        # Use transaction.atomic and select_for_update to prevent race conditions
        with transaction.atomic():
            # Lock the lot and its spots for update
            lot = ParkingLot.objects.select_for_update().get(pk=lot_id)
            spots = list(lot.spots.select_for_update().all())

            if not spots:
                return

            total = len(spots)
            lot_name = lot.parking_lot_name
            occupied_spots = [s for s in spots if not s.availability]
            available_spots = [s for s in spots if s.availability]
            current_occupied = len(occupied_spots)

            desired_occupied = round(total * target)
            diff = desired_occupied - current_occupied

            # Skip if close enough to target
            if abs(diff) <= 1:
                return

            # Calculate step size with gain and max limit
            step = round(abs(diff) * gain)
            max_step = max(1, round(total * max_step_percent))
            step = min(step, max_step)

            if step == 0:
                return

            if diff > 0:
                # Need more cars (occupy spots)
                spots_to_occupy = shuffle(available_spots)[:step]
                for spot in spots_to_occupy:
                    spot.availability = False
                    spot.save()
                    changes.append({
                        'spot_id': spot.parking_spot_id,
                        'available': False,
                        'action': 'PARKED'
                    })
            else:
                # Need fewer cars (free spots)
                spots_to_free = shuffle(occupied_spots)[:step]
                for spot in spots_to_free:
                    spot.availability = True
                    spot.save()
                    changes.append({
                        'spot_id': spot.parking_spot_id,
                        'available': True,
                        'action': 'DEPARTED'
                    })

            # Update lot occupancy count (within same transaction)
            new_occupancy = lot.spots.filter(availability=False).count()
            lot.occupancy = new_occupancy
            lot.save()

        # Skip logging/broadcast if no changes were made
        if not changes:
            return

        # Log changes (outside transaction)
        time_str = now.strftime('%H:%M:%S')
        target_pct = int(target * 100)
        actual_pct = int((new_occupancy / total) * 100) if total > 0 else 0

        self.stdout.write(
            f'[{time_str}] {lot_name}: '
            f'{new_occupancy}/{total} occupied ({actual_pct}%) '
            f'[target: {target_pct}%] '
            f'({len(changes)} changes)'
        )

        # Batch broadcast all changes via WebSocket (single message with all updates)
        async_to_sync(channel_layer.group_send)(
            'parking_updates',
            {
                'type': 'batch_update',
                'data': {
                    'lot_id': lot_id,
                    'lot_name': lot_name,
                    'changes': changes,
                    'occupancy': new_occupancy,
                    'total_spots': total,
                    'available_spots': total - new_occupancy,
                    'occupancy_percent': actual_pct,
                    'target_percent': target_pct,
                    'timestamp': now.isoformat(),
                }
            }
        )
