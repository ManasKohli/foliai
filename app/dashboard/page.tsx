import { createClient } from "@/lib/supabase/server"
import { PortfolioSummary } from "@/components/portfolio-summary"
import { PortfolioMovement } from "@/components/portfolio-movement"
import { PortfolioPerformance } from "@/components/portfolio-performance"
import { BenchmarkComparison } from "@/components/benchmark-comparison"
import { MarketNews } from "@/components/market-news"
import { AIInsightsPanel } from "@/components/ai-insights-panel"
import { PortfolioChat } from "@/components/portfolio-chat"
import { PortfolioOverview } from "@/components/portfolio-overview"
import { PortfolioHealth } from "@/components/portfolio-health"
import { EarningsCalendar } from "@/components/earnings-calendar"
import { HoldingsTable } from "@/components/holdings-table"
import { AddHoldingForm } from "@/components/add-holding-form"
import { AnimateOnScroll } from "@/components/animate-on-scroll"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: portfolios } = await supabase
    .from("portfolios")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  const portfolioId = portfolios?.id

  const { data: holdings } = await supabase
    .from("holdings")
    .select("*")
    .eq("user_id", user.id)
    .order("allocation_percent", { ascending: false })

  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimateOnScroll animation="fade-up">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Portfolio</h1>
          <p className="text-muted-foreground">
            Live prices, real news, and AI-powered insights. No trading. No advice. Just clarity.
          </p>
        </div>
      </AnimateOnScroll>

      {/* Hero: Today's Summary with live prices */}
      <AnimateOnScroll animation="fade-up" delay={100}>
        <PortfolioSummary holdings={holdings || []} />
      </AnimateOnScroll>

      {/* Portfolio Performance (1D, 1W, 1M, 3M, YTD, 1Y, All) */}
      <AnimateOnScroll animation="fade-up" delay={150}>
        <PortfolioPerformance holdings={holdings || []} />
      </AnimateOnScroll>

      {/* Benchmark Comparison */}
      <AnimateOnScroll animation="fade-up" delay={175}>
        <BenchmarkComparison holdings={holdings || []} />
      </AnimateOnScroll>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Why did my portfolio move? */}
          <AnimateOnScroll animation="fade-up" delay={200}>
            <PortfolioMovement holdings={holdings || []} />
          </AnimateOnScroll>

          {/* AI Observations */}
          <AnimateOnScroll animation="fade-up" delay={250}>
            <AIInsightsPanel holdings={holdings || []} />
          </AnimateOnScroll>

          {/* Market News with Portfolio Relevance */}
          <AnimateOnScroll animation="fade-up" delay={300}>
            <MarketNews holdings={holdings || []} />
          </AnimateOnScroll>

          {/* Portfolio Visualization (pie + bar + ETF look-through with live data) */}
          <AnimateOnScroll animation="fade-up" delay={350}>
            <div className="pt-2">
              <h2 className="text-lg font-semibold text-foreground mb-4">Portfolio Visualization</h2>
              <PortfolioOverview holdings={holdings || []} />
            </div>
          </AnimateOnScroll>

          {/* Holdings Table with live prices */}
          <AnimateOnScroll animation="fade-up" delay={400}>
            <HoldingsTable holdings={holdings || []} />
          </AnimateOnScroll>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Portfolio Chat */}
          <AnimateOnScroll animation="fade-left" delay={200}>
            <PortfolioChat holdings={holdings || []} />
          </AnimateOnScroll>

          {/* Earnings Calendar */}
          <AnimateOnScroll animation="fade-left" delay={225}>
            <EarningsCalendar holdings={holdings || []} />
          </AnimateOnScroll>

          {/* Portfolio Structure & Risk */}
          <AnimateOnScroll animation="fade-left" delay={250}>
            <PortfolioHealth holdings={holdings || []} />
          </AnimateOnScroll>

          {/* Add Holding Form */}
          <AnimateOnScroll animation="fade-left" delay={350}>
            <AddHoldingForm portfolioId={portfolioId} userId={user.id} />
          </AnimateOnScroll>
        </div>
      </div>
    </div>
  )
}
