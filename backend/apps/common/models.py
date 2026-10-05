import uuid

from django.db import models


class TimeStampedModel(models.Model):
    """
    Abstract base model with a UUID primary key and automatic timestamps.

    The UUID primary key is declared here rather than on each concrete model
    so that every domain model matches the ``<uuid:...>`` URL converters used
    throughout the API and the ``UUIDField`` inputs used by the bulk
    serializers. ``authentication.User`` declares its own UUID primary key
    because it inherits from ``AbstractUser`` instead of this base class.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.__class__.__name__} (id={self.pk})"
