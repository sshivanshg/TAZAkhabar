from __future__ import annotations

from urllib.parse import urljoin, urlparse

_BLOCK_TOKENS = ("logo", "avatar", "icon", "placeholder", "pixel", "spacer", "1x1", "tracking")


def to_absolute_url(base_url: str, maybe_relative: str | None) -> str | None:
    if not maybe_relative or not maybe_relative.strip():
        return None
    candidate = maybe_relative.strip()
    if candidate.startswith("data:"):
        return None
    absolute = urljoin(base_url, candidate)
    parsed = urlparse(absolute)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None
    return absolute


def is_junk_image_url(url: str | None, width: int | None = None, height: int | None = None) -> bool:
    if not url:
        return True
    lowered = url.lower()
    if any(token in lowered for token in _BLOCK_TOKENS):
        return True
    if width is not None and height is not None and (width < 200 or height < 200):
        return True
    if width is not None and width < 200:
        return True
    if height is not None and height < 200:
        return True
    return False


def pick_hero_image(base_url: str, *candidates: str | None) -> str | None:
    for raw in candidates:
        absolute = to_absolute_url(base_url, raw)
        if absolute and not is_junk_image_url(absolute):
            return absolute
    return None
