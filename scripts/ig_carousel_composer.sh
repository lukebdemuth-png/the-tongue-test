#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOL="$ROOT_DIR/src/ig_carousel_composer.py"

usage() {
  cat <<'USAGE'
IG Carousel Composer

Deterministic local renderer for final Instagram stills.

Commands:
  interactive              Guided sample config + render.
  sample [output.json]       Create a sample config.
  render CONFIG.json         Render PNGs from a config.

Examples:
  scripts/ig_carousel_composer.sh sample carousel_composer.example.json
  scripts/ig_carousel_composer.sh render carousel_composer.example.json

Canvas sizes in config:
  car_size = 1080 x 1350
  story    = 1080 x 1920
USAGE
}

interactive() {
  echo "IG Carousel Composer"
  echo "This creates final PNG stills locally, without ChatGPT layout drift."
  echo
  printf "Config file to create/use [carousel_composer.next.json]: "
  read -r config
  config="${config:-carousel_composer.next.json}"
  if [[ ! -f "$config" ]]; then
    python3 "$TOOL" sample --output "$config" >/dev/null
    echo "Created sample config: $config"
    echo "Edit this JSON with your slide text/art paths, then render again."
  fi
  echo "Rendering: $config"
  python3 "$TOOL" render --config "$config"
}

cmd="${1:-interactive}"
case "$cmd" in
  interactive)
    interactive
    ;;
  sample)
    output="${2:-carousel_composer.example.json}"
    python3 "$TOOL" sample --output "$output"
    ;;
  render)
    config="${2:-}"
    if [[ -z "$config" ]]; then
      echo "Missing CONFIG.json" >&2
      usage >&2
      exit 1
    fi
    python3 "$TOOL" render --config "$config"
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    usage >&2
    exit 1
    ;;
esac
