from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()


def create_user(email: str, password: str, role: str = User.Role.STUDENT, **extra_fields) -> User:
    """
    Create a new user with the given email, password, and role.
    
    Args:
        email: User's email address (used as username)
        password: User's password (will be validated and hashed)
        role: User's role (DIRECTOR, TEACHER, STUDENT, PARENT)
        **extra_fields: Additional fields like first_name, last_name, etc.
    
    Returns:
        The created User instance
    
    Raises:
        ValidationError: If password doesn't meet validation requirements
        ValueError: If email is not provided or role is invalid
    """
    if not email:
        raise ValueError("Email is required")
    
    if not password:
        raise ValueError("Password is required")
    
    # Validate role
    valid_roles = [choice[0] for choice in User.Role.choices]
    if role not in valid_roles:
        raise ValueError(f"Invalid role. Must be one of: {valid_roles}")
    
    # Validate password strength
    try:
        validate_password(password)
    except ValidationError as e:
        raise ValidationError(f"Password validation failed: {', '.join(e.messages)}")
    
    # Normalize email
    email = User.objects.normalize_email(email)
    
    # Create user
    user = User(
        email=email,
        role=role,
        **extra_fields,
    )
    user.set_password(password)
    user.save()
    
    return user


def update_user(user: User, **update_fields) -> User:
    """
    Update user fields.
    
    Args:
        user: User instance to update
        **update_fields: Fields to update
    
    Returns:
        The updated User instance
    """
    for field, value in update_fields.items():
        if field == "password":
            user.set_password(value)
        else:
            setattr(user, field, value)
    
    user.save()
    return user


def change_password(user: User, old_password: str, new_password: str) -> bool:
    """
    Change user's password after verifying old password.
    
    Args:
        user: User instance
        old_password: Current password for verification
        new_password: New password to set
    
    Returns:
        True if password was changed successfully
    
    Raises:
        ValueError: If old password is incorrect
    """
    if not user.check_password(old_password):
        raise ValueError("Old password is incorrect")
    
    try:
        validate_password(new_password, user=user)
    except ValidationError as e:
        raise ValidationError(f"New password validation failed: {', '.join(e.messages)}")
    
    user.set_password(new_password)
    user.save()
    return True
