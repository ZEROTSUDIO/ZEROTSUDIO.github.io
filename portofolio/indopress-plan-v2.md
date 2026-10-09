# IndoPress — Part 2: Supabase + Sentiment Timeline Upgrade

> **Prerequisite:** Part 1 is complete. The dashboard already fetches from NewsAPI,
> displays article cards, auto-categorizes by keyword, and shows basic charts.
>
> This plan upgrades the architecture to use **Supabase as a persistent database**,
> adds a **daily data fetcher with VADER sentiment scoring**, and introduces a
> **Sentiment Timeline** chart powered by stored historical data.

---

## What Changes in Part 2

| | Part 1 (Done) | Part 2 (This Plan) |
|---|---|---|
| Data source | NewsAPI directly (every page load) | Supabase DB (fetched once/day) |
| Historical data | None — only current API window | Grows daily, unlimited |
| Sentiment | Not implemented | Pre-computed by VADER, stored in DB |
| Sentiment timeline | Not implemented | Line chart from DB historical data |
| API quota risk | Burns 1-2 req per page load | 1 req per day (fetcher only) |

---

## New Tech Stack (Added)

| Layer | Tech |
|---|---|
| Database | Supabase (PostgreSQL) |
| Sentiment Engine | Python + VADER (vaderSentiment) |
| Fetcher Script | Python script (runs once/day) |
| Cron / Scheduler | GitHub Actions (free, scheduled workflow) |
| Supabase Client | @supabase/supabase-js |

---

## New Architecture

```
NewsAPI  <- called ONCE per day by fetcher only
    |
    v
fetcher.py
  1. Fetch new articles
  2. VADER sentiment scoring
  3. Auto-categorize
  4. Deduplicate by URL
  5. INSERT to Supabase
    |
    v
Supabase (PostgreSQL) -- stores all articles + scores
    |
    v
Frontend Dashboard -- reads from Supabase ONLY, no NewsAPI at runtime
```

---

## Supabase Table Schema

```sql
CREATE TABLE articles (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  url          TEXT UNIQUE NOT NULL,
  url_to_image TEXT,
  source_name  TEXT,
  published_at TIMESTAMPTZ,
  category     TEXT DEFAULT 'Other',
  sentiment    FLOAT,
  fetched_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_published_at ON articles (published_at DESC);
CREATE INDEX idx_category ON articles (category);
```

---

## Fetcher Script — fetcher.py

### Dependencies
```
pip install requests vaderSentiment supabase python-dotenv
```

### .env file (never commit this)
```
NEWSAPI_KEY=your_newsapi_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
```

### Script
```python
import os, requests
from datetime import datetime, timedelta
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

analyzer = SentimentIntensityAnalyzer()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

CATEGORIES = {
    "Politics":    ["president", "minister", "parliament", "election", "prabowo", "government"],
    "Economy":     ["gdp", "investment", "trade", "budget", "rupiah", "finance", "economic"],
    "Sports":      ["asian games", "sea games", "football", "badminton", "athlete", "gold medal"],
    "Environment": ["forest", "flood", "earthquake", "climate", "carbon", "pollution"],
    "Health":      ["health", "hospital", "vaccine", "disease", "pandemic"],
    "Diplomacy":   ["bilateral", "summit", "asean", "treaty", "relations", "ambassador"],
}

def categorize(title):
    title_lower = title.lower()
    for category, keywords in CATEGORIES.items():
        if any(kw in title_lower for kw in keywords):
            return category
    return "Other"

yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
params = {
    "qInTitle": "indonesia",
    "language": "en",
    "from": yesterday,
    "sortBy": "publishedAt",
    "pageSize": 100,
    "apiKey": os.getenv("NEWSAPI_KEY"),
}
res = requests.get("https://newsapi.org/v2/everything", params=params)
articles = res.json().get("articles", [])

inserted = 0
skipped = 0

for a in articles:
    url = a.get("url")
    title = a.get("title", "")
    existing = supabase.table("articles").select("id").eq("url", url).execute()
    if existing.data:
        skipped += 1
        continue
    sentiment = analyzer.polarity_scores(title)["compound"]
    category = categorize(title)
    supabase.table("articles").insert({
        "title":        title,
        "description":  a.get("description"),
        "url":          url,
        "url_to_image": a.get("urlToImage"),
        "source_name":  a.get("source", {}).get("name"),
        "published_at": a.get("publishedAt"),
        "category":     category,
        "sentiment":    sentiment,
    }).execute()
    inserted += 1

print(f"Done -- Inserted: {inserted} | Skipped (duplicates): {skipped}")
```

---

## GitHub Actions Scheduler

Create `.github/workflows/daily-fetch.yml`:

```yaml
name: Daily News Fetcher

on:
  schedule:
    - cron: '0 1 * * *'   # every day 01:00 UTC = 08:00 WIB
  workflow_dispatch:

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install requests vaderSentiment supabase python-dotenv
      - name: Run fetcher
        env:
          NEWSAPI_KEY: ${{ secrets.NEWSAPI_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: python fetcher.py
```

> Store keys: GitHub repo -> Settings -> Secrets -> Actions. Never in code.

---

## Frontend Changes

### Replace NewsAPI with Supabase queries (api.js)

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function fetchArticles({ category = null, days = 7 } = {}) {
  const from = new Date(Date.now() - days * 86400000).toISOString()
  let query = supabase
    .from('articles')
    .select('*')
    .gte('published_at', from)
    .order('published_at', { ascending: false })

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  const { data } = await query
  return data
}
```

---

## New Feature — Sentiment Timeline Chart

### Logic (sentiment-timeline.js)
```
1. Query Supabase: SELECT published_at, sentiment
   WHERE published_at >= N days ago

2. Group rows by date

3. Per day compute:
   - avg_sentiment
   - positive_count (sentiment > 0.05)
   - negative_count (sentiment < -0.05)
   - neutral_count

4. Feed into Chart.js line chart
   - X axis: dates (Sep 10, Sep 11 ...)
   - Y axis: avg sentiment score (-1.0 to +1.0)
```

### UI Additions
- Sentiment badge on each card: Positive / Negative / Neutral
- "Most positive day" and "Most negative day" stat pills
- Toggle: 7 days / 14 days / 30 days range

---

## Build Phases

### Phase 1 — Supabase Setup
- [ ] Create Supabase project
- [ ] Run SQL to create articles table + indexes
- [ ] Test manual insert via Supabase Table Editor

### Phase 2 — Fetcher Script
- [ ] Build fetcher.py with NewsAPI + VADER + Supabase insert
- [ ] Test locally — confirm rows appear in Supabase
- [ ] Verify deduplication (run twice, no double rows)
- [ ] Verify categories + sentiment scores look correct

### Phase 3 — GitHub Actions Cron
- [ ] Add .github/workflows/daily-fetch.yml
- [ ] Add API keys as GitHub Secrets
- [ ] Trigger manually via workflow_dispatch to test
- [ ] Confirm rows appear in Supabase after workflow runs

### Phase 4 — Frontend Migration
- [ ] Replace api.js NewsAPI calls with Supabase queries
- [ ] Confirm cards still render from Supabase data
- [ ] Add sentiment badge to each article card
- [ ] Update category filter to query Supabase by category

### Phase 5 — Sentiment Timeline
- [ ] Build sentiment-timeline.js — group by date, compute averages
- [ ] Render Chart.js line chart
- [ ] Add 7 / 14 / 30 day range toggle
- [ ] Add "Most positive / Most negative day" stats

### Phase 6 — Polish
- [ ] Handle empty states (no data yet)
- [ ] Loading skeletons while Supabase query runs
- [ ] Update README with new architecture diagram
- [ ] Re-deploy to Vercel

---

## What This Adds to Your Portfolio

| Skill Demonstrated | How |
|---|---|
| Database design | Supabase table schema + indexes |
| Python scripting | fetcher.py — API to DB pipeline |
| NLP / ML | VADER sentiment analysis |
| CI/CD automation | GitHub Actions scheduled workflow |
| Backend-as-a-service | Supabase integration |
| Data visualization | Sentiment timeline (Chart.js) |
| System architecture | NewsAPI -> Python -> DB -> Frontend |

This transforms IndoPress from a simple API dashboard into a
data pipeline + analytics platform — a much stronger portfolio piece.
