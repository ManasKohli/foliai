import { createClient } from "@/lib/supabase/server"
import { PortfolioSummary } from "@/components/portfolio-summary"
import { PortfolioMovement } from "@/components/portfolio-movement"
import { PortfolioPerformance } from "@/components/portfolio-performance"
import { BenchmarkComparison } from "@/components/benchmark-comparison"
import { MarketNews } from "@/components/market-news"
import { PortfolioChat } from "@/components/portfolio-chat"
import { PortfolioOverview } from "@/components/portfolio-overview"
import { PortfolioHealth } from "@/components/portfolio-health"
import { EarningsCalendar } from "@/components/earnings-calendar"
import { HoldingsTable } from "@/components/holdings-table"
import { AddHoldingForm } from "@/components/add-holding-form"
import { AnimateOnScroll } from "@/components/animate-on-scroll"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const h = holdings || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimateOnScroll animation="fade-up">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Your Portfolio
          </h1>
          <p className="text-muted-foreground">
            Live prices, real news, and AI-powered insights. No trading. No
            advice. Just clarity.
          </p>
        </div>
      </AnimateOnScroll>

      {/* Today's Summary */}
      <AnimateOnScroll animation="fade-up" delay={100}>
        <PortfolioSummary holdings={h} />
      </AnimateOnScroll>

      {/* Performance Chart */}
      <AnimateOnScroll animation="fade-up" delay={150}>
        <PortfolioPerformance holdings={h} />
      </AnimateOnScroll>

      {/* Benchmark Comparison */}
      <AnimateOnScroll animation="fade-up" delay={175}>
        <BenchmarkComparison holdings={h} />
      </AnimateOnScroll>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <AnimateOnScroll animation="fade-up" delay={200}>
            <PortfolioMovement holdings={h} />
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={250}>
            <MarketNews holdings={h} />
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={300}>
            <div className="pt-2">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Portfolio Visualization
              </h2>
              <PortfolioOverview holdings={h} />
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={350}>
            <HoldingsTable holdings={h} />
          </AnimateOnScroll>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          <AnimateOnScroll animation="fade-left" delay={200}>
            <PortfolioChat holdings={h} />
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-left" delay={225}>
            <EarningsCalendar holdings={h} />
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-left" delay={250}>
            <PortfolioHealth holdings={h} />
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-left" delay={350}>
            <AddHoldingForm portfolioId={portfolioId} userId={user.id} />
          </AnimateOnScroll>
        </div>
      </div>
    </div>
  )
}
