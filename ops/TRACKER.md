# Operator Tracker — Digital Products Business

Read this first every session. Update at the end of every session.

**Budget:** $20 hard cap · **Spent:** $0.52 confirmed (worst case $0.92, see spend log) · **Approved:** $1.20 for research

## Done
- 2026-11-11 · Constraint: **Sebastian will not film anything.** All video must be produced without his footage (screen recordings, AI-generated scenes, animated real product pages).
- 2026-11-11 · Art redesign prototype (AI line-art units you color in, bestseller pattern) → `product/savings-sprints/v2/`. Waiting on his OK for the direction.
- 2026-11-11 · Format + market check (`ops/step2c-format-and-market.md`): winners are real hands+paper footage and talking heads; animated graphics 1/24. Broad savings-challenge audience has the bigger ceiling (4.5M top, 8.7M sample views) vs ADHD niche (0.49M top).
- 2026-11-11 · More juice (Sebastian: "stuff like that"): coins fly into total, combo heat glow + flames, ON FIRE banner at x10, loot chest reveal with light rays, holographic tilt cards (badges + celebrations), 3D tilt parallax tracker + breathing bubbles, shake-to-roll on Mystery Sprint, level-up flash + shockwave. Contrast fix for filled bubbles on yellow trackers. Video v003 re-recorded with the new effects.
- 2026-11-11 · Decided: web app (PWA) not native (App Store $99/yr + Play $25 > budget). Haptics: Android yes, iPhone limited (Safari has no Vibration API; switch-trick may be patched in iOS 26.5, unverified). Tilt works (iPhone asks once).
- 2026-11-11 · **Savings Sprints app** built: XP, levels, combos, streak freeze, loot, milestones, 12 badges, unlocks; haptics, WebAudio, tilt-reactive confetti → `product/savings-sprints/app/` · preview https://claude.ai/artifact/XURVPhf94hM6LFxG3qLQkf
- 2026-11-11 · Video v003 (30s): 'rigged' controversy hook + real app screen recording → `content/v003/` · `content/record_app.js`, `content/compose_v003.py`
- 2026-11-11 · Landing v3: rigged hook, app video in phone frame, playable sprint (same engine) → https://claude.ai/artifact/BChDiB5kFLLMhJwSNkHu1G
- 2026-11-11 · Sebastian: Forget-Proof Money not attention-grabbing → researched 5 options; GTA 6 checked twice (no fit)
- 2026-11-11 · Sales proof: savings-challenge bundles 1,049–2,376 reviews on Etsy; ADHD versions rare (8–14 reviews)
- 2026-11-11 · **New product: Savings Sprints** (12 color-in trackers, Letter + A6 PDF, spreadsheet with color-fill) → `product/savings-sprints/`
- 2026-11-11 · Video v002 (32s) → `content/v002/` · renderer `content/render_v002.py`
- 2026-11-11 · Landing page (21st.dev components, live tracker) → https://claude.ai/artifact/BChDiB5kFLLMhJwSNkHu1G
- 2026-11-11 · Checked Composio connections, prices and limits → `ops/capabilities.md`
- 2026-11-11 · Confirmed free local video stack exists in repo (Kokoro TTS, faster-whisper, fonts, ffmpeg) → $0 per video
- 2026-11-11 · Step 1 pass 1: free desk research, provisional top-5 ranking → `ops/step1-research.md`

- 2026-11-11 · Step 1 pass 2: 138 real TikTok videos scraped and analyzed → **pick: ADHD money** (`ops/step1-research.md`, data in `ops/data/`)

- 2026-11-11 · Step 2 sub-angle data (55 more videos): "system / bank accounts" beats "ADHD tax / subscriptions"
- 2026-11-11 · Step 2 product built: **Forget-Proof Money** (14pp PDF + tested spreadsheet) → `product/forget-proof-money/`
- 2026-11-11 · Step 2 video v001 rendered (34s, free stack) → `content/v001/` · renderer `content/render.py`
- 2026-11-11 · Landing page v2: rebuilt from 5 adapted 21st.dev components (source `product/forget-proof-money/landing-app/`, `npm i && npm run build`) → https://claude.ai/artifact/415P38hxrArrtUcnKNrnEE
- 2026-11-11 · Approval package → https://claude.ai/artifact/89kbpDdSedFoVH5nwBTtzj

## In progress
- **Waiting on Sebastian:** approve package (https://claude.ai/artifact/89kbpDdSedFoVH5nwBTtzj) + OK to host the app publicly (free) so he can test tilt/haptics on his phone

## Next
1. Step 2 proof package: product + name + description, 1 short video, landing page, shop listing copy, all on matching wording
3. Hand over one approval package with one link per item
4. After approval: Sebastian creates shop account (prep sheet will make it about 10 min)

## Open flags / drift
- Kokoro voice model (350MB) downloads from GitHub each new session; not committed.
- 21st.dev video blocks (Remotion) need the 21st.dev registry host + API key; this container can't reach it. Built v002 in own renderer instead.
- Drift caught: v1 landing page skipped 21st.dev despite the brief. Fixed in v2. Rule: check named tools (21st.dev, Composio) before building anything.
- Container cannot open most sites directly (Etsy, TikTok, data blogs return 403/blocked). Research runs through web search summaries, which are weaker evidence. Paid Composio scrapers fill the gap for cents.
- Arena skill is **not installed**. High-stakes picks are not bracket-tested until it is added.
- Repo also holds assets from an earlier psychology-video project (voiceovers, clips, reference sheets). Kept, not used yet.

## Milestones (revenue)
| Milestone | Target | Status |
|---|---|---|
| First sale | — | not started |
| $100 total | — | not started |
| $1,000/mo | — | not started |

## Spend log
| Date | Item | Cost | Note |
|---|---|---|---|
| 2026-11-11 | Apify TikTok posts scrape (16 terms) | $0.00–0.30 | Run completed but Composio's response check failed; data lost. Reported to Composio. Charge not shown |
| 2026-11-11 | Apify tiny test runs ×2 | $0.00–0.02 | Same failure, confirmed it's systematic |
| 2026-11-11 | Serper Google searches ×3 batches | $0.009 | Confirmed charges |
| 2026-11-11 | Apify TikTok video stats (138 videos) | $0.141 | Confirmed charges |
| 2026-11-11 | Apify video batch that timed out | $0.00–0.08 | Charge not shown |
| 2026-11-11 | Serper: sub-angle search + 2 name checks | $0.009 | Confirmed |
| 2026-11-11 | Apify TikTok video stats (55 videos) | $0.055 | Confirmed |
| 2026-11-11 | Serper search + 6 Etsy page scrapes + format search | $0.010 | Confirmed |
| 2026-11-11 | Apify TikTok video stats (73 videos, 10 formats) | $0.073 | Confirmed |
| 2026-11-11 | GTA 6 check: Serper + Apify (55 videos) | $0.058 | Confirmed |
| 2026-11-11 | GTA creator-market check: Serper + Apify (38 videos) | $0.041 | Confirmed |
| 2026-11-11 | Sales proof: Serper search + ~46 Etsy listing scrapes + name check | $0.033 | Confirmed (approx., scrape run timed out client-side but completed) |
| 2026-11-11 | Format + market research: Serper + Apify (83 videos, covers) | $0.086 | Confirmed |
| **Total** | | **$0.52 confirmed, ≤$0.92 worst case** | Remaining approved research budget: ≥$0.28 |
