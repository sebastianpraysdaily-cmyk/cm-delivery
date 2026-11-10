# Autopilot: how the business runs without you

Goal: after a one-time setup (about 2 hours of your time), research, content, posting, sales, delivery and reporting run on their own. Your only ongoing job is reading a weekly report. Optional: approve rule changes the system isn't sure about.

## What runs, where, and how often

| Job | Runs on | Schedule | What it does |
|---|---|---|---|
| Rule watcher | GitHub Actions (free) | Daily | Checks each covered city's official STR page; flags any change and saves the old and new text |
| Research + writer | Claude scheduled task (fresh session) | Weekly | Finds newly regulated cities, updates checklists **quoting the official text with source links** (no paraphrased legal claims), drafts video configs and captions |
| Video factory | GitHub Actions | After the writer | Renders videos with the engine; quality gate (ffprobe, length, captions) |
| Poster | GitHub Actions | 2 posts/day/platform | YouTube Shorts via the Data API; TikTok, Instagram and Facebook once their apps are approved; buffer queue until then |
| Store + delivery | Lemon Squeezy or Gumroad | Instant | Takes payment, delivers the checklist PDF, starts the subscription |
| Email | Email tool (free tier) | Automatic | Free-checklist sign-ups get a 5-day series that ends with the offer; subscribers get rule-change alerts |
| Reporter | Claude scheduled task | Weekly | One page: views, sign-ups, sales, revenue, best video type, what it will try next |

## Guardrails (they protect the income)
- Every fact on screen and in a checklist comes from an official city page and shows that page's link and the date it was checked.
- If a page changes and the update is ambiguous, the system pauses that city's product and alerts you instead of guessing.
- No fake accounts, bought engagement, fabricated fines or impersonating a city or Airbnb. Each of these gets accounts banned.
- "Information service, not legal advice" disclaimer on every page and product; refund if anything we said was wrong.
- Max 2 posts per platform per day; kill switch file pauses all posting.

## One-time setup (you; about 2 hours)
1. **Store:** create a Lemon Squeezy (or Gumroad) account and connect payouts. Then give me an API key through the secure credential form. (15 min)
2. **YouTube:** create a channel for the brand, a Google Cloud project with the YouTube Data API, and an OAuth client; approve access once. (30 min)
3. **TikTok + Meta developer apps:** start the applications now; approval takes days to weeks. Until approved, those platforms get a ready-to-post queue. (30 min)
4. **Email tool:** create a free account and give me its API key. (10 min)
5. **GitHub:** turn on Actions for the repo and add the keys above as repository secrets. (10 min)
6. **Domain (~$12/year, optional):** buy one for the sales page. (10 min)
7. **Disclaimer:** read the one-paragraph disclaimer I draft, and ideally have a lawyer glance at it. (15 min)
8. **Network:** allow city government sites in this Claude environment's network settings, so scheduled research sessions can read official pages. (5 min)

## Costs
- $0 for software at the start (GitHub Actions free minutes, free email tier, store fees only on sales: about 5% + $0.50 per order on Lemon Squeezy).
- Optional domain ~$12/year.
- Claude scheduled tasks use your Claude plan's usage.

## Honest limits
- No system guarantees sales; the first 30 days are a test with a clear pass mark (30 sign-ups or 5 paid pre-orders per city).
- TikTok and Instagram auto-posting depend on their app approvals.
- Payments, identity, taxes and payouts legally stay in your name; the system can't create those accounts for you.
