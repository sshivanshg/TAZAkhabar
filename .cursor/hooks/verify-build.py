#!/usr/bin/env python3
"""Mark dirty packages on afterFileEdit; typecheck/build on stop.

Emits followup_message when checks fail so the agent can self-correct.
Stdout must be JSON only; logs go to stderr.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

MAX_OUTPUT_CHARS = 6000
STATE_NAME = "pending-verify.json"


def project_root() -> Path:
    env_root = os.environ.get("CURSOR_PROJECT_DIR") or os.environ.get("CLAUDE_PROJECT_DIR")
    if env_root:
        return Path(env_root).resolve()
    return Path.cwd().resolve()


def state_path(root: Path) -> Path:
    directory = root / ".cursor" / "hooks-state"
    directory.mkdir(parents=True, exist_ok=True)
    return directory / STATE_NAME


def read_state(root: Path) -> set[str]:
    path = state_path(root)
    if not path.is_file():
        return set()
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return set()
    packages = payload.get("packages")
    if not isinstance(packages, list):
        return set()
    return {str(item) for item in packages if item}


def write_state(root: Path, packages: set[str]) -> None:
    path = state_path(root)
    path.write_text(
        json.dumps({"packages": sorted(packages)}, indent=2) + "\n",
        encoding="utf-8",
    )


def clear_state(root: Path) -> None:
    path = state_path(root)
    if path.is_file():
        path.unlink()


def emit(payload: dict) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def classify_path(rel: str) -> str | None:
    normalized = rel.replace("\\", "/")
    if normalized.startswith("apps/app/") or normalized == "apps/app":
        return "app"
    if normalized.startswith("apps/admin/") or normalized == "apps/admin":
        return "admin"
    if normalized.startswith("packages/shared-types/") or normalized == "packages/shared-types":
        return "shared-types"
    if (
        normalized.startswith("apps/api/")
        or normalized.startswith("apps/api.Tests/")
        or normalized.startswith("infra/migrations/")
        or normalized.endswith(".csproj")
        or normalized.endswith(".sln")
    ):
        return "api"
    return None


def file_from_payload(payload: dict) -> str | None:
    for key in ("file_path", "path", "file", "uri"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value
    edited = payload.get("edited_file") or payload.get("filePath")
    if isinstance(edited, str) and edited.strip():
        return edited
    return None


def to_repo_relative(root: Path, raw: str) -> str | None:
    path = Path(raw)
    if not path.is_absolute():
        candidate = (root / path).resolve()
    else:
        candidate = path.resolve()
    try:
        return candidate.relative_to(root).as_posix()
    except ValueError:
        return None


def sanitize_env() -> dict[str, str]:
    env = os.environ.copy()
    path = env.get("PATH", "")
    parts = [
        part
        for part in path.split(os.pathsep)
        if part and "cursor" not in part.lower() and "Cursor.app" not in part
    ]
    # Prefer Homebrew / system node ahead of any remaining Cursor bundles.
    preferred = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"]
    env["PATH"] = os.pathsep.join([*preferred, *parts])
    return env


def run_check(root: Path, label: str, command: list[str]) -> tuple[bool, str]:
    try:
        completed = subprocess.run(
            command,
            cwd=root,
            env=sanitize_env(),
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError as exc:
        return False, f"$ {' '.join(command)}\n{exc}"

    output = (completed.stdout or "") + (completed.stderr or "")
    output = output.strip()
    if len(output) > MAX_OUTPUT_CHARS:
        output = output[:MAX_OUTPUT_CHARS] + "\n…(truncated)"
    header = f"$ {' '.join(command)} (exit {completed.returncode})"
    body = f"{header}\n{output}" if output else header
    return completed.returncode == 0, body


def checks_for(packages: set[str]) -> list[tuple[str, list[str]]]:
    checks: list[tuple[str, list[str]]] = []
    # Shared types affect app/admin consumers — typecheck both when touched.
    if "shared-types" in packages or "app" in packages:
        checks.append(("app typecheck", ["pnpm", "lint:app"]))
    if "shared-types" in packages or "admin" in packages:
        checks.append(("admin build typecheck", ["pnpm", "--filter", "@tazakhabar/admin", "exec", "tsc", "-b", "--pretty", "false"]))
    if "api" in packages:
        checks.append(("api build", ["dotnet", "build", "TazaKhabar.sln", "-c", "Release", "--nologo", "-v", "q"]))
    return checks


def handle_after_file_edit(payload: dict, root: Path) -> dict:
    raw = file_from_payload(payload)
    if not raw:
        return {}
    rel = to_repo_relative(root, raw)
    if not rel:
        return {}
    package = classify_path(rel)
    if not package:
        return {}
    packages = read_state(root)
    packages.add(package)
    write_state(root, packages)
    print(f"verify-build: marked {package} dirty ({rel})", file=sys.stderr)
    return {}


def dirty_from_git(root: Path) -> set[str]:
    try:
        completed = subprocess.run(
            ["git", "status", "--porcelain", "-uall"],
            cwd=root,
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError:
        return set()
    if completed.returncode != 0:
        return set()
    packages: set[str] = set()
    for line in completed.stdout.splitlines():
        if len(line) < 4:
            continue
        path = line[3:].strip()
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        package = classify_path(path)
        if package:
            packages.add(package)
    return packages


def ensure_pnpm_dependencies(root: Path) -> None:
    """Workspace packages are linked only after `pnpm install`."""
    marker = root / "apps" / "app" / "node_modules" / "@tazakhabar" / "shared-types"
    if marker.exists():
        return
    print("verify-build: workspace deps missing; running pnpm install", file=sys.stderr)
    completed = subprocess.run(
        ["pnpm", "install", "--frozen-lockfile"],
        cwd=root,
        env=sanitize_env(),
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        output = ((completed.stdout or "") + (completed.stderr or "")).strip()
        raise RuntimeError(f"pnpm install failed (exit {completed.returncode}): {output}")


def handle_stop(payload: dict, root: Path) -> dict:
    status = payload.get("status") or "completed"
    if status != "completed":
        return {}

    loop_count = payload.get("loop_count")
    if isinstance(loop_count, int) and loop_count >= 3:
        print("verify-build: loop_count limit reached; skipping", file=sys.stderr)
        return {}

    packages = read_state(root) | dirty_from_git(root)
    if not packages:
        return {}

    checks = checks_for(packages)
    if not checks:
        clear_state(root)
        return {}

    if packages & {"app", "admin", "shared-types"}:
        try:
            ensure_pnpm_dependencies(root)
        except RuntimeError as exc:
            return {
                "followup_message": (
                    "Local verify-build hook failed: could not install pnpm workspace "
                    f"dependencies.\n\n```\n{exc}\n```"
                )
            }

    failures: list[str] = []
    for label, command in checks:
        print(f"verify-build: running {label}", file=sys.stderr)
        ok, body = run_check(root, label, command)
        if not ok:
            failures.append(f"### {label}\n```\n{body}\n```")

    if not failures:
        clear_state(root)
        print("verify-build: all checks passed", file=sys.stderr)
        return {}

    joined = "\n\n".join(failures)
    message = (
        "Local verify-build hook failed after your last turn. "
        "Fix the errors below, then stop again so checks re-run. "
        "Do not claim the task is done until these pass.\n\n"
        f"{joined}"
    )
    return {"followup_message": message}


def main() -> int:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        emit({})
        return 0

    root = project_root()
    event = (
        payload.get("hook_event_name")
        or payload.get("event")
        or payload.get("event_name")
        or ""
    )

    if event in {"afterFileEdit", "afterTabFileEdit"}:
        result = handle_after_file_edit(payload, root)
    elif event == "stop":
        result = handle_stop(payload, root)
    else:
        # Fail open on unknown events.
        result = {}

    emit(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
