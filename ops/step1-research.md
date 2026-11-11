# Step 1: Niche Research

> **Pass 2 (real TikTok data) is at the bottom and supersedes the provisional pick.**

## Pass 1 (provisional, free desk research)

Date: 2026-11-11 · Method: free web search (summaries of public pages). Direct page access to Etsy/TikTok is blocked from this container, so the evidence below is weaker than it should be for a final pick.

**Labels:** ✅ verified (checked against a primary source) · 🟡 partly verified (one credible secondary source with method stated) · ⚪ unverified (vendor blog, self-reported, or no method)

## Market-level findings
| Finding | Label | How checked |
|---|---|---|
| Etsy has about 11.06M "digital download" listings, $4.00 median price in the top 100 results | 🟡 | Optimsy measured live Etsy search (single snapshot, Nov 2026) |
| Canva templates: about 1.85M listings, $5.34 median. Digital stickers: about 591k listings, $3.99 | 🟡 | Same Optimsy snapshot |
| Wedding templates have the highest median price ($12.36); single coloring pages among the lowest ($2.99) | 🟡 | Same Optimsy snapshot |
| Etsy sellers report falling sales and "AI slop" crowding in 2026 | 🟡 | Marketplace.org reporting (Aug 2026) plus many seller threads |
| Gumroad: Self-Improvement about $8.5k per product, Writing & Publishing $15.7k per product (226 products) | ⚪ | InsightRaider estimate (ratings × price × multiplier); revenue period unknown |
| Generic AI prompt packs are saturated; Etsy may restrict some prompt sales | ⚪ | Several seller blogs; policy claim from one article, not confirmed |
| Keyword tool RankHero inflates search volume 17×–67,000× | 🟡 | SellerToolsHQ tested 11 keywords against Etsy's own data |

**What this means:** generic categories are crowded and Etsy search traffic is getting worse. Selling through our own short videos and a landing page (not relying on Etsy search) is the right channel. The niche must be one where short videos naturally create buyers.

## Top 5 (provisional ranking)
Scores 1–5. "Content fit" = how naturally short videos sell this product.

| # | Niche | Demand | Growth | Competition (5 = low) | Price | Gap | Content fit | Stage |
|---|---|---|---|---|---|---|---|---|
| 1 | **ADHD / neurodivergent life tools** (printable + digital kits) | 4 | 4 | 2 head term / 4 sub-niches | $9–24 | Specific situations (money, cleaning, mornings) | 5 | Peaking at head term, early in sub-niches |
| 2 | **Money reset tools** (budget, sinking funds, cash stuffing) | 4 | 3 (January spike) | 2 | $4–30 | ADHD-friendly / low-effort versions | 4 | Saturated generic, timing advantage now |
| 3 | **Bold & easy coloring** (adult/teen) | 4 | 3 | 2 | $3–8 | Seasonal themes, specific fandom-free aesthetics | 5 | Peaking |
| 4 | **Psychology / self-improvement guides** | 4 | 3 | 2 generic / 3 specific | $9–29 | Specific angles over generic "dark psychology" | 4 | Saturated generic, early for specific angles |
| 5 | **Seasonal kids printables** (Christmas activity packs) | 4 now | 5 (until Dec 20) | 2 | $3–30 | Premium themed bundles | 3 | Peaking, window closes in about 5 weeks |

### Evidence per niche
1. **ADHD tools.** "Neurodivergent planner" search up 53% year over year (⚪ RankHero, unreliable on volume, trend direction only). "ADHD planner" has about 75k competing results (⚪). "ADHD workbook" interest down 38% (⚪). Market of specific ADHD templates described as early (⚪ seller blog). Price range $9–24 seen on live Gumroad/Etsy listings (🟡).
2. **Money reset.** "Cash stuffing" about 40k Etsy listings (⚪). Planner/budget searches peak in December–January (⚪ multiple seller blogs, consistent with known New Year behavior). Live listings $2–35 (🟡).
3. **Bold & easy coloring.** Style started late 2024, called the default in 2026 (⚪ KDP publishing blog). TikTok Shop sells bold-and-easy books (🟡 listing seen). Coloring is TikTok-native (satisfying process videos). Low price and AI-art crowding are real risks.
4. **Psychology guides.** Repo already holds prior psychology video assets (✅ in repo). One self-reported faceless psychology account at about $2,400/month (⚪ Reddit). Sources disagree whether generic facts accounts monetize (⚪).
5. **Seasonal kids printables.** Etsy Christmas activity packs $2.80–7.01; premium packs to $29.99 (🟡 live listings). No demand data found. Account setup + approval + first posts would eat most of the window.

### Rejected
- Generic AI prompt packs: saturated, possible policy risk.
- Canva templates, generic planners, wall art, stickers: 0.5M–1.85M listings each.
- Wedding templates: best price but slow to promote with short videos, heavily contested.

## Provisional recommendation (not final)
**ADHD-friendly money reset kit, launched for January.** It sits where #1 and #2 overlap: a pain point the ADHD community talks about constantly (money admin), a known New Year buying spike, and fewer competitors than either generic budget tools or generic ADHD planners.

**Why it's not final:** none of the demand evidence above is better than 🟡. Before I commit, I want real TikTok engagement numbers (views, shares, saves) for each of the 5 niches. That's the cheapest strong evidence available.

## Pass 2 plan (needs approval)
- Apify TikTok scraper: 5 niches × 2 search terms × 30 posts = about 300 posts → **about $0.09**, hard cap set at $0.30.
- Output: median views/likes/shares per niche, top hooks with numbers, how many creators sell a product in that niche.


---

## Pass 2: real TikTok engagement data (2026-11-11)

**Method (✅ verified data):** Google (Serper) found the top-ranked TikTok videos from the past year for 16 search terms (3–4 per niche). An Apify scraper then pulled live stats for 138 of them. Raw data: `ops/data/tiktok_sample_2026-11-11.csv`.
**Limits:** about 8–10 videos per term, and Google ranking favors popular videos. So this compares niches against each other well, but it is not a census.

**Why saves matter:** a save means "I want this later". It is the best free signal of buying intent. Shares mean "this is about someone I know", which drives reach.

### Per niche
| Niche | Videos | Median views | Median save rate | Median share rate | Read |
|---|---|---|---|---|---|
| **ADHD** | 35 | 34,100 | **1.97%** | **0.55%** | Highest intent and highest shareability |
| Psychology | 26 | 9,926 | 1.03% | 0.52% | Huge top hits; strong shares |
| Money (generic) | 27 | 6,057 | 0.81% | 0.18% | Low reach unless there's an angle |
| Kids printables | 28 | 11,800 | 0.81% | 0.22% | Seasonal; mostly mom-creator, face-on |
| Coloring | 22 | 33,400 | 0.29% | 0.11% | Big reach, but entertainment with low intent |

### Per search term (key ones)
| Term | Median views | Median save rate |
|---|---|---|
| **adhd money** | **175,200** | **2.46%** |
| adhd tips | 184,600 | 4.28% |
| adhd planner | 25,100 | 0.66% |
| budget with me | 6,631 | 0.44% |
| cash stuffing | 20,378 | 0.71% |
| coloring book asmr | 58,950 | 0.17% |
| psychology facts | 114,100 | 0.79% |

**Key finding (✅):** the same topic (money) does about 26× more median views and 5× more saves when it's framed for ADHD brains ("adhd money" vs "budget with me").

### Proof videos (✅, numbers from the scrape)
- @yourmoneymatesarah, "You're not inherently bad with money, you need an ADHD proof money system!": 403,500 views, **18,840 saves (4.7%)**
- @ducklingdaily, "ADHD And Saving Money Explained by Ducks" (animated, no face): 486,500 views, **22,500 shares**
- @imbougieonabudget, nervous system + dopamine + budgeting: 202,100 views, 9,975 saves. The bio sells a "30 Day Money Tracking Plan", a competitor that proves the product type
- @adhd_chatter_podcast, list format ("Stop trusting your memory…"): 383,800 views, 24,673 saves

### Competition check (🟡 Google results for live store pages)
ADHD money products **already exist**: dozens of Etsy ADHD budget planners and spreadsheets, Payhip ("The Dopamine Money Planner" $17, "ADHD Money Systems" workbook), and Stan stores (@adhd_money course and A$44 tool; "The ADHD Money Reset Kit" by @sparkbudget, **so that name is taken**; "The Money Sanctuary", a 10-minute weekly ritual). Most are standard budget planners with ADHD in the title.
**Stage: growing and peaking, not early.** The demand is proven; the edge has to come from the product and the content machine, not from being first.

### Other niches after pass 2
- **Psychology:** the biggest single hits (5M views, 95k saves on one dark-psychology video, from a creator whose bio sells a guide). It suits faceless content naturally. But the market is flooded with resale (PLR) ebooks, and "manipulation" content carries TikTok guideline risk. **Strong #2, a candidate second machine later.**
- **Coloring:** reach is huge (34.9M views on one ASMR video), but the 0.29% save rate and $3–8 prices mean entertainment rather than intent. Rejected for now.
- **Kids Christmas:** the window closes before we could build and test properly. Rejected for 2026; revisit in Sept 2027.
- **Generic money:** only works with an angle. It folds into the pick.

## Final pick
**ADHD money (an ADHD-proof money system).** Strongest buying-intent signal in the data (2.46% saves on the core term, 4.7% on the best example). Faceless animated explainers already reach 486k views. Product price range is $9–44. And January is the yearly money-reset moment, 7 weeks out.

**Risks, said plainly:** competitors exist and some have big audiences. Mental-health-adjacent claims must stay educational ("tools that fit how ADHD brains work"), never medical. A new account starts at about 1–7k views per video (median for accounts under 50k followers in this sample).

**Arena:** not installed, so this pick was not bracket-tested. It rests on the data above.
