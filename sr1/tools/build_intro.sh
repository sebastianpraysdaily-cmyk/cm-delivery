#!/usr/bin/env bash
# Builds the vertical (1080x1920) intro from the extracted clips.
# Usage: build_intro.sh <clips_dir> <out.mp4>
set -euo pipefail
C="$1"; OUT="$2"; T="$(mktemp -d)"
HANDLE="${HANDLE:-@mcbobistein}"   # creator handle shown over the closing shot
FONT="${FONT:-/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf}"
# seg  file                          in    out   extra-filter
SEGS=(
  "1 clip01_counter-dumbbells.mp4     0.000 1.567 null"
  "2 clip02_att-hype-dance.mp4        1.900 3.550 crop=886:1744:0:126"
  "3 clip04_doorway-sprint-laugh.mp4  0.000 2.133 null"
  "4 clip03_can-point-hallway.mp4     0.700 3.700 PUNCH"
  "5 clip05_hooded-slump.mp4          0.000 2.800 PUNCH"
)
LIST="$T/list.txt"; : > "$LIST"; CUTS=(); acc=0
for s in "${SEGS[@]}"; do
  read -r n f a b x <<<"$s"; d=$(python3 -c "print(round($b-$a,3))")
  if [ "$x" = PUNCH ]; then
    # slow 7% push-in over the segment, done before compositing
    x="scale=w='trunc(iw*(1+0.07*t/$d)/2)*2':h='trunc(ih*(1+0.07*t/$d)/2)*2':eval=frame,crop=886:1920"
  fi
  ffmpeg -v error -y -ss "$a" -t "$d" -i "$C/$f" -filter_complex "
    [0:v]$x,setsar=1,split[a][b];
    [a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:3,eq=brightness=-0.08[bg];
    [b]scale=-2:1920[fg];
    [bg][fg]overlay=(W-w)/2:0,setsar=1,fps=30,format=yuv420p,fade=in:st=0:d=0.1:color=white[v];
    [0:a]aresample=48000,afade=in:d=0.02,afade=out:st=$(python3 -c "print($d-0.03)"):d=0.03[a]" \
    -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 10 -c:a pcm_s16le "$T/s$n.mov"
  echo "file '$T/s$n.mov'" >> "$LIST"
  [ "$n" != 1 ] && CUTS+=("$acc"); acc=$(python3 -c "print(round($acc+$d,3))")
done
ffmpeg -v error -y -f concat -safe 0 -i "$LIST" -c copy "$T/joined.mov"
# SFX: whoosh into each cut (peaks on the cut), sub boom on the final cut
ffmpeg -v error -y -f lavfi -i "anoisesrc=c=pink:d=0.35:a=0.6:r=48000" \
  -af "highpass=f=400,lowpass=f=6000,afade=in:d=0.28:curve=exp,afade=out:st=0.28:d=0.07,volume=0.5" "$T/whoosh.wav"
ffmpeg -v error -y -f lavfi -i "sine=f=55:d=0.7:r=48000" \
  -af "volume=1.6,afade=out:d=0.7:curve=exp" "$T/boom.wav"
inputs=(); fc=""; mix="[0:a]"; k=1; last=$((${#CUTS[@]}))
for t in "${CUTS[@]}"; do
  ms=$(python3 -c "print(max(0,int(($t-0.28)*1000)))")
  inputs+=(-i "$T/whoosh.wav"); fc+="[$k:a]adelay=${ms}|${ms}[w$k];"; mix+="[w$k]"; k=$((k+1))
done
bms=$(python3 -c "print(int(${CUTS[$((last-1))]}*1000))")
inputs+=(-i "$T/boom.wav"); fc+="[$k:a]adelay=${bms}|${bms}[w$k];"; mix+="[w$k]"; k=$((k+1))
# handle pops in 0.5s into the final shot: slides up 60px + fades in over 0.25s
H0=$(python3 -c "print(${CUTS[$((last-1))]}+0.5)")
P="min(1\\,max(0\\,(t-$H0)/0.25))"
VF="[0:v]drawtext=fontfile=$FONT:text='$HANDLE':fontsize=84:fontcolor=white:borderw=5:bordercolor=black:box=1:boxcolor=0x00A8E0@0.85:boxborderw=26:x=(w-text_w)/2:y=1200+60*(1-$P):alpha=$P:enable='gte(t\\,$H0)'[v]"
ffmpeg -v error -y -i "$T/joined.mov" "${inputs[@]}" -filter_complex \
  "${VF};${fc}${mix}amix=inputs=$k:duration=first:normalize=0,alimiter=limit=0.95[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 14 -profile:v high -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 256k -movflags +faststart "$OUT"
echo "cuts at: ${CUTS[*]}  total: $acc"
rm -rf "$T"
