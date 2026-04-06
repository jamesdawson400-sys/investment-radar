# Investment Idea Radar

Quantitative stock screening and research workflow tool — Next.js rewrite of the original Python/Streamlit app.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **Recharts** for charts
- **Prisma + SQLite** (local) / **Vercel Postgres** (production)
- **yahoo-finance2** for live market data

## Getting Started (local)

```bash
npm install
npm run db:push       # creates dev.db
npm run dev           # http://localhost:3000
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import into Vercel
3. Add environment variable: `DATABASE_URL` → your Vercel Postgres / Neon connection string
4. Deploy

> **Switching to Postgres:** Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma` before deploying.

## Features

- Define a universe (default 16 stocks or paste your own)
- Filter by market cap, volatility, score, sector
- 4-factor scoring: Momentum (35%), Quality (25%), Valuation (20%), Trend (20%)
- 1-year price chart with 50-day MA
- Score breakdown and return attribution charts
- Persistent watchlist and scan history (SQLite / Postgres)
