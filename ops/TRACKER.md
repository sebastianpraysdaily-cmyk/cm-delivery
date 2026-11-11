# Operator Tracker — Digital Products Business

Read this first every session. Update at the end of every session.

**Budget:** $20 hard cap · **Spent:** $0.21 confirmed (worst case $0.61, see spend log) · **Approved:** $1.20 for research

## Done
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
- **Waiting on Sebastian:** approve the Step 2 package (product, video, landing page, listing)

## Next
1. Step 2 proof package: product + name + description, 1 short video, landing page, shop listing copy, all on matching wording
3. Hand over one approval package with one link per item
4. After approval: Sebastian creates shop account (prep sheet will make it about 10 min)

## Open flags / drift
- Kokoro voice model (350MB) downloads from GitHub each new session; not committed.
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
| **Total** | | **$0.21 confirmed, ≤$0.61 worst case** | Remaining approved research budget: ≥$0.59 |
