#!/usr/bin/env bash
# Frame-accurate extraction of usable clips from the source recording.
# Usage: extract_clips.sh <source.mov> <out_dir>
set -euo pipefail
SRC="$1"; OUT="$2"; mkdir -p "$OUT"
# id  start  end   name
CLIPS=(
  "01 0.333 1.900 counter-dumbbells"
  "02 2.000 8.600 att-hype-dance"
  "03 8.900 13.567 can-point-hallway"
  "04 13.633 15.767 doorway-sprint-laugh"
  "05 16.000 18.800 hooded-slump"
)
for c in "${CLIPS[@]}"; do
  read -r id s e name <<<"$c"
  ffmpeg -v error -y -ss "$s" -to "$e" -i "$SRC" \
    -c:v libx264 -preset slow -crf 12 -pix_fmt yuv420p \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    -c:a aac -b:a 256k -movflags +faststart \
    "$OUT/clip${id}_${name}.mp4"
  echo "clip$id $s-$e -> $OUT/clip${id}_${name}.mp4"
done
