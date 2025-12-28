from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'lots', views.ParkingLotViewSet)
router.register(r'spots', views.ParkingSpotViewSet)
router.register(r'permits', views.PermitTypeViewSet)
router.register(r'events', views.EventViewSet)
router.register(r'sessions', views.SessionViewSet)
router.register(r'vehicles', views.VehicleViewSet, basename='vehicles')

urlpatterns = [
    # Custom paths FIRST
    path('dashboard/', views.dashboard_summary, name='dashboard-summary'),
    path('register/', views.register, name='register'),
    path('me/', views.my_profile, name='my-profile'),
    path('events/active/', views.active_events, name='active-events'),
    path('lots/for-my-permit/', views.lots_for_permit, name='lots-for-permit'),
    # Router LAST
    path('', include(router.urls)),
]