#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/optimize-street-images.sh
# Requires: cwebp

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
IMG_DIR="$ROOT_DIR/img"
WEBP_DIR="$ROOT_DIR/img-webp"

mkdir -p "$WEBP_DIR"

echo "Optimizing street ride images to WebP..."
for i in 1 2 3 4 5 6 7; do
  in_file="$IMG_DIR/eXs steet_ride_${i}.jpg"
  out_file="$WEBP_DIR/eXs-steet_ride_${i}.webp"
  if [[ -f "$in_file" ]]; then
    cwebp -quiet -q 72 -m 6 -af -sharp_yuv -resize 1600 0 "$in_file" -o "$out_file"
    echo "  ✓ $out_file"
  else
    echo "  - skip (not found): $in_file"
  fi
done

echo "Optimizing street folding images to WebP..."
for i in 1 2; do
  in_file="$IMG_DIR/eXs-steet_folding_${i}.png"
  out_file="$WEBP_DIR/eXs-steet_folding_${i}.webp"
  if [[ -f "$in_file" ]]; then
    cwebp -quiet -q 80 -m 6 -af -sharp_yuv -resize 1600 0 "$in_file" -o "$out_file"
    echo "  ✓ $out_file"
  else
    echo "  - skip (not found): $in_file"
  fi
done

echo "Done."
