from __future__ import annotations

import logging

from bs4 import BeautifulSoup

from ingestion_engine.extractors.base import BaseExtractor, ExtractedArticle
from ingestion_engine.utils.media_cleaner import pick_hero_image, to_absolute_url, is_junk_image_url

logger = logging.getLogger(__name__)

MIN_BODY_CHARS = 120


class DynamicBrowserExtractor(BaseExtractor):
    async def extract(self, url: str, html: str | None = None) -> ExtractedArticle | None:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            logger.warning("Playwright not installed")
            return None

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                try:
                    page = await browser.new_page()
                    await page.goto(url, wait_until="networkidle", timeout=60_000)
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await page.wait_for_timeout(800)
                    rendered = await page.content()
                finally:
                    await browser.close()
        except Exception:
            logger.exception("Tier3 Playwright failed for %s", url)
            return None

        soup = BeautifulSoup(rendered, "lxml")
        for tag in soup(["script", "style", "noscript", "nav", "footer", "aside"]):
            tag.decompose()

        article = soup.find("article") or soup.find("main") or soup.body
        if article is None:
            return None

        title = ""
        h1 = article.find("h1") or soup.find("h1")
        if h1:
            title = h1.get_text(" ", strip=True)
        if not title and soup.title:
            title = soup.title.get_text(" ", strip=True)

        paragraphs = [p.get_text(" ", strip=True) for p in article.find_all("p")]
        paragraphs = [p for p in paragraphs if len(p) > 40]
        text = "\n\n".join(paragraphs).strip()
        if not title or len(text) < MIN_BODY_CHARS:
            return None

        og = soup.find("meta", property="og:image")
        og_url = og.get("content") if og else None
        img_candidates: list[str | None] = [og_url]
        for img in article.find_all("img"):
            src = img.get("src") or img.get("data-src")
            absolute = to_absolute_url(url, src)
            w = _to_int(img.get("width"))
            h = _to_int(img.get("height"))
            if absolute and not is_junk_image_url(absolute, w, h):
                img_candidates.append(absolute)

        return ExtractedArticle(
            canonical_url=url,
            title=title,
            clean_text=text,
            hero_image_url=pick_hero_image(url, *img_candidates),
            extraction_tier="Tier3_Playwright",
        )


def _to_int(value: str | None) -> int | None:
    if value is None:
        return None
    try:
        return int(str(value).strip())
    except ValueError:
        return None
