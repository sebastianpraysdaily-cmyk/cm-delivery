#!/usr/bin/env bash
# Prepares clean 1080x1920 shots (silent) + one synced audio track for the 21st.dev editor.
# Usage: prep_edit_assets.sh <clips_dir> <out_dir>
set -euo pipefail
C="$1"; O="$2"; mkdir -p "$O"; T="$(mktemp -d)"
SEGS=(
  "1 clip01_counter-dumbbells.mp4     0.000 1.567 null"
  "2 clip02_att-hype-dance.mp4        1.900 3.550 crop=886:1744:0:126"
  "3 clip04_doorway-sprint-laugh.mp4  0.000 2.133 null"
  "4 clip03_can-point-hallway.mp4     0.000 4.600 null"
  "5 clip05_hooded-slump.mp4          0.000 2.800 null"
)
: > "$T/a.txt"
for s in "${SEGS[@]}"; do
  read -r n f a b x <<<"$s"; d=$(python3 -c "print(round($b-$a,3))")
  ffmpeg -v error -y -ss "$a" -t "$d" -i "$C/$f" -filter_complex "
    [0:v]$x,setsar=1,split[p][q];
    [p]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:3,eq=brightness=-0.08[bg];
    [q]scale=-2:1920[fg];[bg][fg]overlay=(W-w)/2:0,setsar=1,fps=30,format=yuv420p[v]" \
    -map "[v]" -an -c:v libx264 -preset slow -crf 14 -movflags +faststart "$O/shot$n.mp4"
  ffmpeg -v error -y -ss "$a" -t "$d" -i "$C/$f" -af "aresample=48000,afade=in:d=0.02,afade=out:st=$(python3 -c "print($d-0.03)"):d=0.03" -ac 2 "$T/a$n.wav"
  echo "file '$T/a$n.wav'" >> "$T/a.txt"
  echo "shot$n $d s"
done
ffmpeg -v error -y -f concat -safe 0 -i "$T/a.txt" -c:a pcm_s16le "$T/dialog.wav"
ffmpeg -v error -y -i "$T/dialog.wav" -af alimiter=limit=0.95 -c:a aac -b:a 256k "$O/dialog_track.m4a"
rm -rf "$T"
