from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class UserModelTests(TestCase):
    """Tests for User model"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            password='testpass123',
            role=User.Role.ADMIN,
        )
        self.manager_user = User.objects.create_user(
            username='manager',
            password='testpass123',
            role=User.Role.MANAGER,
        )
        self.member_user = User.objects.create_user(
            username='member',
            password='testpass123',
            role=User.Role.MEMBER,
        )
    
    def test_user_creation(self):
        """Test user creation with role"""
        user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            role=User.Role.MEMBER,
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.role, User.Role.MEMBER)
        self.assertTrue(user.is_active)
    
    def test_user_role_properties(self):
        """Test user role property methods"""
        self.assertTrue(self.admin_user.is_admin)
        self.assertFalse(self.admin_user.is_manager)
        self.assertFalse(self.admin_user.is_member)
        
        self.assertFalse(self.manager_user.is_admin)
        self.assertTrue(self.manager_user.is_manager)
        self.assertFalse(self.manager_user.is_member)
        
        self.assertFalse(self.member_user.is_admin)
        self.assertFalse(self.member_user.is_manager)
        self.assertTrue(self.member_user.is_member)
    
    def test_user_str_representation(self):
        """Test user string representation"""
        self.assertEqual(str(self.admin_user), 'admin (Admin)')


class UserAPIViewSetTests(TestCase):
    """Tests for User API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username='admin',
            password='testpass123',
            role=User.Role.ADMIN,
        )
        self.member_user = User.objects.create_user(
            username='member',
            password='testpass123',
            role=User.Role.MEMBER,
        )
    
    def test_list_users_requires_admin(self):
        """Test that only Admin can list users"""
        # Unauthenticated
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Authenticated as Member (should be forbidden)
        self.client.force_authenticate(user=self.member_user)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Authenticated as Admin (should succeed)
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Response can be a list or paginated dict
        self.assertTrue(isinstance(response.data, list) or 'results' in response.data or 'count' in response.data)
    
    def test_create_user_requires_admin(self):
        """Test that only Admin can create users"""
        user_data = {
            'username': 'newuser',
            'password': 'testpass123',
            'email': 'newuser@example.com',
            'role': User.Role.MEMBER,
        }
        
        # Unauthenticated
        response = self.client.post('/api/users/', user_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Authenticated as Member (should be forbidden)
        self.client.force_authenticate(user=self.member_user)
        response = self.client.post('/api/users/', user_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Authenticated as Admin (should succeed)
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post('/api/users/', user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'newuser')
        self.assertEqual(response.data['role'], User.Role.MEMBER)
        
        # Verify user was created in database
        new_user = User.objects.get(username='newuser')
        self.assertTrue(new_user.check_password('testpass123'))
    
    def test_update_user_requires_admin(self):
        """Test that only Admin can update users"""
        update_data = {
            'role': User.Role.MANAGER,
        }
        
        # Authenticated as Member (should be forbidden)
        self.client.force_authenticate(user=self.member_user)
        response = self.client.patch(f'/api/users/{self.member_user.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Authenticated as Admin (should succeed)
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(f'/api/users/{self.member_user.id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], User.Role.MANAGER)
        
        # Verify user was updated in database
        self.member_user.refresh_from_db()
        self.assertEqual(self.member_user.role, User.Role.MANAGER)
    
    def test_delete_user_requires_admin(self):
        """Test that only Admin can delete users"""
        user_to_delete = User.objects.create_user(
            username='todelete',
            password='testpass123',
            role=User.Role.MEMBER,
        )
        
        # Authenticated as Member (should be forbidden)
        self.client.force_authenticate(user=self.member_user)
        response = self.client.delete(f'/api/users/{user_to_delete.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Authenticated as Admin (should succeed)
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'/api/users/{user_to_delete.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify user was deleted
        self.assertFalse(User.objects.filter(id=user_to_delete.id).exists())


class AuthMeViewTests(TestCase):
    """Tests for auth/me endpoint with User model"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com',
            role=User.Role.MANAGER,
        )
    
    def test_me_endpoint_returns_401_when_not_authenticated(self):
        """Test that /api/auth/me/ returns 401 for unauthenticated users"""
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)
    
    def test_me_endpoint_returns_user_when_authenticated(self):
        """Test that /api/auth/me/ returns user data when authenticated"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')
        self.assertEqual(response.data['user']['email'], 'test@example.com')
        self.assertEqual(response.data['user']['role'], 'Manager')
        self.assertEqual(response.data['user']['id'], self.user.id)
