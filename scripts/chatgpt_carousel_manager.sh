#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_TOOL="$ROOT_DIR/src/carousel_manager.py"
BATCH_TOOL="$ROOT_DIR/scripts/create_stills_batch_prompts.sh"
DEFAULT_STORE="$ROOT_DIR/carousel_data/carousels.json"

usage() {
  cat <<'USAGE'
ChatGPT Carousel Manager Bash Wrapper

One command for Luke's IG carousel prompt system.

Canvas rules:
  car size / carousel portrait = 1080 x 1350
  story / IG story             = 1080 x 1920

Commands:
  setup       Create/update locked carousel style.
  slide       Record approved state for a slide.
  reject      Add ChatGPT mistakes to future do-not-repeat rules.
  prompt      Generate one strict prompt for one standalone still.
  card        Generate a carousel memory card.
  batch       Generate separate prompt files for a batch of stills.
  wizard      Interactive checklist + prompt builder.
  help        Show this help.

Examples:
  scripts/chatgpt_carousel_manager.sh wizard

  scripts/chatgpt_carousel_manager.sh setup \
    --carousel "Lion Pose" \
    --format car \
    --background-style "warm cinematic yogic background" \
    --color-palette "warm gold, cream, deep charcoal" \
    --lighting "warm cinematic lighting" \
    --text-style "strong hierarchy, elegant educational typography"

  scripts/chatgpt_carousel_manager.sh slide \
    --carousel "Lion Pose" \
    --slide 2 \
    --approved "Art, pose, typography hierarchy, and sacred geometry are approved." \
    --locked-elements "layout, spacing, geometry, crop, font, subject scale" \
    --editable-elements "only the smaller duplicate text layer"

  scripts/chatgpt_carousel_manager.sh prompt \
    --carousel "Lion Pose" \
    --slide 2 \
    --change "remove only the smaller duplicate versions of go, mukha, and asana"

  scripts/chatgpt_carousel_manager.sh batch \
    --carousel "Lion Pose" \
    --slides 5 \
    --format car

  scripts/chatgpt_carousel_manager.sh batch \
    --carousel "Cow Face" \
    --changes /path/to/changes.txt

Changes file format for batch:
  1|create slide 1 cover still
  2|replace the bottom 1 2 3 with checkmarks
  3|tighten only vertical spacing between text rows

Notes:
  - Every generated prompt requests exactly ONE standalone downloadable still.
  - The prompts forbid grids, contact sheets, collages, and multi-image previews.
  - Default local memory store: carousel_data/carousels.json
USAGE
}

run_interactive_batch() {
  echo "ChatGPT Carousel Manager"
  echo "This will create one separate prompt file per still."
  echo

  printf "Carousel name: "
  read -r carousel
  if [[ -z "$carousel" ]]; then
    echo "Carousel name is required." >&2
    exit 1
  fi

  printf "Format? Type car for 1080x1350 or story for 1080x1920 [car]: "
  read -r format
  format="${format:-car}"

  printf "How many stills/slides? [5]: "
  read -r slides
  slides="${slides:-5}"

  printf "Optional changes file path, or press Enter to use generic slide prompts: "
  read -r changes_file

  safe_name="$(printf '%s' "$carousel" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '_' | sed 's/^_//; s/_$//')"
  output_dir="$ROOT_DIR/carousel_prompts/${safe_name}"

  args=(
    --store "$DEFAULT_STORE"
    --carousel "$carousel"
    --slides "$slides"
    --format "$format"
    --output-dir "$output_dir"
  )
  if [[ -n "$changes_file" ]]; then
    args+=(--changes "$changes_file")
  fi

  "$BATCH_TOOL" "${args[@]}"

  echo
  echo "Your prompt files are here:"
  echo "  $output_dir"
  echo
  echo "Start with:"
  echo "  $output_dir/slide_01_prompt.txt"
  echo
  echo "Paste ONE prompt into ChatGPT at a time."

  if command -v open >/dev/null 2>&1; then
    open "$output_dir" >/dev/null 2>&1 || true
  fi
}

if [[ $# -lt 1 ]]; then
  run_interactive_batch
  exit 0
fi

cmd="$1"
shift

case "$cmd" in
  setup)
    python3 "$PYTHON_TOOL" --store "$DEFAULT_STORE" init "$@"
    ;;
  slide)
    python3 "$PYTHON_TOOL" --store "$DEFAULT_STORE" slide "$@"
    ;;
  reject)
    python3 "$PYTHON_TOOL" --store "$DEFAULT_STORE" reject "$@"
    ;;
  prompt)
    python3 "$PYTHON_TOOL" --store "$DEFAULT_STORE" prompt "$@"
    ;;
  card)
    python3 "$PYTHON_TOOL" --store "$DEFAULT_STORE" card "$@"
    ;;
  wizard)
    python3 "$PYTHON_TOOL" --store "$DEFAULT_STORE" wizard "$@"
    ;;
  batch)
    "$BATCH_TOOL" --store "$DEFAULT_STORE" "$@"
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
