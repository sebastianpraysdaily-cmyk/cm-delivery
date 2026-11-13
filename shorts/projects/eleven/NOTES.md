# Eleven Years — production notes

- Script + fact source: `SCRIPT.md`. Voice: Fish Audio "Slax" (s2.1-pro), 3 chunks, trimmed, joined with 0.45 s gaps, atempo 1.07 → `voice/voice.wav` (68.3 s).
- Word timings: `align.py` (pause-based forced alignment: ffmpeg silencedetect segments + syllable-weighted DP over the known text) → `voice/words.json`. No ASR model needed.
- Picture: `src/videos/eleven/` (composition `ElevenShort`, 1080x1920, 30 fps, 2065 f). Shared look modules from the cartoon-3d-short skill (toon, ink, lensblur, grade, shade, cardshade); new: `story.ts` (shots/cameras/beats), `office.ts` (world), `cast.ts` (staging), `lights.ts` presets office/dim/horror.
- Sound: `audio/soundtrack.py` (score + SFX + mix, uses the skill's dsp.py / instruments.py) → `audio/mix.wav` (-14.4 LUFS, -1.9 dBTP) and `public/eleven/mix.wav`.
- Stills: `node scripts/stills.mjs ElevenShort out/eleven/x_ 100,400 0.5` (software GL "swangle", ~10 s/still).
- Final: `npx remotion render src/index.ts ElevenShort out/eleven/video.mp4 --codec=h264 --crf=16 --concurrency=4 --timeout=300000 --gl=swangle --browser-executable=/opt/pw-browsers/chromium --props='{"post":{"audio":false}}'`, then mux `-map 0:v:0 -map 1:a:0` with the mix. ~3 s/frame on 4 CPU cores (no GPU): rendered at 1080x1920 instead of 2K.

## Changing timing
Any change to story.ts beat frames → re-run `python3 projects/eleven/audio/soundtrack.py` (its beat table mirrors story.ts).
