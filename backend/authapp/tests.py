from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AuthMeViewTests(TestCase):
    """Smoke test for auth/me endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/me/'

    def test_me_endpoint_returns_401_when_not_authenticated(self):
        """Test that /api/auth/me/ returns 401 for unauthenticated users"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)
