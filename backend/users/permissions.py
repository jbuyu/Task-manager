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


class IsAssigneeOrManagerOrAdmin(permissions.BasePermission):
    """
    Permission to check if the user can act on an object they own/assign
    or if they have elevated privileges (Manager/Admin).
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        if request.user.role in ['Admin', 'Manager']:
            return True
        
        if hasattr(obj, 'assignee'):
            return obj.assignee == request.user
        
        return False

