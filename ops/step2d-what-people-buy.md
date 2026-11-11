# Step 2d: what people actually want to buy (2026-11-11)

Question (Sebastian): "It doesn't matter what I like. What's going to work, what do people already have in their carts?"

Data (✅): 149 Etsy savings-tracker listings across 25 themes/formats, scraped for **favorites** (shoppers saving it to buy later) and **reviews** (buyers). Raw: `ops/data/etsy_savings_listings_149.json`. Top 8 images: `ops/data/etsy_most_favorited_savings.jpg`.
Limit: Etsy's live "In X carts" badge loads in the browser and is not visible to scrapers, so favorites + reviews are the proxy (⚪ we cannot read cart counts directly).

## Most-wanted listings
| # | Listing | Favorites | Reviews | Price |
|---|---|---|---|---|
| 1 | **Savings Challenge Mega Bundle: 38 challenges + 9 bonuses, 47 pages** (plain, clean) | **7,002** | **871** | **$12.95** |
| 2 | 12 monthly $500 challenges, A6 (light seasonal icons) | 675 | 74 | $5.00 |
| 3 | Mini emergency fund $500 (plain grid) | 437 | 48 | $2.00 |
| 4 | 400+ page A6 cash-stuffing mega bundle (full colour) | 409 | 43 | $6.67 |
| 5 | 98-page A6 savings challenge bundle | 359 | 32 | $2.06 |
| 6 | Christmas $200 (uses a trademarked character, do not copy) | 324 | 54 | $1.99 |
| 7 | $1,000 emergency fund (plain hearts) | 282 | 9 | $2.00 |
| 8 | 100 envelope challenge (plain) | 274 | 74 | $2.62 |

## By theme (median favorites)
Purpose/format themes win: emergency fund 100, A6 cash binder 83, coloring pages 63, Christmas 55, strawberry 49, 100 envelope 39.
Pure aesthetic themes lose: coquette 20, valentine 17, matcha 12, boho 5, cottagecore 3, glam pink 3, pastel aesthetic 2, minimalist 1.

## Conclusion
People pay for **coverage and clear goals**, not cute art: one bundle with every amount and timeframe (from $100 to $10k, 7 days to 52 weeks, emergency fund, Christmas, vacation, 100 envelope, monthly), clean printable design, Letter + A6 cash-binder sizes. The #1 product charges $12.95 for 47 pages.
Our edge nobody else has: the gamified app + spreadsheet included with the bundle.
Decision: rebuild the product as a **mega bundle (60+ challenges)**, clean design, exact sums, Letter + A6, with the app as the bonus. Drop the cute-art redesign as the main lever (strawberry-style themes sit mid-pack).
