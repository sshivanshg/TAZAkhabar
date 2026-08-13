from __future__ import annotations

import json
import re
import logging
from typing import Any
from urllib.parse import urljoin, urlparse

import aiohttp
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class ApiClient:
    def __init__(self, base_url: str, ingest_key: str, session: aiohttp.ClientSession) -> None:
        self.base_url = base_url.rstrip("/")
        self.ingest_key = ingest_key
        self.session = session

    def _headers(self) -> dict[str, str]:
        return {"X-Ingest-Key": self.ingest_key, "Accept": "application/json"}

    async def list_scrape_sources(self, source_id: int | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {"type": "scrape"}
        if source_id is not None:
            params["id"] = str(source_id)
        async with self.session.get(
            f"{self.base_url}/api/ingest/sources",
            headers=self._headers(),
            params=params,
        ) as resp:
            if resp.status == 401:
                raise PermissionError("Invalid ingest key when listing sources")
            if resp.status == 429:
                raise RuntimeError("Rate limited when listing sources")
            resp.raise_for_status()
            data = await resp.json()
            return list(data.get("sources") or [])

    async def post_articles(
        self,
        articles: list[dict[str, Any]],
        run_id: int | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"articles": articles}
        if run_id is not None:
            payload["runId"] = run_id
        async with self.session.post(
            f"{self.base_url}/api/ingest/articles",
            headers=self._headers(),
            json=payload,
        ) as resp:
            body = await resp.text()
            if resp.status == 401:
                raise PermissionError("Invalid ingest key when posting articles")
            if resp.status == 429:
                raise RuntimeError("Rate limited when posting articles")
            if resp.status >= 400:
                raise RuntimeError(f"Ingest articles failed ({resp.status}): {body[:400]}")
            if not body:
                return {}
            return json.loads(body)


async def fetch_text(session: aiohttp.ClientSession, url: str) -> str:
    async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
        resp.raise_for_status()
        return await resp.text()


_BLOCK_PATH_TOKENS = (
    "/video/", "/videos/", "/live-blog", "/topic/", "/tag/", "/search",
    "/web-stories", "/subscription", "/epaper", "/photos/", "/gallery/",
    "/login", "/signup",
)

_STORY_ID_RE = re.compile(r"(\d{6,})(?:\.html)?/?$", re.I)


def _looks_like_article(path: str) -> bool:
    lowered = path.lower()
    if lowered.endswith(".html"):
        return True
    if any(x in lowered for x in ("/news/", "/story", "/article", "/city/")):
        return True
    return bool(_STORY_ID_RE.search(lowered))


def discover_article_links(list_html: str, base_url: str, limit: int = 20) -> list[str]:
    soup = BeautifulSoup(list_html, "lxml")
    seen: set[str] = set()
    preferred: list[str] = []
    fallback: list[str] = []
    base_host = urlparse(base_url).netloc.lower()

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if href.startswith("#") or href.lower().startswith(("javascript:", "mailto:", "tel:")):
            continue
        absolute = urljoin(base_url, href)
        parsed = urlparse(absolute)
        if parsed.scheme not in {"http", "https"}:
            continue
        host = parsed.netloc.lower()
        if host != base_host and not host.endswith(base_host.removeprefix("www.")):
            continue
        path = parsed.path or ""
        if path in {"", "/"}:
            continue
        segments = [s for s in path.split("/") if s]
        if len(segments) <= 1:
            continue
        lowered = absolute.lower()
        if any(x in lowered for x in _BLOCK_PATH_TOKENS):
            continue
        key = parsed._replace(query="", fragment="").geturl().rstrip("/")
        if key in seen:
            continue
        seen.add(key)
        if _looks_like_article(path):
            preferred.append(key)
        else:
            fallback.append(key)
        if len(preferred) >= limit:
            break

    links = preferred if preferred else fallback
    return links[:limit]
