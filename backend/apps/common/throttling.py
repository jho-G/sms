"""
Custom rate limit throttling classes to safeguard sensitive endpoints against
brute force and denial-of-service attacks.
"""
from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle


class AuthBurstRateThrottle(AnonRateThrottle):
    """
    Burst throttle for login/register endpoints (e.g. 10 requests per minute).
    Prevents high-frequency credential stuffing.
    """

    scope = "auth_burst"


class AuthSustainedRateThrottle(AnonRateThrottle):
    """
    Sustained throttle for authentication endpoints (e.g. 100 requests per hour).
    Prevents prolonged password guessing campaigns.
    """

    scope = "auth_sustained"


class PasswordResetRateThrottle(SimpleRateThrottle):
    """
    Strict throttle for password change/reset attempts.
    """

    scope = "password_reset"

    def get_cache_key(self, request, view):
        if request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)

        return self.cache_format % {
            "scope": self.scope,
            "ident": ident,
        }
