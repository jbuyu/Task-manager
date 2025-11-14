from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Permission to check if user has Admin role"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'Admin'
        )


class IsManagerOrAdmin(permissions.BasePermission):
    """Permission to check if user has Manager or Admin role"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['Admin', 'Manager']
        )


class IsAssigneeOrAdmin(permissions.BasePermission):
    """
    Permission to check if user is the assignee of an object or has Admin role.
    The object must have an 'assignee' attribute.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin can access any object
        if request.user.role == 'Admin':
            return True
        
        # Check if user is the assignee
        if hasattr(obj, 'assignee'):
            return obj.assignee == request.user
        
        return False

