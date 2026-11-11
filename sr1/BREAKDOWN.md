# sr1 — Screen recording breakdown + intro edit

Creator: **@mcbobistein** (TikTok)

Source: `copy_26071642-…mov`: 18.83 s, 886×1920 HEVC, 30 fps, AAC 44.1 kHz.

**Note on the source:** this upload is an already-edited compilation, not a raw screen recording. It has no phone UI, no scrolling and no loading screens. Its metadata says it was exported from an editor (`te_is_reencode`, Dreamina). It has a continuous music/voice bed, and clip 02 has word-by-word captions burned in. Cut points were found with ffmpeg `scdet` and checked frame by frame.

## Footage breakdown

| ID | Source in → out | Dur | What happens | Best moment | Usable | Entertainment |
|----|-----------------|-----|--------------|-------------|--------|---------------|
| 01 | 0.333 → 1.900 | 1.57 s | Camera pans off the register. The employee in the "Next Level Network" crew-neck and cap lifts two dumbbells overhead behind the counter. | 0.9–1.9: arms locked overhead, deadpan face | 1.5 s | ★★★★ (unexpected, works as a hook) |
| 02 | 2.000 → 8.600 | 6.6 s | AT&T employee (blue tee, black hoodie) hype-dances toward the camera. Burned-in captions follow the audio. The camera whips to the front door and back, ending on a close grin and a door swing. | 3.9–5.55: walks up to the lens, "HEY / YOU / GO / LET'S" | 1.6–2.5 s | ★★★★ (energy, personality) |
| 03 | 8.900 → 13.567 | 4.7 s | Hallway selfie shot. Guy in glasses stares flat at the camera, then leans in with a green soda can and points right at the lens, talking. | 10.3–12.5: lean-in point | 3.0 s | ★★★★ (direct address, curiosity) |
| 04 | 13.633 → 15.767 | 2.13 s | Coworker sprints through a back doorway at the camera, then cracks up laughing and slaps the wall. | 14.6–15.6: wall-slap laugh | 2.1 s | ★★★★★ (natural comedy, peak energy) |
| 05 | 16.000 → 18.800 | 2.8 s | Hooded employee with a mask slumps on a red ottoman on the sales floor. The camera pushes in to an extreme close-up of his face. | 17.0–18.8: close-up slump | 2.8 s | ★★★★ (comedic deflation, ending) |

Cut from every clip: the "wait for it" caption at 0.00–0.33, the whip-pan transition at 1.90–2.00, the black frame at 8.80, the floor/walking transition at 15.77–16.00, and the door swing at the end of 02. These cuts drop every frame of dead time and every transition left over from the earlier edit.

## Extracted clips — `clips/`
The cuts are frame-accurate. The source only has a keyframe every 1 s, so a plain stream copy would cut at the wrong frames. Each clip was re-encoded instead with x264 at CRF 12 (preset slow), AAC at 256 kbps, and BT.709 tags. That keeps the clips visually lossless at the native 886×1920 size, with nothing cropped or scaled.
Rebuild with `tools/extract_clips.sh <source.mov> clips`.

## Intro edit — `intro_vertical_1080x1920.mp4` (11.13 s, 1080×1920, 9:16, 30 fps)

| # | Time in intro | Clip (clip-relative in → out) | Purpose |
|---|---------------|-------------------------------|---------|
| 1 | 0.00–1.57 | 01 (0.00–1.57) | Hook: pan reveal of the dumbbell lift |
| 2 | 1.57–3.22 | 02 (1.90–3.55) | Energy: hype walk-up |
| 3 | 3.22–5.35 | 04 (0.00–2.13) | Peak: sprint and laugh |
| 4 | 5.35–8.35 | 03 (0.70–3.70) | Beat: flat stare, then lean in and point (slow 7% push-in) |
| 5 | 8.35–11.15 | 05 (0.00–2.80) | Payoff: slump and push-in, with **@mcbobistein** sliding in at 8.85 s |

Editing choices:
- **Audio sync:** every shot keeps its own original audio, with 20–30 ms fades to stop clicks. Dialogue was not moved or rearranged, so no line is taken out of context, and clip 02's burned-in captions still match what is said.
- **SFX:** a synthesized whoosh peaks on each cut, and a 55 Hz sub-boom lands on the final cut. A limiter caps peaks at −0.2 dBFS; average level is −14.7 dB.
- **Motion graphics:** a 0.1 s white flash opens each shot, two shots get push-ins, and the handle slides up and fades in.
- **Vertical format:** the native 886-px-wide picture is centered at full height on a blurred, darkened fill of itself. The footage is not upscaled and no heads are cropped. Clip 02 has a black letterbox band in the source (up to 123 px top and 48 px bottom), which is cropped out.
- **Handle placement:** the handle sits at y≈1200–1300, above TikTok's caption/UI area at the bottom of the screen.

Rebuild with `tools/build_intro.sh clips intro_vertical_1080x1920.mp4`. Set the `HANDLE=` environment variable to change the handle text.

## Quality control results
- Checked the first 3 and last 3 frames of every clip: no transition frames, black frames or carried-over captions.
- Checked frames around every cut in the intro: no black bars left after the crop. Clip 02 was trimmed to end before the whip blur.
- A/V: video 11.133 s against audio 11.150 s. The 1-frame difference comes from rounding at 30 fps and does not drift, because each segment keeps its own audio.
- Output: 1080×1920, SAR 1:1, DAR 9:16, H.264 High with yuv420p, AAC 256 kbps, faststart.

## Limitations
- **No transcript.** No speech-to-text model was available offline, and the network blocked the model download. Dialogue was judged from the burned-in captions, the visuals and the audio energy only.
- **Burned-in profanity and slurs.** Clip 02's captions include profanity and a slur, and they are part of the source picture. The intro uses the 1.90–3.55 window, which shows only "HEY / WHAT / YOU / LET'S / GO / FUCKING". Clip 02 outside that window shows the slur, and it can't be removed without the uncaptioned original.
- **Platform rules.** Some platforms may flag the profanity in the remaining captions.
