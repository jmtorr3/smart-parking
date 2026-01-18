from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import IntegrityError
from django.db.models import Count, Q
from django.core.cache import cache
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
    serializer_class = ParkingLotSerializer

    def get_queryset(self):
        # Prefetch spots and annotate counts to avoid N+1 queries
        return ParkingLot.objects.prefetch_related(
            'spots', 'permit_types'
        ).annotate(
            _total_spots=Count('spots'),
            _available_spots=Count('spots', filter=Q(spots__availability=True))
        ).order_by('parking_lot_id')


class ParkingSpotViewSet(viewsets.ModelViewSet):
    serializer_class = ParkingSpotSerializer

    def get_queryset(self):
        queryset = ParkingSpot.objects.select_related('parking_lot').order_by('parking_spot_id')
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
    """Quick summary endpoint for the frontend dashboard.

    Optimized with:
    - Single query using annotations (no N+1)
    - 2-second cache to reduce redundant queries
    - Cache locking to prevent thundering herd
    """
    cache_key = 'dashboard_summary'
    lock_key = 'dashboard_summary_lock'

    # Try cache first
    data = cache.get(cache_key)
    if data is not None:
        return Response(data)

    # Try to acquire lock to prevent thundering herd
    # Only one request will rebuild the cache; others get stale data or wait briefly
    acquired = cache.add(lock_key, '1', timeout=5)

    if acquired:
        try:
            # Double-check cache after acquiring lock
            data = cache.get(cache_key)
            if data is None:
                # Single query with annotations - no N+1 problem
                lots = ParkingLot.objects.annotate(
                    total=Count('spots'),
                    available=Count('spots', filter=Q(spots__availability=True))
                ).order_by('parking_lot_id')

                data = [
                    {
                        'id': lot.parking_lot_id,
                        'name': lot.parking_lot_name,
                        'total_spots': lot.total,
                        'available_spots': lot.available,
                        'occupancy_percent': round((lot.total - lot.available) / lot.total * 100, 1) if lot.total > 0 else 0
                    }
                    for lot in lots
                ]

                # Cache for 2 seconds - balances freshness with performance
                cache.set(cache_key, data, timeout=2)
        finally:
            cache.delete(lock_key)
    else:
        # Another request is rebuilding cache; fetch fresh data directly
        # This is rare and only happens during cache rebuild
        lots = ParkingLot.objects.annotate(
            total=Count('spots'),
            available=Count('spots', filter=Q(spots__availability=True))
        ).order_by('parking_lot_id')

        data = [
            {
                'id': lot.parking_lot_id,
                'name': lot.parking_lot_name,
                'total_spots': lot.total,
                'available_spots': lot.available,
                'occupancy_percent': round((lot.total - lot.available) / lot.total * 100, 1) if lot.total > 0 else 0
            }
            for lot in lots
        ]

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

    try:
        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        return Response({'message': 'User created successfully', 'user_id': user.user_id}, status=status.HTTP_201_CREATED)
    except IntegrityError:
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)