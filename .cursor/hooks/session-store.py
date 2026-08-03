#!/usr/bin/env python3
"""Persist Cursor agent sessions under .cursor/sessions/ (gitignored).

Handles sessionStart, sessionEnd, and stop events from hooks.json.
Copies the conversation transcript when Cursor provides transcript_path.
"""

from __future__ import annotations

import json
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def project_root() -> Path:
    # Hook cwd is the project root for project hooks.
    env_root = os.environ.get("CURSOR_PROJECT_DIR") or os.environ.get("CLAUDE_PROJECT_DIR")
    if env_root:
        return Path(env_root).resolve()
    return Path.cwd().resolve()


def sessions_root(root: Path) -> Path:
    path = root / ".cursor" / "sessions"
    path.mkdir(parents=True, exist_ok=True)
    return path


def session_dir(root: Path, session_id: str) -> Path:
    path = sessions_root(root) / session_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def append_jsonl(path: Path, payload: dict) -> None:
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, ensure_ascii=False) + "\n")


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def copy_transcript(src: str | None, dest: Path) -> str | None:
    if not src:
        return None
    source = Path(src)
    if not source.is_file():
        return None
    try:
        shutil.copy2(source, dest)
        return str(dest)
    except OSError:
        return None


def handle_session_start(payload: dict, root: Path) -> dict:
    session_id = (
        payload.get("session_id")
        or payload.get("conversation_id")
        or f"unknown-{int(datetime.now(timezone.utc).timestamp())}"
    )
    directory = session_dir(root, session_id)
    meta_path = directory / "meta.json"
    started_at = utc_now()

    meta = {
        "session_id": session_id,
        "conversation_id": payload.get("conversation_id") or session_id,
        "started_at": started_at,
        "ended_at": None,
        "status": "active",
        "composer_mode": payload.get("composer_mode"),
        "is_background_agent": payload.get("is_background_agent"),
        "model": payload.get("model"),
        "model_id": payload.get("model_id"),
        "user_email": payload.get("user_email"),
        "cursor_version": payload.get("cursor_version"),
        "workspace_roots": payload.get("workspace_roots"),
        "transcript_path_source": payload.get("transcript_path"),
        "transcript_copy": None,
        "events": [],
    }
    write_json(meta_path, meta)

    append_jsonl(
        sessions_root(root) / "index.jsonl",
        {
            "event": "sessionStart",
            "session_id": session_id,
            "started_at": started_at,
            "composer_mode": payload.get("composer_mode"),
            "model": payload.get("model") or payload.get("model_id"),
        },
    )
    append_jsonl(
        directory / "events.jsonl",
        {"event": "sessionStart", "at": started_at, "payload_keys": sorted(payload.keys())},
    )

    # Make session id/path available to later hooks in this session.
    return {
        "env": {
            "NEWSFEED_SESSION_ID": session_id,
            "NEWSFEED_SESSION_DIR": str(directory),
        },
        "additional_context": (
            f"Session persistence is active. This session is stored at "
            f".cursor/sessions/{session_id}/ (local only, gitignored)."
        ),
    }


def handle_session_end(payload: dict, root: Path) -> dict:
    session_id = (
        payload.get("session_id")
        or payload.get("conversation_id")
        or os.environ.get("NEWSFEED_SESSION_ID")
        or "unknown"
    )
    directory = session_dir(root, session_id)
    meta_path = directory / "meta.json"
    meta = read_json(meta_path)

    ended_at = utc_now()
    transcript_src = payload.get("transcript_path") or meta.get("transcript_path_source")
    transcript_copy = copy_transcript(transcript_src, directory / "transcript.jsonl")

    meta.update(
        {
            "session_id": session_id,
            "ended_at": ended_at,
            "status": "ended",
            "reason": payload.get("reason"),
            "duration_ms": payload.get("duration_ms"),
            "final_status": payload.get("final_status"),
            "error_message": payload.get("error_message"),
            "is_background_agent": payload.get("is_background_agent", meta.get("is_background_agent")),
            "transcript_path_source": transcript_src,
            "transcript_copy": transcript_copy,
        }
    )
    write_json(meta_path, meta)

    append_jsonl(
        sessions_root(root) / "index.jsonl",
        {
            "event": "sessionEnd",
            "session_id": session_id,
            "ended_at": ended_at,
            "reason": payload.get("reason"),
            "duration_ms": payload.get("duration_ms"),
            "transcript_copy": bool(transcript_copy),
        },
    )
    append_jsonl(
        directory / "events.jsonl",
        {
            "event": "sessionEnd",
            "at": ended_at,
            "reason": payload.get("reason"),
            "duration_ms": payload.get("duration_ms"),
        },
    )
    return {}


def handle_stop(payload: dict, root: Path) -> dict:
    """Snapshot transcript on each agent stop so mid-session work is not lost."""
    session_id = (
        payload.get("conversation_id")
        or payload.get("session_id")
        or os.environ.get("NEWSFEED_SESSION_ID")
    )
    if not session_id:
        return {}

    directory = session_dir(root, session_id)
    meta_path = directory / "meta.json"
    meta = read_json(meta_path)
    if not meta:
        meta = {
            "session_id": session_id,
            "conversation_id": session_id,
            "started_at": utc_now(),
            "status": "active",
        }

    transcript_src = payload.get("transcript_path") or meta.get("transcript_path_source")
    transcript_copy = copy_transcript(transcript_src, directory / "transcript.jsonl")
    if transcript_copy:
        meta["transcript_path_source"] = transcript_src
        meta["transcript_copy"] = transcript_copy
        meta["last_stop_at"] = utc_now()
        meta["last_stop_status"] = payload.get("status")
        write_json(meta_path, meta)

    append_jsonl(
        directory / "events.jsonl",
        {
            "event": "stop",
            "at": utc_now(),
            "status": payload.get("status"),
            "generation_id": payload.get("generation_id"),
            "transcript_copied": bool(transcript_copy),
        },
    )
    return {}


def main() -> int:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        payload = {}

    root = project_root()
    event = payload.get("hook_event_name") or ""

    if event == "sessionStart":
        response = handle_session_start(payload, root)
    elif event == "sessionEnd":
        response = handle_session_end(payload, root)
    elif event == "stop":
        response = handle_stop(payload, root)
    else:
        # Fallback: treat as start if session_id present without event name.
        if payload.get("session_id") and "reason" not in payload:
            response = handle_session_start(payload, root)
        elif payload.get("session_id") and "reason" in payload:
            response = handle_session_end(payload, root)
        else:
            response = {}

    sys.stdout.write(json.dumps(response))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
