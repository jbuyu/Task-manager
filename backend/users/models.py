from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model with role-based access control.
    Extends Django's AbstractUser to add role field.
    """
    
    class Role(models.TextChoices):
        ADMIN = 'Admin', 'Admin'
        MANAGER = 'Manager', 'Manager'
        MEMBER = 'Member', 'Member'
    
    email = models.EmailField(blank=True, null=True)
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.MEMBER,
    )
    is_active = models.BooleanField(default=True)
    
    # Remove username from unique constraint and make email optional
    # username is already unique from AbstractUser
    
    class Meta:
        db_table = 'users_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    @property
    def is_admin(self):
        """Check if user has Admin role"""
        return self.role == self.Role.ADMIN
    
    @property
    def is_manager(self):
        """Check if user has Manager role"""
        return self.role == self.Role.MANAGER
    
    @property
    def is_member(self):
        """Check if user has Member role"""
        return self.role == self.Role.MEMBER
