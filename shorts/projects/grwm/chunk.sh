#!/bin/bash
# usage: chunk.sh <idx> <from> <to>
cd /home/user/cm-delivery/shorts
npx remotion render src/index.ts GetReadyWithMe out/grwm/part$1.mp4 --codec h264 --crf 16 --gl=swangle --browser-executable=/opt/pw-browsers/chromium --timeout=300000 --concurrency=2 --frames=$2-$3 --props='{"post":{"audio":false}}' > out/grwm/part$1.log 2>&1
echo "exit $?" >> out/grwm/part$1.log
