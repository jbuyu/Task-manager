from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])  # Allow unauthenticated access to check auth status
def me(request):
    """
    Get current authenticated user.
    Returns 401 if not authenticated (placeholder implementation).
    """
    if not request.user.is_authenticated:
        return Response(
            {'detail': 'Authentication credentials were not provided.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # TODO: Return user data when authenticated
    return Response({'user': None}, status=status.HTTP_200_OK)
