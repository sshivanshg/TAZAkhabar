from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys
from pathlib import Path

import aiohttp

from ingestion_engine.api_client import ApiClient
from ingestion_engine.pipeline import Pipeline
from ingestion_engine.server import serve
from ingestion_engine.utils.deduplicator import UrlDeduplicator


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


async def _async_main(args: argparse.Namespace) -> int:
    api_base = args.api_base or _env("API_BASE_URL", "http://127.0.0.1:8080")
    ingest_key = args.ingest_key or _env("INGEST_KEY")
    if not ingest_key:
        logging.error("INGEST_KEY is required")
        return 2

    cache_path = Path(
        args.cache
        or _env("DEDUPE_CACHE_PATH", str(Path.home() / ".cache" / "newsfeed-ingest" / "url-cache.json"))
    )
    timeout = aiohttp.ClientTimeout(total=120)
    headers = {"User-Agent": "NewsFeedExtractionWorker/0.1"}
    async with aiohttp.ClientSession(timeout=timeout, headers=headers) as session:
        api = ApiClient(api_base, ingest_key, session)
        pipeline = Pipeline(api, session, UrlDeduplicator(cache_path))
        result = await pipeline.run_all(
            source_id=args.source_id,
            limit=args.limit,
            dry_run=args.dry_run,
        )
    logging.info(
        "Done inserted=%s skipped=%s failed=%s",
        result["inserted"],
        result["skipped"],
        result["failed"],
    )
    if result["inserted"] == 0 and result["skipped"] == 0 and result["failed"] > 0:
        return 1
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="NewsFeed extraction worker")
    parser.add_argument("--serve", action="store_true", help="Run HTTP worker on WORKER_HOST:WORKER_PORT")
    parser.add_argument("--all", action="store_true", help="Crawl all active scrape sources")
    parser.add_argument("--source-id", type=int, default=None, help="Single source id")
    parser.add_argument("--limit", type=int, default=20, help="Max article links per list page")
    parser.add_argument("--dry-run", action="store_true", help="Extract without POSTing to API")
    parser.add_argument("--api-base", default=None, help="API base URL (default API_BASE_URL)")
    parser.add_argument("--ingest-key", default=None, help="X-Ingest-Key secret")
    parser.add_argument("--cache", default=None, help="Local URL dedupe cache path")
    return parser


def main(argv: list[str] | None = None) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.serve:
        serve()
        return
    if not args.all and args.source_id is None:
        parser.error("Provide --all, --source-id, or --serve")
    raise SystemExit(asyncio.run(_async_main(args)))


if __name__ == "__main__":
    main(sys.argv[1:])
