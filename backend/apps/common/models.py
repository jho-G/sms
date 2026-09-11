from django.db import models


class TimeStampedModel(models.Model):
    """
    Abstract base model with automatic created_at and updated_at timestamps.
    """

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.__class__.__name__} (id={self.pk})"
