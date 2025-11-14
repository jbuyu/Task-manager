from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from .models import Task
from .serializers import TaskSerializer, TaskReadSerializer
from users.permissions import IsAdmin, IsManagerOrAdmin, IsAssigneeOrAdmin

User = get_user_model()


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task CRUD operations.
    
    - List/Retrieve: Authenticated users can view tasks
    - Create: Manager or Admin only
    - Update: Assignee or Admin only
    - Delete: Admin only
    """
    queryset = Task.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'assignee']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'deadline', 'title']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Use read serializer for GET, write serializer for POST/PUT"""
        if self.action in ['list', 'retrieve']:
            return TaskReadSerializer
        return TaskSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action == 'create':
            permission_classes = [IsAuthenticated, IsManagerOrAdmin]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsAssigneeOrAdmin]
        elif self.action == 'destroy':
            permission_classes = [IsAuthenticated, IsAdmin]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on user role"""
        queryset = Task.objects.select_related('assignee').all()
        
        # Members can only see their assigned tasks
        user = self.request.user
        if user.role == 'Member':
            queryset = queryset.filter(assignee=user)
        
        # Managers and Admins can see all tasks
        return queryset
    
    def list(self, request, *args, **kwargs):
        """List tasks with filtering and pagination"""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Create a new task (Manager or Admin only)"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update task (Assignee or Admin only)"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete task (Admin only)"""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
