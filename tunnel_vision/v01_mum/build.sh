#!/usr/bin/env bash
# Build Tunnel Vision #1 into a new timestamped folder (never overwrites a finished video).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
NAME="tunnel-vision-01-mum-did-you-eat"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT="$ROOT/output/tunnel-vision/01_mum-did-you-eat/$STAMP"
mkdir -p "$OUT"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

python3 "$HERE/audio.py" "$TMP/mix.wav"
node "$HERE/render.js" "$TMP/mix.wav" "$OUT/$NAME.mp4" 30
ffmpeg -v error -y -ss 6.6 -i "$OUT/$NAME.mp4" -frames:v 1 -q:v 2 "$OUT/$NAME-thumb.jpg"
cp "$HERE/metadata.json" "$OUT/$NAME.json"

# Done only if ffprobe verifies: opens, has video + audio, full duration, decodes cleanly.
V="$OUT/$NAME.mp4"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$V" | grep -q '^1080,1920$'
ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of csv=p=0 "$V" | grep -q audio
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
python3 -c "import sys; d=float('$D'); sys.exit(0 if 19.9<=d<=20.1 else 1)"
ffmpeg -v error -i "$V" -f null -
SHA=$(sha256sum "$V" | cut -d' ' -f1)
MAN="$ROOT/output/tunnel-vision/MANIFEST.csv"
[ -f "$MAN" ] || echo "built_utc,video,path,duration_s,sha256" > "$MAN"
echo "$STAMP,$NAME.mp4,${OUT#$ROOT/}/$NAME.mp4,$D,$SHA" >> "$MAN"
echo "OK $V ($D s) sha256=$SHA"
