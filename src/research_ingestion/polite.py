from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path

from .config import DEFAULT_USER_AGENT
from .io import append_jsonl


def can_fetch(url: str, user_agent: str = DEFAULT_USER_AGENT) -> bool:
    parsed = urllib.parse.urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    parser = urllib.robotparser.RobotFileParser()
    parser.set_url(robots_url)
    try:
        parser.read()
    except Exception:
        return True
    return parser.can_fetch(user_agent, url)


def polite_get(
    url: str,
    *,
    user_agent: str = DEFAULT_USER_AGENT,
    delay_seconds: float = 0.34,
    respect_robots: bool = True,
    timeout: int = 30,
) -> bytes:
    if respect_robots and not can_fetch(url, user_agent=user_agent):
        raise PermissionError(f"robots.txt does not allow fetching {url}")
    time.sleep(delay_seconds)
    request = urllib.request.Request(url, headers={"User-Agent": user_agent})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def download_open_access_file(url: str, destination: Path, error_log: Path | None = None) -> bool:
    try:
        content = polite_get(url)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)
        return True
    except (PermissionError, urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
        if error_log:
            append_jsonl(
                error_log,
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "url": url,
                    "error": str(exc),
                    "policy": "open-access-only; robots respected; no login or paywall bypass",
                },
            )
        return False


def load_manifest(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))
