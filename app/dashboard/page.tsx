import { createClient } from "@/lib/supabase/server"
import { PortfolioSummary } from "@/components/portfolio-summary"
import { PortfolioMovement } from "@/components/portfolio-movement"
import { MarketNews } from "@/components/market-news"
import { AIInsightsPanel } from "@/components/ai-insights-panel"
import { PortfolioChat } from "@/components/portfolio-chat"
import { PortfolioOverview } from "@/components/portfolio-overview"
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
      {/* Header with microcopy */}
      <AnimateOnScroll animation="fade-up">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Portfolio</h1>
          <p className="text-muted-foreground">
            Folio AI explains your portfolio in plain English. No trading. No advice. Just clarity.
          </p>
        </div>
      </AnimateOnScroll>

      {/* Hero: Today's Summary */}
      <AnimateOnScroll animation="fade-up" delay={100}>
        <PortfolioSummary holdings={holdings || []} />
      </AnimateOnScroll>

      {/* Main Grid: Explanations & Insights (primary) | Chat & Management (secondary) */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Explanations, News, Insights, Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Why did my portfolio move? */}
          <AnimateOnScroll animation="fade-up" delay={150}>
            <PortfolioMovement holdings={holdings || []} />
          </AnimateOnScroll>

          {/* AI Observations */}
          <AnimateOnScroll animation="fade-up" delay={200}>
            <AIInsightsPanel holdings={holdings || []} />
          </AnimateOnScroll>

          {/* Market News */}
          <AnimateOnScroll animation="fade-up" delay={250}>
            <MarketNews holdings={holdings || []} />
          </AnimateOnScroll>

          {/* Charts - now secondary */}
          <AnimateOnScroll animation="fade-up" delay={300}>
            <div className="pt-2">
              <h2 className="text-lg font-semibold text-foreground mb-4">Portfolio Visualization</h2>
              <PortfolioOverview holdings={holdings || []} />
            </div>
          </AnimateOnScroll>

          {/* Holdings Table */}
          <AnimateOnScroll animation="fade-up" delay={350}>
            <HoldingsTable holdings={holdings || []} />
          </AnimateOnScroll>
        </div>

        {/* Right Column: Chat & Management */}
        <div className="space-y-6">
          {/* Portfolio Chat - Key Feature */}
          <AnimateOnScroll animation="fade-left" delay={200}>
            <PortfolioChat holdings={holdings || []} />
          </AnimateOnScroll>

          {/* Add Holding Form */}
          <AnimateOnScroll animation="fade-left" delay={300}>
            <AddHoldingForm portfolioId={portfolioId} userId={user.id} />
          </AnimateOnScroll>
        </div>
      </div>
    </div>
  )
}
