from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AuthMeViewTests(TestCase):
    """Tests for auth/me endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/me/'
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            role=User.Role.MEMBER,
        )

    def test_me_endpoint_returns_401_when_not_authenticated(self):
        """Test that /api/auth/me/ returns 401 for unauthenticated users"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)

    def test_me_endpoint_returns_user_when_authenticated(self):
        """Test that /api/auth/me/ returns user data when authenticated"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')
        self.assertEqual(response.data['user']['id'], self.user.id)


class LoginViewTests(TestCase):
    """Tests for auth/login endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/login/'
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            role=User.Role.MEMBER,
        )

    def test_login_with_valid_credentials(self):
        """Test login with valid username and password"""
        data = {
            'username': 'testuser',
            'password': 'testpass123',
        }
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')
        
        # Verify session was created
        self.assertIn('sessionid', response.cookies)

    def test_login_with_invalid_username(self):
        """Test login with invalid username"""
        data = {
            'username': 'nonexistent',
            'password': 'testpass123',
        }
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_login_with_invalid_password(self):
        """Test login with invalid password"""
        data = {
            'username': 'testuser',
            'password': 'wrongpassword',
        }
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_login_with_missing_fields(self):
        """Test login with missing username or password"""
        # Missing password
        response = self.client.post(self.url, {'username': 'testuser'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Missing username
        response = self.client.post(self.url, {'password': 'testpass123'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_inactive_user(self):
        """Test login with inactive user account"""
        self.user.is_active = False
        self.user.save()
        
        data = {
            'username': 'testuser',
            'password': 'testpass123',
        }
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)


class LogoutViewTests(TestCase):
    """Tests for auth/logout endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/logout/'
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            role=User.Role.MEMBER,
        )

    def test_logout_requires_authentication(self):
        """Test that logout requires authentication"""
        response = self.client.post(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_logout_destroys_session(self):
        """Test that logout destroys the session"""
        # First login to create session
        login_data = {
            'username': 'testuser',
            'password': 'testpass123',
        }
        login_response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        # Now logout
        response = self.client.post(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        # Verify session was destroyed by checking /auth/me/
        me_response = self.client.get('/api/auth/me/')
        self.assertEqual(me_response.status_code, status.HTTP_401_UNAUTHORIZED)
