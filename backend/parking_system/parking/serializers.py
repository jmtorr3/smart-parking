from rest_framework import serializers
from .models import PermitType, ParkingLot, ParkingSpot, Event, Session, Vehicle, User


class PermitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PermitType
        fields = '__all__'


class ParkingSpotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParkingSpot
        fields = '__all__'


class ParkingLotSerializer(serializers.ModelSerializer):
    spots = ParkingSpotSerializer(many=True, read_only=True)
    available_spots = serializers.SerializerMethodField()
    total_spots = serializers.SerializerMethodField()
    permit_types = PermitTypeSerializer(many=True, read_only=True)

    class Meta:
        model = ParkingLot
        fields = ['parking_lot_id', 'parking_lot_name', 'occupancy', 'total_spots', 'available_spots', 'spots', 'permit_types']

    def get_available_spots(self, obj):
        return obj.spots.filter(availability=True).count()

    def get_total_spots(self, obj):
        return obj.spots.count()


class EventSerializer(serializers.ModelSerializer):
    restricted_lots = ParkingLotSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = '__all__'


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = '__all__'


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ['vehicle_id', 'make', 'model']
        read_only_fields = ['vehicle_id']


class UserProfileSerializer(serializers.ModelSerializer):
    permit_type = PermitTypeSerializer(read_only=True)
    vehicles = VehicleSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['user_id', 'username', 'first_name', 'last_name', 'permit_type', 'vehicles']