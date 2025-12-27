from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from parking.models import User, PermitType, ParkingLot, ParkingSpot


class UserModelTest(TestCase):
    """Test User model"""

    def test_create_user(self):
        """Test creating a user"""
        user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.last_name, 'User')
        self.assertTrue(user.check_password('testpass123'))


class ParkingLotModelTest(TestCase):
    """Test ParkingLot model"""

    def test_create_parking_lot(self):
        """Test creating a parking lot"""
        lot = ParkingLot.objects.create(
            parking_lot_name='Test Lot',
            occupancy=0
        )
        self.assertEqual(lot.parking_lot_name, 'Test Lot')
        self.assertEqual(lot.occupancy, 0)


class ParkingSpotModelTest(TestCase):
    """Test ParkingSpot model"""

    def test_create_parking_spot(self):
        """Test creating a parking spot"""
        lot = ParkingLot.objects.create(
            parking_lot_name='Test Lot',
            occupancy=0
        )
        spot = ParkingSpot.objects.create(
            parking_lot=lot,
            availability=True
        )
        self.assertTrue(spot.availability)
        self.assertEqual(spot.parking_lot, lot)


class DashboardAPITest(APITestCase):
    """Test Dashboard API endpoint"""

    def setUp(self):
        """Set up test data"""
        self.lot = ParkingLot.objects.create(
            parking_lot_name='Test Lot',
            occupancy=0
        )
        for i in range(7):
            ParkingSpot.objects.create(
                parking_lot=self.lot,
                availability=True
            )
        for i in range(3):
            ParkingSpot.objects.create(
                parking_lot=self.lot,
                availability=False
            )

    def test_dashboard_returns_lot_data(self):
        """Test dashboard endpoint returns lot information"""
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        lot_data = response.data[0]
        self.assertEqual(lot_data['name'], 'Test Lot')
        self.assertEqual(lot_data['total_spots'], 10)
        self.assertEqual(lot_data['available_spots'], 7)
        self.assertEqual(lot_data['occupancy_percent'], 30.0)


class RegisterAPITest(APITestCase):
    """Test User Registration API"""

    def test_register_user(self):
        """Test user registration"""
        data = {
            'username': 'newuser',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = self.client.post('/api/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())


class AuthTokenAPITest(APITestCase):
    """Test JWT Authentication"""

    def setUp(self):
        """Set up test user"""
        self.user = User.objects.create_user(
            username='authuser',
            password='authpass123',
            first_name='Auth',
            last_name='User'
        )

    def test_obtain_token(self):
        """Test obtaining JWT token"""
        data = {
            'username': 'authuser',
            'password': 'authpass123'
        }
        response = self.client.post('/api/token/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
