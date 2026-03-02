#!/usr/bin/env bash
set -euo pipefail

# Convert heavy JPG/PNG images under img/ to WebP in img-webp/.
# Originals are kept.
#
# Usage:
#   bash scripts/optimize-images.sh
#   MAX_WIDTH=1920 MIN_KB=300 bash scripts/optimize-images.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT_DIR/img"
OUT_DIR="$ROOT_DIR/img-webp"
MAX_WIDTH="${MAX_WIDTH:-1920}"
MIN_KB="${MIN_KB:-300}"

if ! command -v cwebp >/dev/null 2>&1; then
  echo "cwebp not found. Install webp tools first."
  exit 1
fi
if ! command -v sips >/dev/null 2>&1; then
  echo "sips not found. This script expects macOS sips."
  exit 1
fi

mkdir -p "$OUT_DIR"

total_before=0
total_after=0
converted=0
skipped=0

while IFS= read -r -d '' src; do
  size_bytes=$(stat -f%z "$src")
  size_kb=$((size_bytes / 1024))
  if (( size_kb < MIN_KB )); then
    continue
  fi

  base_name="$(basename "${src%.*}")"
  out="$OUT_DIR/$base_name.webp"

  # Skip if destination exists and is newer than source.
  if [[ -f "$out" && "$out" -nt "$src" ]]; then
    skipped=$((skipped + 1))
    continue
  fi

  ext="${src##*.}"
  ext="$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')"
  quality=76
  if [[ "$ext" == "png" ]]; then
    quality=82
  fi

  width=$(sips -g pixelWidth "$src" 2>/dev/null | awk '/pixelWidth/{print $2; exit}')
  resize_args=()
  if [[ -n "${width:-}" && "$width" =~ ^[0-9]+$ && "$width" -gt "$MAX_WIDTH" ]]; then
    resize_args=(-resize "$MAX_WIDTH" 0)
  fi

  cwebp -quiet -q "$quality" -m 6 -af -sharp_yuv "${resize_args[@]}" "$src" -o "$out"

  out_bytes=$(stat -f%z "$out")
  total_before=$((total_before + size_bytes))
  total_after=$((total_after + out_bytes))
  converted=$((converted + 1))
  printf '✓ %s -> %s (%dKB -> %dKB)\n' "${src#$ROOT_DIR/}" "${out#$ROOT_DIR/}" "$size_kb" $((out_bytes/1024))
done < <(find "$SRC_DIR" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0)

if (( converted > 0 )); then
  reduction=$(( (total_before - total_after) * 100 / total_before ))
  echo "Converted: $converted files"
  echo "Skipped (already up-to-date): $skipped files"
  echo "Total: $((total_before/1024/1024))MB -> $((total_after/1024/1024))MB (-${reduction}%)"
else
  echo "No files converted. Skipped (already up-to-date): $skipped files"
fi
