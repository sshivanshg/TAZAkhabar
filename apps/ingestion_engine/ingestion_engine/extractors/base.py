from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ExtractedArticle:
    canonical_url: str
    title: str
    clean_text: str
    published_at: str | None = None
    hero_image_url: str | None = None
    detected_language: str | None = None
    extraction_tier: str = "unknown"
    inline_images: list[dict[str, Any]] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return bool(self.title.strip()) and bool(self.clean_text.strip())


class BaseExtractor:
    async def extract(self, url: str, html: str | None = None) -> ExtractedArticle | None:
        raise NotImplementedError
