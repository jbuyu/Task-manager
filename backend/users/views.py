from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, UserReadSerializer, UserChoiceSerializer
from .permissions import IsAdmin, IsManagerOrAdmin
from .pagination import UserPagination

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User CRUD operations.
    Only Admin users can access these endpoints.
    """
    queryset = User.objects.all()
    pagination_class = UserPagination
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email']
    ordering_fields = ['username', 'role', 'is_active']
    ordering = ['username']
    
    def get_serializer_class(self):
        """Use read serializer for GET, write serializer for POST/PUT"""
        if self.action in ['list', 'retrieve']:
            return UserReadSerializer
        return UserSerializer
    
    def list(self, request, *args, **kwargs):
        """List all users with pagination"""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Create a new user (Admin only)"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update user (Admin only)"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete user (Admin only)"""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAuthenticated, IsManagerOrAdmin],
        url_path='choices',
    )
    def choices(self, request):
        """
        Return a lightweight list of active users that can be assigned tasks.
        Accessible to Managers and Admins.
        """
        queryset = User.objects.filter(is_active=True).order_by('username')
        serializer = UserChoiceSerializer(queryset, many=True)
        return Response(serializer.data)
