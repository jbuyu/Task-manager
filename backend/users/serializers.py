from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active', 'password']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        """Create a new user with hashed password"""
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    def update(self, instance, validated_data):
        """Update user, handling password hashing"""
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserReadSerializer(serializers.ModelSerializer):
    """Read-only serializer for User (without password)"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active']
        read_only_fields = ['id', 'username', 'email', 'role', 'is_active']

