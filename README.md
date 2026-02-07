# Folio AI

**Folio AI is an AI-powered portfolio intelligence platform that turns market data into clear decisions.**  
Think Bloomberg-level analytics, but personalized for your portfolio.

---

## 🚀 What is Folio AI?
Folio AI is a smart investing assistant that:
- Tracks your portfolio in real time
- Explains market and macro data in plain English
- Compares your performance vs benchmarks (S&P 500, AI portfolios, custom strategies)
- Generates AI-built portfolios based on your risk and goals
- Sends daily market + portfolio briefings

**Goal:** Make retail investors think like hedge funds—without needing a Bloomberg Terminal.

---

## ✨ Core Features

### 📊 Portfolio Analytics
- Real-time portfolio performance tracking
- Benchmark comparison (S&P 500, custom indices)
- Sector and asset allocation breakdown
- Holdings-level performance analysis

### 🧠 Daily AI Market & Portfolio Brief
- Personalized daily summary of:
  - Portfolio movers and risk
  - Macro market drivers (rates, inflation, futures, DXY)
  - Upcoming events (earnings, CPI, Fed meetings, dividends)
- Plain-English explanation of **why markets moved**
- AI outlook scenarios (bullish, bearish, neutral)

### 🌍 Macro Dashboard
- Equity futures (S&P, Nasdaq, Dow)
- Commodities (Gold, Oil)
- Currency indices (DXY)
- Interest rates and yield curve
- Volatility indices (VIX)

### 🤖 AI Portfolio Generator
- Generate portfolios based on:
  - Risk tolerance
  - Time horizon
  - Dividend vs growth preference
  - Sector constraints
- Backtest AI portfolios vs S&P and user portfolio
- Risk metrics: Sharpe ratio, volatility, max drawdown

### 🔔 Smart Alerts
- Portfolio concentration risk alerts
- Macro regime change alerts (rates rising, volatility spikes)
- Opportunity alerts (breakouts, correlations, regime shifts)

### 🧪 Alternate Universe Simulation
- Compare:
  - Your real portfolio
  - AI-generated portfolio
  - S&P 500
- See hypothetical historical performance and alpha attribution

---

## 🧩 Tech Stack
**Frontend**
- Next.js / React
- Tailwind CSS
- Recharts / Chart.js for financial charts

**Backend**
- Node.js / Express or FastAPI
- PostgreSQL for portfolios and user data
- Redis for caching market data

**Data APIs**
- Polygon.io / Alpaca for equities
- FRED for macro data
- Yahoo Finance / Finnhub (fallback)

**AI Layer**
- OpenAI GPT-5 / Claude / Gemini (model-selectable)
- Custom financial prompt pipelines

---

## 🏗 Architecture Overview
```

User → Frontend (Next.js)
↓
API Gateway
↓
Portfolio Engine → Market Data APIs
↓
AI Inference Layer → LLM Providers
↓
Analytics Engine → Backtesting & Risk Metrics
↓
Postgres / Redis

````

---

## ⚙️ Setup (Local Development)
```bash
# Clone repo
git clone https://github.com/your-username/folio-ai
cd folio-ai

# Install dependencies
npm install

# Run frontend
npm run dev

# Run backend
cd server
npm run start
````

Create a `.env` file:

```env
POLYGON_API_KEY=
OPENAI_API_KEY=
DATABASE_URL=
```

---

## 🛣 Roadmap

### MVP

* Portfolio tracking dashboard
* Benchmark comparison
* Macro dashboard

### V1

* Daily AI market brief
* Sma
