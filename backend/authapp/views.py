from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import login, logout
from .serializers import UserAuthSerializer, LoginSerializer


@api_view(['GET'])
@permission_classes([AllowAny])  # Allow unauthenticated access to check auth status
def me(request):
    """
    Get current authenticated user.
    Returns 401 if not authenticated, otherwise returns user data.
    """
    if not request.user.is_authenticated:
        return Response(
            {'detail': 'Authentication credentials were not provided.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    serializer = UserAuthSerializer(request.user)
    return Response({'user': serializer.data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login endpoint for session-based authentication.
    Creates a session for the authenticated user.
    """
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)  # Creates session
        
        user_serializer = UserAuthSerializer(user)
        return Response(
            {
                'user': user_serializer.data,
                'message': 'Login successful'
            },
            status=status.HTTP_200_OK
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint.
    Destroys the current session.
    """
    logout(request)
    return Response(
        {'message': 'Logout successful'},
        status=status.HTTP_200_OK
    )
