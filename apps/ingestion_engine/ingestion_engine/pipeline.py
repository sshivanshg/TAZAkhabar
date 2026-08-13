from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import aiohttp

from ingestion_engine.api_client import ApiClient, discover_article_links, fetch_text
from ingestion_engine.extractors.dynamic_browser import DynamicBrowserExtractor
from ingestion_engine.extractors.static_extractor import StaticExtractor
from ingestion_engine.extractors.trafilatura_engine import TrafilaturaEngine
from ingestion_engine.utils.deduplicator import UrlDeduplicator

logger = logging.getLogger(__name__)

BATCH_SIZE = 20
DEFAULT_LIMIT = 20


def load_source_overrides(config_path: Path | None = None) -> dict[str, Any]:
    path = config_path or Path(__file__).resolve().parent / "config" / "sources.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


class Pipeline:
    def __init__(
        self,
        api: ApiClient,
        session: aiohttp.ClientSession,
        dedupe: UrlDeduplicator,
        overrides: dict[str, Any] | None = None,
    ) -> None:
        self.api = api
        self.session = session
        self.dedupe = dedupe
        self.overrides = overrides or load_source_overrides()
        self.tier1 = StaticExtractor()
        self.tier2 = TrafilaturaEngine()
        self.tier3 = DynamicBrowserExtractor()

    def _domain_override(self, url: str) -> dict[str, Any]:
        from urllib.parse import urlparse

        host = urlparse(url).netloc.lower()
        if host.startswith("www."):
            alt = host[4:]
        else:
            alt = f"www.{host}"
        return self.overrides.get(host) or self.overrides.get(alt) or {}

    async def extract_article(self, url: str, force_tier: int | None = None) -> dict[str, Any] | None:
        html: str | None = None
        try:
            html = await fetch_text(self.session, url)
        except Exception:
            logger.warning("Failed to fetch %s", url, exc_info=True)

        extractors = []
        if force_tier == 3:
            extractors = [self.tier3]
        elif force_tier == 2:
            extractors = [self.tier2, self.tier3]
        else:
            extractors = [self.tier1, self.tier2, self.tier3]

        for extractor in extractors:
            try:
                result = await extractor.extract(url, html=html)
            except Exception:
                logger.exception("Extractor %s failed for %s", extractor.__class__.__name__, url)
                continue
            if result and result.ok:
                return {
                    "canonicalUrl": result.canonical_url,
                    "title": result.title,
                    "publishedAt": result.published_at,
                    "heroImageUrl": result.hero_image_url,
                    "cleanText": result.clean_text,
                    "detectedLanguage": result.detected_language,
                    "extractionTier": result.extraction_tier,
                }
        return None

    async def run_source(
        self,
        source: dict[str, Any],
        *,
        run_id: int | None = None,
        limit: int = DEFAULT_LIMIT,
        dry_run: bool = False,
    ) -> dict[str, int]:
        feed_url = source.get("feedUrl")
        source_id = source.get("id")
        if not feed_url or source_id is None:
            raise ValueError("Source missing feedUrl or id")

        override = self._domain_override(feed_url)
        force_tier = override.get("force_tier")

        list_html = await fetch_text(self.session, feed_url)
        links = discover_article_links(list_html, feed_url, limit=limit)
        logger.info("Source %s discovered %s links", source_id, len(links))

        inserted = skipped = failed = 0
        batch: list[dict[str, Any]] = []

        async def flush() -> None:
            nonlocal inserted, skipped, failed, batch
            if not batch:
                return
            if dry_run:
                logger.info("Dry-run batch (%s): %s", len(batch), [b["canonicalUrl"] for b in batch])
                inserted += len(batch)
                batch = []
                return
            response = await self.api.post_articles(batch, run_id=run_id)
            inserted += int(response.get("inserted") or 0)
            skipped += int(response.get("skipped") or 0)
            failed += int(response.get("failed") or 0)
            for item in response.get("items") or []:
                url = item.get("canonicalUrl")
                if url and item.get("status") in {"inserted", "skippedDuplicate"}:
                    self.dedupe.mark(url)
            batch = []

        for link in links:
            if self.dedupe.seen_recently(link):
                skipped += 1
                continue
            extracted = await self.extract_article(link, force_tier=force_tier)
            if not extracted:
                failed += 1
                continue
            extracted["sourceId"] = source_id
            if not extracted.get("detectedLanguage"):
                extracted["detectedLanguage"] = source.get("language")
            batch.append(extracted)
            if len(batch) >= BATCH_SIZE:
                await flush()

        await flush()
        return {"inserted": inserted, "skipped": skipped, "failed": failed}

    async def run_all(
        self,
        *,
        source_id: int | None = None,
        run_id: int | None = None,
        limit: int = DEFAULT_LIMIT,
        dry_run: bool = False,
    ) -> dict[str, int]:
        sources = await self.api.list_scrape_sources(source_id)
        totals = {"inserted": 0, "skipped": 0, "failed": 0}
        for source in sources:
            try:
                result = await self.run_source(source, run_id=run_id, limit=limit, dry_run=dry_run)
            except Exception:
                logger.exception("Source %s failed", source.get("id"))
                totals["failed"] += 1
                continue
            for key in totals:
                totals[key] += result[key]
        return totals
