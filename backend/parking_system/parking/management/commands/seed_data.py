from django.core.management.base import BaseCommand
from parking.models import PermitType, ParkingLot, ParkingSpot, User, Vehicle


class Command(BaseCommand):
    help = 'Seeds the database with initial parking data'

    def handle(self, *args, **options):
        self.stdout.write('Clearing existing data...')
        ParkingSpot.objects.all().delete()
        ParkingLot.objects.all().delete()
        PermitType.objects.all().delete()

        self.stdout.write('Creating permit types...')
        student = PermitType.objects.create(name='Student')
        faculty = PermitType.objects.create(name='Faculty')
        visitor = PermitType.objects.create(name='Visitor')

        self.stdout.write('Creating parking lots...')
        lots_data = [
            ('Perry Street Lot', 25),
            ('The Cage', 40),
            ('Duck Pond Lot', 30),
            ('Drill Field Lot', 20),
            ('North End Lot', 35),
        ]

        for lot_name, num_spots in lots_data:
            lot = ParkingLot.objects.create(parking_lot_name=lot_name, occupancy=0)
            lot.permit_types.add(student, faculty)
            
            for i in range(num_spots):
                spot = ParkingSpot.objects.create(
                    parking_lot=lot,
                    availability=True
                )
                spot.lot_permit_access.add(student, faculty)

            self.stdout.write(f'  Created {lot_name} with {num_spots} spots')

        self.stdout.write(self.style.SUCCESS(f'\nDone! Created {ParkingLot.objects.count()} lots with {ParkingSpot.objects.count()} total spots'))