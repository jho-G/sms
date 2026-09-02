from typing import Optional

from django.contrib.auth import get_user_model
from django.db.models import QuerySet

User = get_user_model()


def get_user_by_id(user_id: str) -> Optional[User]:
    """
    Get a user by their UUID.
    
    Args:
        user_id: User's UUID as string
    
    Returns:
        User instance or None if not found
    """
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None


def get_user_by_email(email: str) -> Optional[User]:
    """
    Get a user by their email address.
    
    Args:
        email: User's email address
    
    Returns:
        User instance or None if not found
    """
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None


def get_users_by_role(role: str) -> QuerySet[User]:
    """
    Get all users with a specific role.
    
    Args:
        role: User role (DIRECTOR, TEACHER, STUDENT, PARENT)
    
    Returns:
        QuerySet of Users
    """
    return User.objects.filter(role=role)


def get_active_users() -> QuerySet[User]:
    """
    Get all active users.
    
    Returns:
        QuerySet of active Users
    """
    return User.objects.filter(is_active=True)


def get_directors() -> QuerySet[User]:
    """Get all director users."""
    return get_users_by_role(User.Role.DIRECTOR)


def get_teachers() -> QuerySet[User]:
    """Get all teacher users."""
    return get_users_by_role(User.Role.TEACHER)


def get_students() -> QuerySet[User]:
    """Get all student users."""
    return get_users_by_role(User.Role.STUDENT)


def get_parents() -> QuerySet[User]:
    """Get all parent users."""
    return get_users_by_role(User.Role.PARENT)
