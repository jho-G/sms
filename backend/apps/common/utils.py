"""
Small, dependency-free helpers shared across apps.
"""
from typing import Any, Iterable, List


def stringify_uuids(values: Iterable[Any]) -> List[str]:
    """
    Return UUID values as their canonical string form.

    DRF's ``UUIDField`` hands services ``uuid.UUID`` objects, while the
    lookup maps inside the bulk services are keyed by ``str(id)``. Comparing
    the two directly made every id look missing, so normalise once at the
    service boundary instead of relying on each caller to cast.
    """
    return [str(value) for value in values]
