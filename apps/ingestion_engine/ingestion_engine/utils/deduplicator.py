from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path


class UrlDeduplicator:
    """Local SHA-256 URL cache with a rolling TTL (default 24h)."""

    def __init__(self, path: Path, ttl_seconds: int = 24 * 60 * 60) -> None:
        self.path = path
        self.ttl_seconds = ttl_seconds
        self._entries: dict[str, float] = {}
        self._load()

    @staticmethod
    def hash_url(url: str) -> str:
        return hashlib.sha256(url.encode("utf-8")).hexdigest()

    def _load(self) -> None:
        if not self.path.exists():
            return
        try:
            raw = json.loads(self.path.read_text(encoding="utf-8"))
            if isinstance(raw, dict):
                self._entries = {str(k): float(v) for k, v in raw.items()}
        except (OSError, ValueError, TypeError):
            self._entries = {}
        self._prune()

    def _prune(self) -> None:
        cutoff = time.time() - self.ttl_seconds
        self._entries = {k: ts for k, ts in self._entries.items() if ts >= cutoff}

    def _save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(self._entries), encoding="utf-8")

    def seen_recently(self, url: str) -> bool:
        self._prune()
        return self.hash_url(url) in self._entries

    def mark(self, url: str) -> None:
        self._prune()
        self._entries[self.hash_url(url)] = time.time()
        self._save()
