from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Task

User = get_user_model()


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task CRUD operations"""
    
    assignee_username = serializers.CharField(
        source='assignee.username',
        read_only=True,
        required=False
    )
    
    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'status',
            'deadline',
            'assignee',
            'assignee_username',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_status(self, value):
        """Validate status value"""
        if value not in [choice[0] for choice in Task.Status.choices]:
            raise serializers.ValidationError(
                f"Status must be one of: {', '.join([c[0] for c in Task.Status.choices])}"
            )
        return value
    
    def validate_assignee(self, value):
        """Validate assignee is active"""
        if value and not value.is_active:
            raise serializers.ValidationError("Cannot assign task to inactive user.")
        return value


class TaskReadSerializer(serializers.ModelSerializer):
    """Read-only serializer for Task (with nested user info)"""
    
    assignee_username = serializers.CharField(source='assignee.username', read_only=True)
    assignee_email = serializers.EmailField(source='assignee.email', read_only=True)
    assignee_role = serializers.CharField(source='assignee.role', read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'status',
            'deadline',
            'assignee',
            'assignee_username',
            'assignee_email',
            'assignee_role',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

