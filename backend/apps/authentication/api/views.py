import logging

from django.contrib.auth import authenticate, get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.api.serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    UserCreateSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
)
from authentication.services import change_password
from common.throttling import (
    AuthBurstRateThrottle,
    AuthSustainedRateThrottle,
    PasswordResetRateThrottle,
)

User = get_user_model()
logger = logging.getLogger("sms.auth")


@extend_schema(
    tags=["Authentication"],
    summary="Register a new user account",
    description="Registers a user. Returns tokens on self-registration.",
)
class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Register a new user account.

    Self-registration (anonymous caller) returns a token pair so the new user
    is signed straight in. When a director creates an account on someone
    else's behalf no tokens are issued -- returning them made the browser
    client overwrite the director's own session with the new user's.
    """

    serializer_class = UserCreateSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthBurstRateThrottle, AuthSustainedRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        is_self_registration = not request.user.is_authenticated

        payload = {"user": UserSerializer(user).data}
        if is_self_registration:
            refresh = RefreshToken.for_user(user)
            payload["tokens"] = {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }

        return Response(
            {
                "success": True,
                "message": "User registered successfully.",
                "data": payload,
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=["Authentication"],
    summary="Authenticate user and issue JWT tokens",
    request=LoginSerializer,
    responses={
        200: inline_serializer(
            name="LoginResponse",
            fields={
                "success": serializers.BooleanField(),
                "message": serializers.CharField(),
                "data": inline_serializer(
                    name="LoginData",
                    fields={
                        "user": UserSerializer(),
                        "tokens": inline_serializer(
                            name="TokenPair",
                            fields={
                                "access": serializers.CharField(),
                                "refresh": serializers.CharField(),
                            },
                        ),
                    },
                ),
            },
        )
    },
)
class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticate user and return JWT tokens.
    """

    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    throttle_classes = [AuthBurstRateThrottle, AuthSustainedRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        # Authenticate user
        user = authenticate(
            request,
            email=email,
            password=password,
        )

        if user is None:
            logger.warning(
                "Authentication failure for email '%s' from IP %s",
                email,
                request.META.get("REMOTE_ADDR"),
            )
            return Response(
                {
                    "success": False,
                    "error": {
                        "message": "Invalid email or password.",
                    },
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            logger.warning(
                "Authentication denied for deactivated account '%s' (IP %s)",
                email,
                request.META.get("REMOTE_ADDR"),
            )
            return Response(
                {
                    "success": False,
                    "error": {
                        "message": "This account has been deactivated.",
                    },
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        logger.info(
            "User '%s' authenticated successfully (role: %s, IP: %s)",
            email,
            user.role,
            request.META.get("REMOTE_ADDR"),
        )
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "success": True,
                "message": "Login successful.",
                "data": {
                    "user": UserSerializer(user).data,
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                },
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Authentication"],
    summary="Log out and blacklist refresh token",
    request=inline_serializer(
        name="LogoutRequest",
        fields={"refresh": serializers.CharField(help_text="JWT refresh token to invalidate")},
    ),
    responses={
        200: inline_serializer(
            name="LogoutResponse",
            fields={"success": serializers.BooleanField(), "message": serializers.CharField()},
        )
    },
)
class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklist the refresh token to log out.
    Allows unauthenticated access so logout works even if access token is expired.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            return Response(
                {
                    "success": True,
                    "message": "Logged out successfully.",
                },
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {
                    "success": False,
                    "error": {
                        "message": "Invalid token.",
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


@extend_schema(
    tags=["Authentication"],
    summary="Retrieve or update current user profile",
)
class MeView(generics.RetrieveUpdateAPIView):
    """
    GET/PUT/PATCH /api/auth/me/
    Get or update the current user's profile.
    """

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(
            {
                "success": True,
                "data": serializer.data,
            }
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = UserProfileUpdateSerializer(
            instance, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "success": True,
                "message": "Profile updated successfully.",
                "data": UserSerializer(instance).data,
            }
        )


@extend_schema(
    tags=["Authentication"],
    summary="Change user account password",
)
class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Change the current user's password.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            change_password(
                user=request.user,
                old_password=serializer.validated_data["old_password"],
                new_password=serializer.validated_data["new_password"],
            )
        except ValueError as e:
            # Wrong current password.
            return Response(
                {
                    "success": False,
                    "error": {"message": str(e)},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DjangoValidationError as e:
            # The new password failed Django's validators; report a 400 with
            # the reasons rather than letting it bubble up as a 500.
            return Response(
                {
                    "success": False,
                    "error": {"message": ", ".join(e.messages)},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": "Password changed successfully.",
            },
            status=status.HTTP_200_OK,
        )
