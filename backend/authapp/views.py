import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from django.conf import settings
from .serializers import UserAuthSerializer, LoginSerializer

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token_view(request):
    """
    Get CSRF token endpoint.
    This ensures CSRF cookie is set properly for cross-origin requests.
    Django's get_token() will automatically set the cookie, but we ensure it's set
    with the correct attributes from settings.
    """
    token = get_token(request)
    response = Response({'csrfToken': token}, status=status.HTTP_200_OK)
    
    # Explicitly set CSRF cookie using Django's settings
    # This ensures the cookie has the correct SameSite and Secure attributes
    response.set_cookie(
        'csrftoken',
        token,
        max_age=settings.CSRF_COOKIE_AGE if hasattr(settings, 'CSRF_COOKIE_AGE') else 3600 * 24,
        domain=settings.CSRF_COOKIE_DOMAIN if hasattr(settings, 'CSRF_COOKIE_DOMAIN') else None,
        path=settings.CSRF_COOKIE_PATH if hasattr(settings, 'CSRF_COOKIE_PATH') else '/',
        secure=settings.CSRF_COOKIE_SECURE,
        httponly=settings.CSRF_COOKIE_HTTPONLY,
        samesite=settings.CSRF_COOKIE_SAMESITE
    )
    logger.info(f"CSRF token issued - Origin: {request.META.get('HTTP_ORIGIN')}, "
                f"Secure: {settings.CSRF_COOKIE_SECURE}, SameSite: {settings.CSRF_COOKIE_SAMESITE}")
    return response


@api_view(['GET'])
@permission_classes([AllowAny])  # Allow unauthenticated access to check auth status
def me(request):
    """
    Get current authenticated user.
    Returns 401 if not authenticated, otherwise returns user data.
    """
    # Log request details for debugging
    logger.info(f"GET /auth/me/ - Origin: {request.META.get('HTTP_ORIGIN')}, "
                f"CSRF Token: {request.META.get('HTTP_X_CSRFTOKEN', 'None')}, "
                f"Cookies: {list(request.COOKIES.keys())}")
    
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
    # Log request details for debugging
    logger.error(f"POST /auth/login/ - Origin: {request.META.get('HTTP_ORIGIN')}, "
                 f"CSRF Token: {request.META.get('HTTP_X_CSRFTOKEN', 'None')}, "
                 f"Cookies: {list(request.COOKIES.keys())}, "
                 f"Data keys: {list(request.data.keys()) if hasattr(request.data, 'keys') else 'N/A'}")
    
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)  # Creates session
        
        # Ensure session is saved
        request.session.save()
        
        user_serializer = UserAuthSerializer(user)
        response = Response(
            {
                'user': user_serializer.data,
                'message': 'Login successful'
            },
            status=status.HTTP_200_OK
        )
        
        logger.info(f"Login successful for user: {user.username}")
        return response
    
    # Log validation errors
    logger.error(f"Login validation failed: {serializer.errors}")
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
