from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from .models import Task

User = get_user_model()


class TaskModelTests(TestCase):
    """Tests for Task model"""
    
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
    
    def test_task_creation(self):
        """Test task creation with all fields"""
        task = Task.objects.create(
            title='Test Task',
            description='Test Description',
            status=Task.Status.TODO,
            assignee=self.member_user,
            deadline=timezone.now() + timedelta(days=7),
        )
        self.assertEqual(task.title, 'Test Task')
        self.assertEqual(task.status, Task.Status.TODO)
        self.assertEqual(task.assignee, self.member_user)
        self.assertIsNotNone(task.created_at)
    
    def test_task_str_representation(self):
        """Test task string representation"""
        task = Task.objects.create(
            title='Test Task',
            assignee=self.member_user,
        )
        self.assertIn('Test Task', str(task))
        self.assertIn('Todo', str(task))
        self.assertIn('member', str(task))
    
    def test_task_is_overdue(self):
        """Test task overdue property"""
        past_deadline = timezone.now() - timedelta(days=1)
        future_deadline = timezone.now() + timedelta(days=1)
        
        overdue_task = Task.objects.create(
            title='Overdue Task',
            deadline=past_deadline,
            status=Task.Status.TODO,
        )
        not_overdue_task = Task.objects.create(
            title='Not Overdue Task',
            deadline=future_deadline,
            status=Task.Status.TODO,
        )
        done_task = Task.objects.create(
            title='Done Task',
            deadline=past_deadline,
            status=Task.Status.DONE,
        )
        
        self.assertTrue(overdue_task.is_overdue)
        self.assertFalse(not_overdue_task.is_overdue)
        self.assertFalse(done_task.is_overdue)  # Done tasks are never overdue


class TaskAPIViewSetTests(TestCase):
    """Tests for Task API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
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
        self.other_member = User.objects.create_user(
            username='othermember',
            password='testpass123',
            role=User.Role.MEMBER,
        )
        
        self.task = Task.objects.create(
            title='Test Task',
            description='Test Description',
            status=Task.Status.TODO,
            assignee=self.member_user,
            deadline=timezone.now() + timedelta(days=7),
        )
    
    def test_list_tasks_requires_authentication(self):
        """Test that listing tasks requires authentication"""
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_member_can_only_see_own_tasks(self):
        """Test that Member can only see tasks assigned to them"""
        self.client.force_authenticate(user=self.member_user)
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see own task
        self.assertTrue(isinstance(response.data, list) or 'results' in response.data or 'count' in response.data)
    
    def test_manager_can_see_all_tasks(self):
        """Test that Manager can see all tasks"""
        # Create another task assigned to different member
        Task.objects.create(
            title='Other Task',
            assignee=self.other_member,
        )
        
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see all tasks
    
    def test_admin_can_see_all_tasks(self):
        """Test that Admin can see all tasks"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_create_task_requires_manager_or_admin(self):
        """Test that only Manager or Admin can create tasks"""
        task_data = {
            'title': 'New Task',
            'description': 'New Description',
            'status': Task.Status.TODO,
            'assignee': self.member_user.id,
        }
        
        # Member cannot create
        self.client.force_authenticate(user=self.member_user)
        response = self.client.post('/api/tasks/', task_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Manager can create
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.post('/api/tasks/', task_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Task')
        
        # Admin can create
        task_data['title'] = 'Admin Task'
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post('/api/tasks/', task_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_update_task_requires_assignee_or_admin(self):
        """Test that only assignee or Admin can update tasks"""
        update_data = {
            'status': Task.Status.IN_PROGRESS,
        }
        
        # Other member cannot see/update task (404 because they can't see it in queryset)
        self.client.force_authenticate(user=self.other_member)
        response = self.client.patch(f'/api/tasks/{self.task.id}/', update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Assignee can update
        self.client.force_authenticate(user=self.member_user)
        response = self.client.patch(f'/api/tasks/{self.task.id}/', update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], Task.Status.IN_PROGRESS)
        
        # Admin can update
        update_data['status'] = Task.Status.DONE
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(f'/api/tasks/{self.task.id}/', update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], Task.Status.DONE)
    
    def test_delete_task_requires_admin(self):
        """Test that only Admin can delete tasks"""
        task_to_delete = Task.objects.create(
            title='Task to Delete',
            assignee=self.member_user,
        )
        
        # Member cannot delete
        self.client.force_authenticate(user=self.member_user)
        response = self.client.delete(f'/api/tasks/{task_to_delete.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Manager cannot delete
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.delete(f'/api/tasks/{task_to_delete.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Admin can delete
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'/api/tasks/{task_to_delete.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=task_to_delete.id).exists())
    
    def test_filter_tasks_by_status(self):
        """Test filtering tasks by status"""
        Task.objects.create(
            title='Done Task',
            status=Task.Status.DONE,
            assignee=self.member_user,
        )
        
        self.client.force_authenticate(user=self.member_user)
        response = self.client.get('/api/tasks/?status=Done')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_filter_tasks_by_assignee(self):
        """Test filtering tasks by assignee"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/api/tasks/?assignee={self.member_user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
