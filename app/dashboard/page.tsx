import { createClient } from "@/lib/supabase/server"
import { PortfolioOverview } from "@/components/portfolio-overview"
import { HoldingsTable } from "@/components/holdings-table"
import { AddHoldingForm } from "@/components/add-holding-form"
import { AIInsightsPanel } from "@/components/ai-insights-panel"

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
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Portfolio Dashboard</h1>
        <p className="text-muted-foreground">
          Visualize and analyze your investment portfolio
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PortfolioOverview holdings={holdings || []} />
          <HoldingsTable holdings={holdings || []} />
        </div>
        <div className="space-y-8">
          <AddHoldingForm portfolioId={portfolioId} userId={user.id} />
          <AIInsightsPanel holdings={holdings || []} portfolioId={portfolioId} userId={user.id} />
        </div>
      </div>
    </div>
  )
}
