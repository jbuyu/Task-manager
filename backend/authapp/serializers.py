from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserAuthSerializer(serializers.ModelSerializer):
    """Serializer for authenticated user in auth endpoints"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active']
        read_only_fields = ['id', 'username', 'email', 'role', 'is_active']

