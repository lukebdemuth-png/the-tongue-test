#!/usr/bin/env bash
set -u

echo "== Codex MCP =="
if command -v codex >/dev/null 2>&1; then
  codex mcp list || true
else
  echo "Codex CLI: not on PATH"
  echo "Note: OpenClaw may still be running this session through the native Codex runtime."
fi

echo
echo "== OpenClaw MCP =="
/Users/creative/.hermes/node/bin/openclaw mcp list || true

echo
echo "== Docker =="
docker --version || true
docker compose version || true
docker info >/dev/null && echo "Docker engine: running" || echo "Docker engine: not reachable"

echo
echo "== Docker MCP =="
docker mcp profile list || true
docker mcp profile show general >/dev/null && echo "Docker MCP profile general: found" || echo "Docker MCP profile general: missing"

echo
echo "== App Folders =="
for path in \
  "/Users/creative/Documents/New project" \
  "/Users/creative/YourMasterHomeopathy" \
  "/Users/creative/innate-wellness" \
  "/Users/creative/Desktop/AI App Launch System"
do
  if [ -d "$path" ]; then
    echo "found: $path"
  else
    echo "missing: $path"
  fi
done
