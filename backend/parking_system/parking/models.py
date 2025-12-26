from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class PermitType(models.Model):
    """Permit classifications: Student, Faculty, Visitor, etc."""
    permit_type_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name


class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('Username is required')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user with parking-specific fields."""
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    permit_type = models.ForeignKey(
        PermitType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return self.username


class Vehicle(models.Model):
    """Vehicles owned by users. One user can have multiple vehicles."""
    vehicle_id = models.AutoField(primary_key=True)
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='vehicles'
    )

    def __str__(self):
        return f"{self.make} {self.model} ({self.owner.username})"


class ParkingLot(models.Model):
    """Physical parking lots (Perry Street, Cage, etc.)"""
    parking_lot_id = models.AutoField(primary_key=True)
    parking_lot_name = models.CharField(max_length=100)
    occupancy = models.IntegerField(default=0)
    permit_types = models.ManyToManyField(
        PermitType,
        related_name='parking_lots',
        blank=True
    )

    def __str__(self):
        return self.parking_lot_name


class ParkingSpot(models.Model):
    """Individual parking spots within a lot."""
    parking_spot_id = models.AutoField(primary_key=True)
    parking_lot = models.ForeignKey(
        ParkingLot,
        on_delete=models.CASCADE,
        related_name='spots'
    )
    availability = models.BooleanField(default=True)
    lot_permit_access = models.ManyToManyField(
        PermitType,
        related_name='accessible_spots',
        blank=True
    )

    def __str__(self):
        return f"Spot {self.parking_spot_id} in {self.parking_lot}"


class Event(models.Model):
    """Events (football games, etc.) that restrict parking lot access."""
    event_id = models.AutoField(primary_key=True)
    event_name = models.CharField(max_length=200)
    date = models.DateField()
    time_start = models.TimeField()
    restricted_lots = models.ManyToManyField(
        ParkingLot,
        related_name='restricting_events',
        blank=True
    )

    def __str__(self):
        return f"{self.event_name} on {self.date}"


class Session(models.Model):
    """Active parking sessions - tracks when a car is in a spot."""
    session_id = models.AutoField(primary_key=True)
    parking_spot = models.ForeignKey(
        ParkingSpot,
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sessions'
    )
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Session {self.session_id} - {self.user} at {self.parking_spot}"