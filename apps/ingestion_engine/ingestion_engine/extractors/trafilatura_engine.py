from __future__ import annotations

import json
import logging

import trafilatura

from ingestion_engine.extractors.base import BaseExtractor, ExtractedArticle
from ingestion_engine.utils.media_cleaner import pick_hero_image

logger = logging.getLogger(__name__)

MIN_BODY_CHARS = 120


class TrafilaturaEngine(BaseExtractor):
    async def extract(self, url: str, html: str | None = None) -> ExtractedArticle | None:
        try:
            downloaded = html or trafilatura.fetch_url(url)
            if not downloaded:
                return None
            raw = trafilatura.extract(
                downloaded,
                include_images=True,
                output_format="json",
                with_metadata=True,
                url=url,
            )
            if not raw:
                return None
            data = json.loads(raw)
        except Exception:
            logger.exception("Tier2 trafilatura failed for %s", url)
            return None

        title = (data.get("title") or "").strip()
        text = (data.get("text") or "").strip()
        if not title or len(text) < MIN_BODY_CHARS:
            return None

        images = data.get("image") or data.get("images") or []
        if isinstance(images, str):
            images = [images]
        hero = pick_hero_image(url, *(images[:3] if isinstance(images, list) else []))
        published = data.get("date") or data.get("date_publish")
        return ExtractedArticle(
            canonical_url=url,
            title=title,
            clean_text=text,
            published_at=published if isinstance(published, str) else None,
            hero_image_url=hero,
            extraction_tier="Tier2_Trafilatura",
        )
