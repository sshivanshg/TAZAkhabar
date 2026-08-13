from __future__ import annotations

import json
import logging
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

import aiohttp

from ingestion_engine.api_client import ApiClient
from ingestion_engine.pipeline import Pipeline
from ingestion_engine.utils.deduplicator import UrlDeduplicator

logger = logging.getLogger(__name__)


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


async def _run_job(source_id: int, run_id: int) -> dict[str, int]:
    api_base = _env("API_BASE_URL", "http://127.0.0.1:8080")
    ingest_key = _env("INGEST_KEY")
    if not ingest_key:
        raise RuntimeError("INGEST_KEY is required")

    cache_path = Path(_env("DEDUPE_CACHE_PATH", str(Path.home() / ".cache" / "newsfeed-ingest" / "url-cache.json")))
    timeout = aiohttp.ClientTimeout(total=120)
    headers = {"User-Agent": "NewsFeedExtractionWorker/0.1"}
    async with aiohttp.ClientSession(timeout=timeout, headers=headers) as session:
        api = ApiClient(api_base, ingest_key, session)
        pipeline = Pipeline(api, session, UrlDeduplicator(cache_path))
        return await pipeline.run_all(source_id=source_id, run_id=run_id)


def create_handler(expected_key: str) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt: str, *args: Any) -> None:
            logger.info("%s - %s", self.address_string(), fmt % args)

        def _read_json(self) -> dict[str, Any]:
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length) if length else b"{}"
            return json.loads(raw.decode("utf-8") or "{}")

        def _send(self, status: int, payload: dict[str, Any]) -> None:
            body = json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self) -> None:  # noqa: N802
            if self.path.rstrip("/") != "/run":
                self._send(404, {"error": "not found"})
                return
            provided = self.headers.get("X-Ingest-Key") or ""
            if not expected_key or provided != expected_key:
                self._send(401, {"error": "unauthorized"})
                return
            try:
                payload = self._read_json()
                source_id = int(payload["sourceId"])
                run_id = int(payload["runId"])
            except (KeyError, TypeError, ValueError, json.JSONDecodeError) as ex:
                self._send(400, {"error": f"invalid body: {ex}"})
                return

            import asyncio

            try:
                result = asyncio.run(_run_job(source_id, run_id))
            except PermissionError as ex:
                self._send(401, {"error": str(ex)})
                return
            except Exception as ex:
                logger.exception("Worker /run failed")
                self._send(500, {"error": str(ex)})
                return

            self._send(
                200,
                {
                    "inserted": result.get("inserted", 0),
                    "skipped": result.get("skipped", 0),
                    "failed": result.get("failed", 0),
                },
            )

    return Handler


def serve(host: str | None = None, port: int | None = None) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    host = host or _env("WORKER_HOST", "127.0.0.1")
    port = port or int(_env("WORKER_PORT", "8090") or "8090")
    key = _env("INGEST_KEY")
    if not key:
        raise SystemExit("INGEST_KEY is required to serve the worker")
    server = ThreadingHTTPServer((host, port), create_handler(key))
    logger.info("Extraction worker listening on http://%s:%s/run", host, port)
    server.serve_forever()


if __name__ == "__main__":
    serve()
