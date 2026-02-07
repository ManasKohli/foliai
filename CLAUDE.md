# Folio AI - Stock Market Portfolio Analyzer

## Overview

Folio AI is a stock market portfolio AI analyzer built with Next.js 16. Users can import their portfolio, get personalized breakdowns, view market news, and chat with an AI (Grok) about their investments.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19
- **Styling**: Tailwind CSS + Radix UI primitives
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **AI**: Grok (via @ai-sdk/xai)
- **Charts**: Recharts
- **Market Data**: Yahoo Finance API (v8/v10)

## Project Structure

```
foliai/
├── app/
│   ├── api/                    # API routes
│   │   ├── stock-prices/       # Live quotes & historical charts
│   │   ├── stock-detail/       # Detailed fundamentals & news
│   │   ├── stock-search/       # Stock/ETF search
│   │   ├── etf-profile/        # ETF sector data
│   │   ├── market-news/        # Market news aggregation
│   │   ├── portfolio-chat/     # Grok AI chat
│   │   ├── credits/            # User credits management
│   │   └── health/yahoo/       # API health diagnostics
│   ├── dashboard/
│   │   ├── page.tsx            # Main portfolio view
│   │   ├── markets/            # Market analysis
│   │   ├── account/            # Settings
│   │   └── billing/            # Subscription
│   ├── auth/                   # Authentication pages
│   └── pricing/                # Pricing page
├── components/
│   ├── portfolio-summary.tsx   # Daily performance summary
│   ├── portfolio-performance.tsx # Portfolio chart
│   ├── portfolio-overview.tsx  # Sector breakdown
│   ├── holdings-table.tsx      # Holdings list
│   ├── stock-detail-modal.tsx  # Stock details popup
│   ├── portfolio-chat.tsx      # AI chat interface
│   ├── market-news.tsx         # News feed
│   ├── markets/
│   │   ├── overnight-briefing.tsx # Pre-market data
│   │   └── macro-outlook.tsx   # Macro indicators
│   └── ui/                     # Radix UI components
├── lib/
│   ├── yahoo-finance.ts        # Yahoo Finance API utility
│   ├── etf-data.ts             # ETF sector mappings
│   ├── stripe.ts               # Stripe config
│   └── supabase/               # Supabase clients
└── public/
```

## Key Features

1. **Portfolio Dashboard**: View holdings, live prices, daily changes, sector exposure
2. **ETF Look-Through**: Shows true sector exposure by analyzing ETF holdings
3. **Market Analysis**: Pre-market briefing (futures, gold, yields) + macro outlook
4. **AI Chat**: Grok-powered assistant for portfolio questions
5. **News Feed**: Personalized market news based on holdings

## Yahoo Finance API

All market data comes from Yahoo Finance. The `lib/yahoo-finance.ts` utility handles:
- User-Agent rotation (to avoid blocking)
- Retry logic with exponential backoff
- Fallback to query2.finance.yahoo.com

### Endpoints Used
- `/v8/finance/chart/{ticker}` - Price data & charts (most reliable)
- `/v10/finance/quoteSummary/{ticker}` - Fundamentals (may rate limit)
- `/v1/finance/search?q={query}` - Stock search

### Health Check
Visit `/api/health/yahoo` to diagnose API connectivity issues.

## Environment Variables

Required in `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
XAI_API_KEY=
FINNHUB_API_KEY=  # For earnings calendar (free at finnhub.io)
```

## Development

```bash
npm install
npm run dev
```

## Common Issues

### Stock data not showing
1. Check `/api/health/yahoo` for API status
2. Look at server console for `[YahooFinance]` errors
3. Yahoo may be rate-limiting - wait and retry

### Earnings calendar requires Finnhub API key
The earnings calendar uses Finnhub API (free tier available at finnhub.io). Add your API key to `.env` as `FINNHUB_API_KEY`.

### Supabase errors
Ensure `NEXT_PUBLIC_SUPABASE_URL` is set (note the `NEXT_PUBLIC_` prefix).

## Architecture Notes

- Components fetch data client-side with 2-minute refresh intervals
- API routes use ISR caching (60s for live data, 300s for historical)
- All Yahoo Finance calls go through the centralized utility for consistent error handling
