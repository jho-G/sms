from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model - read operations.
    """

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "role",
            "phone_number",
            "profile_picture",
            "date_of_birth",
            "is_email_verified",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "date_joined", "is_email_verified"]


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users.
    """

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
            "role",
            "phone_number",
            "date_of_birth",
        ]

    def validate_email(self, value):
        """Check if email already exists."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        """Create user with validated data."""
        from authentication.services import create_user

        # Remove password_confirm from validated_data
        validated_data.pop("password_confirm", None)

        user = create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            role=validated_data.get("role", User.Role.STUDENT),
            **{
                k: v
                for k, v in validated_data.items()
                if k not in ["email", "password", "role"]
            },
        )
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for login endpoint.
    """

    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing password.
    """

    old_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "New passwords do not match."}
            )
        return attrs


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile (limited fields).
    """

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "phone_number",
            "profile_picture",
            "date_of_birth",
        ]
