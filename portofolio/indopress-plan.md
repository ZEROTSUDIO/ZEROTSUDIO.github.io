# IndoPress — Global News Dashboard

A frontend-focused news dashboard that visualizes how international press covers Indonesia,
built with vanilla JavaScript, Tailwind CSS, and the NewsAPI.

---

## Overview

**IndoPress** pulls English-language international headlines that mention Indonesia
directly in the title, then displays them in a clean, filterable dashboard with
auto-categorization, keyword analysis, and source tracking.

**Goal:** Add a polished, API-driven data visualization project to the portfolio
that showcases frontend skills, API integration, and analytical thinking.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | HTML + Vanilla JavaScript (ES6+) |
| Styling | Tailwind CSS (CDN or CLI) |
| Charts | Chart.js |
| Data | NewsAPI (`/v2/everything?qInTitle=indonesia`) |
| Hosting | Vercel / GitHub Pages (free) |
| Storage | `localStorage` (save preferences, no backend needed) |

> No backend needed. Pure frontend — fast to build, easy to deploy.

---

## Features

### 🗂️ Core Features (Must Have)

#### 1. Latest Headlines Feed
- Fetch latest 20–40 articles with `qInTitle=indonesia&language=en&sortBy=publishedAt`
- Display as card grid: thumbnail, headline, source, date, category tag
- Click card → opens article in new tab

#### 2. Auto-Categorizer
Classify each article by scanning the headline for keywords:

| Category | Keywords to detect |
|---|---|
| 🏛️ Politics | president, minister, parliament, election, prabowo, dprd, government |
| 💰 Economy | GDP, investment, trade, budget, rupiah, finance, economic |
| ⚽ Sports | Asian Games, SEA Games, football, badminton, athlete, gold medal |
| 🌿 Environment | forest, flood, earthquake, climate, carbon, pollution |
| 🏥 Health | health, hospital, vaccine, disease, pandemic, minister of health |
| 🌏 Diplomacy | bilateral, summit, ASEAN, treaty, relations, ambassador |
| 📦 Other | anything that doesn't match above |

#### 3. Filter Bar
- Filter cards by category (click category chip to toggle)
- Filter by source (dropdown or chip list)
- Sort: Latest / Oldest / Relevance

#### 4. Source Tracker (Bar Chart)
- Chart showing which news outlets published the most articles
- e.g. `Antara: 18 | CNA: 12 | Reuters: 9 | Yahoo: 6`
- Built with Chart.js horizontal bar chart

#### 5. Topic Breakdown (Donut Chart)
- Donut chart showing category distribution
- e.g. Economy 30% / Politics 25% / Sports 20% / Other 25%

#### 6. Headline Keyword Cloud
- Count word frequency across all headlines (strip stopwords)
- Display top 20 words as a styled word cloud or pill badges sized by frequency
- Pure JS — no library needed

---

### ✨ Nice-to-Have Features (If Time Allows)

#### 7. Search Bar
- Filter cards live as user types
- Highlight matching keyword in headline text

#### 8. Dark / Light Mode Toggle
- Save preference to `localStorage`

#### 9. Last Updated Timer
- Show "Last fetched: 3 minutes ago"
- Auto-refresh every 15 minutes

#### 10. Save to Reading List
- `localStorage`-based bookmarking
- Saved articles tab

---

## Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  NAVBAR — IndoPress logo | Last updated | Dark mode btn │
├─────────────────────────────────────────────────────────┤
│  STATS ROW — Total articles | Sources | Top category    │
├───────────────────────┬─────────────────────────────────┤
│  SOURCE BAR CHART     │  TOPIC DONUT CHART              │
├───────────────────────┴─────────────────────────────────┤
│  KEYWORD PILLS (word frequency badges)                  │
├─────────────────────────────────────────────────────────┤
│  FILTER BAR — [All] [Politics] [Economy] [Sports] ...   │
├─────────────────────────────────────────────────────────┤
│  ARTICLE CARD GRID (2–3 columns)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  img     │  │  img     │  │  img     │              │
│  │ headline │  │ headline │  │ headline │              │
│  │ src·date │  │ src·date │  │ src·date │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
indopress/
├── index.html          ← Main page (single page app)
├── src/
│   ├── main.js         ← Entry point, init & orchestration
│   ├── api.js          ← NewsAPI fetch logic
│   ├── categorizer.js  ← Keyword-based auto-categorizer
│   ├── charts.js       ← Chart.js setup (bar + donut)
│   ├── wordcloud.js    ← Keyword frequency counter + renderer
│   ├── ui.js           ← DOM rendering (cards, filters)
│   └── style.css       ← Custom CSS (on top of Tailwind)
├── .env                ← API key (NOT committed to git)
├── .gitignore
└── README.md
```

---

## API Usage

### Primary Endpoint
```
GET https://newsapi.org/v2/everything
  ?qInTitle=indonesia
  &language=en
  &sortBy=publishedAt
  &pageSize=40
  &apiKey=YOUR_KEY
```

### Optional Topic Searches
```
?qInTitle=indonesia+economy
?qInTitle=indonesia+politics
?qInTitle=indonesia+sports
```

### Free Plan Limits
- 100 requests/day
- Articles up to 1 month old
- Must not expose API key in public frontend → use a proxy or Vercel serverless function

---

## API Key Safety

> ⚠️ Never commit the raw API key to a public GitHub repo.

**Solution:** Vercel Serverless Function — wrap the API call in `/api/news.js`,
store key as env var in Vercel dashboard. Safe and free.

---

## Build Phases

### Phase 1 — Data & Structure
- [ ] Set up project folder and file structure
- [ ] Connect to NewsAPI, confirm data fetches correctly
- [ ] Build `api.js` — fetch + parse articles
- [ ] Build `categorizer.js` — keyword classifier

### Phase 2 — UI Cards
- [ ] Build base HTML layout with Tailwind
- [ ] Build `ui.js` — render article cards
- [ ] Add category color tags on cards
- [ ] Add filter bar (category chips)

### Phase 3 — Charts & Analytics
- [ ] Set up Chart.js
- [ ] Build source bar chart
- [ ] Build topic donut chart
- [ ] Build keyword frequency counter + pill badges

### Phase 4 — Polish & Deploy
- [ ] Stats row (total articles, unique sources, top topic)
- [ ] Dark/light mode toggle
- [ ] Move API key to Vercel env
- [ ] Deploy to Vercel
- [ ] Write README

---

## Portfolio Value

Once done, this project demonstrates:
- ✅ REST API integration
- ✅ Data parsing and transformation
- ✅ Dynamic DOM manipulation
- ✅ Data visualization (Chart.js)
- ✅ Frontend architecture (modular JS files)
- ✅ Deployment pipeline (Vercel)
- ✅ Analytical thinking (auto-categorizer, keyword analysis)

---

*API Key: stored separately — do NOT commit to repo*
