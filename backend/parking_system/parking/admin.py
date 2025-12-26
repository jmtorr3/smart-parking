# Register your models here.
from django.contrib import admin
from .models import PermitType, User, Vehicle, ParkingLot, ParkingSpot, Event, Session

@admin.register(PermitType)
class PermitTypeAdmin(admin.ModelAdmin):
    list_display = ('permit_type_id', 'name')

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'first_name', 'last_name', 'permit_type', 'is_active')

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('vehicle_id', 'make', 'model', 'owner')

@admin.register(ParkingLot)
class ParkingLotAdmin(admin.ModelAdmin):
    list_display = ('parking_lot_id', 'parking_lot_name', 'occupancy')

@admin.register(ParkingSpot)
class ParkingSpotAdmin(admin.ModelAdmin):
    list_display = ('parking_spot_id', 'parking_lot', 'availability')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('event_id', 'event_name', 'date', 'time_start')

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'user', 'parking_spot', 'start_time', 'end_time')