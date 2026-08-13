from __future__ import annotations

import logging
from datetime import datetime, timezone

from bs4 import BeautifulSoup

from ingestion_engine.extractors.base import BaseExtractor, ExtractedArticle
from ingestion_engine.utils.media_cleaner import pick_hero_image

logger = logging.getLogger(__name__)

MIN_BODY_CHARS = 120


def _og_image(html: str) -> str | None:
    soup = BeautifulSoup(html, "lxml")
    tag = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
    if tag and tag.get("content"):
        return str(tag["content"]).strip()
    return None


def _iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


class StaticExtractor(BaseExtractor):
    async def extract(self, url: str, html: str | None = None) -> ExtractedArticle | None:
        try:
            from newspaper import Article  # type: ignore
        except ImportError:
            logger.warning("newspaper4k not installed")
            return None

        try:
            article = Article(url)
            if html:
                article.download(input_html=html)
            else:
                article.download()
            article.parse()
        except Exception:
            logger.exception("Tier1 parse failed for %s", url)
            return None

        raw_html = html or getattr(article, "html", None) or ""
        og = _og_image(raw_html) if raw_html else None
        body = (article.text or "").strip()
        title = (article.title or "").strip()
        if not title or len(body) < MIN_BODY_CHARS:
            return None

        hero = pick_hero_image(url, og, getattr(article, "top_image", None))
        return ExtractedArticle(
            canonical_url=url,
            title=title,
            clean_text=body,
            published_at=_iso(getattr(article, "publish_date", None)),
            hero_image_url=hero,
            extraction_tier="Tier1_Newspaper4k",
        )
