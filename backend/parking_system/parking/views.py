from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime
from .models import PermitType, ParkingLot, ParkingSpot, Event, Session, User, Vehicle
from .serializers import (
    PermitTypeSerializer,
    ParkingLotSerializer,
    ParkingSpotSerializer,
    EventSerializer,
    SessionSerializer,
    VehicleSerializer,
    UserProfileSerializer
)


class ParkingLotViewSet(viewsets.ModelViewSet):
    queryset = ParkingLot.objects.all().order_by('parking_lot_id')
    serializer_class = ParkingLotSerializer


class ParkingSpotViewSet(viewsets.ModelViewSet):
    queryset = ParkingSpot.objects.all().order_by('parking_spot_id')
    serializer_class = ParkingSpotSerializer

    def get_queryset(self):
        queryset = ParkingSpot.objects.all().order_by('parking_spot_id')
        lot_id = self.request.query_params.get('parking_lot')
        if lot_id:
            queryset = queryset.filter(parking_lot_id=lot_id)
        return queryset


class PermitTypeViewSet(viewsets.ModelViewSet):
    queryset = PermitType.objects.all()
    serializer_class = PermitTypeSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Vehicle.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


@api_view(['GET'])
def dashboard_summary(request):
    """Quick summary endpoint for the frontend dashboard."""
    lots = ParkingLot.objects.all().order_by('parking_lot_id')
    data = []
    for lot in lots:
        total = lot.spots.count()
        available = lot.spots.filter(availability=True).count()
        data.append({
            'id': lot.parking_lot_id,
            'name': lot.parking_lot_name,
            'total_spots': total,
            'available_spots': available,
            'occupancy_percent': round((total - available) / total * 100, 1) if total > 0 else 0
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    """Get current user's profile with permit type and vehicles."""
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
def active_events(request):
    """Get currently active events (happening today)."""
    today = timezone.now().date()
    events = Event.objects.filter(date=today)
    serializer = EventSerializer(events, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def lots_for_permit(request):
    """Get parking lots accessible for the current user's permit type."""
    if not request.user.is_authenticated:
        # Return all lots for anonymous users
        lots = ParkingLot.objects.all().order_by('parking_lot_id')
    elif request.user.permit_type:
        # Return lots that allow this permit type
        lots = ParkingLot.objects.filter(permit_types=request.user.permit_type).order_by('parking_lot_id')
    else:
        # User has no permit, return empty or all lots
        lots = ParkingLot.objects.all().order_by('parking_lot_id')
    
    serializer = ParkingLotSerializer(lots, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user."""
    username = request.data.get('username')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')

    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=username,
        password=password,
        first_name=first_name,
        last_name=last_name
    )

    return Response({'message': 'User created successfully', 'user_id': user.user_id}, status=status.HTTP_201_CREATED)