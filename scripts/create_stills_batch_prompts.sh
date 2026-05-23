#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Create separate ChatGPT Carousel Manager prompts for a batch of Instagram stills.

Default output:
  carousel_prompts/<safe-carousel-name>/slide_01_prompt.txt

Usage:
  scripts/create_stills_batch_prompts.sh --carousel "Carousel Name" [options]

Options:
  --carousel NAME       Required carousel name stored in Carousel Manager.
  --slides N            Number of slides to generate prompts for. Default: 5.
  --format FORMAT       car_size/car/story. Default: car_size.
                        car_size = 1080 x 1350, story = 1080 x 1920.
  --changes FILE        Optional file with one change per line:
                        slide_number|exact requested change
  --output-dir DIR      Optional output directory. Default: carousel_prompts/<carousel>.
  --new-slide           Generate NEW SLIDE LOCK prompts instead of edit prompts.
  --must-stay TEXT      Optional global "must stay identical" text.
  --store PATH          Optional carousel store. Default: carousel_data/carousels.json.

Examples:
  scripts/create_stills_batch_prompts.sh --carousel "Lion Pose" --slides 5

  scripts/create_stills_batch_prompts.sh \
    --carousel "Cow Face" \
    --changes /tmp/cow_face_changes.txt

Changes file example:
  1|create slide 1 cover still for Cow Face Pose
  2|replace the bottom 1 2 3 with checkmarks
  3|tighten only vertical spacing between text rows

Notes:
  This intentionally creates one prompt per slide so ChatGPT outputs one
  downloadable still at a time, not a grid/contact sheet.
USAGE
}

carousel=""
slides="5"
format="car_size"
changes_file=""
output_dir=""
new_slide="false"
must_stay=""
store="carousel_data/carousels.json"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --carousel)
      carousel="${2:-}"
      shift 2
      ;;
    --slides)
      slides="${2:-}"
      shift 2
      ;;
    --format)
      format="${2:-}"
      shift 2
      ;;
    --changes)
      changes_file="${2:-}"
      shift 2
      ;;
    --output-dir)
      output_dir="${2:-}"
      shift 2
      ;;
    --new-slide)
      new_slide="true"
      shift
      ;;
    --must-stay)
      must_stay="${2:-}"
      shift 2
      ;;
    --store)
      store="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$carousel" ]]; then
  echo "Missing required --carousel NAME" >&2
  usage >&2
  exit 1
fi

if ! [[ "$slides" =~ ^[0-9]+$ ]] || [[ "$slides" -lt 1 ]]; then
  echo "--slides must be a positive integer" >&2
  exit 1
fi

if [[ -n "$changes_file" && ! -f "$changes_file" ]]; then
  echo "Changes file not found: $changes_file" >&2
  exit 1
fi

safe_name="$(printf '%s' "$carousel" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '_' | sed 's/^_//; s/_$//')"
if [[ -z "$output_dir" ]]; then
  output_dir="carousel_prompts/${safe_name}"
fi

mkdir -p "$output_dir"

python3 src/carousel_manager.py --store "$store" init \
  --carousel "$carousel" \
  --format "$format" >/dev/null

change_for_slide() {
  local requested_slide="$1"
  local line slide_number change_text
  if [[ -z "$changes_file" ]]; then
    return 1
  fi
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    slide_number="${line%%|*}"
    change_text="${line#*|}"
    if [[ "$slide_number" == "$line" || -z "$slide_number" || -z "$change_text" ]]; then
      continue
    fi
    if [[ "$slide_number" == "$requested_slide" ]]; then
      printf '%s' "$change_text"
      return 0
    fi
  done < "$changes_file"
  return 1
}

for slide in $(seq 1 "$slides"); do
  if change_from_file="$(change_for_slide "$slide")"; then
    change="$change_from_file"
  else
    change="create slide ${slide} as one standalone Instagram still for this carousel"
  fi
  prompt_path="$(printf '%s/slide_%02d_prompt.txt' "$output_dir" "$slide")"
  args=(
    src/carousel_manager.py
    --store "$store"
    prompt
    --carousel "$carousel"
    --slide "$slide"
    --change "$change"
    --output "$prompt_path"
  )
  if [[ "$new_slide" == "true" ]]; then
    args+=(--new-slide)
  fi
  if [[ -n "$must_stay" ]]; then
    args+=(--must-stay "$must_stay")
  fi
  python3 "${args[@]}" >/dev/null
done

cat <<DONE
Created ${slides} separate ChatGPT prompts:
  ${output_dir}

Paste each slide prompt into ChatGPT one at a time.
This prevents ChatGPT from creating one combined grid/contact sheet.
DONE
