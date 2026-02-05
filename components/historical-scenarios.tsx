"use client"

import { useState, useMemo } from "react"
import { History, AlertTriangle, TrendingDown, TrendingUp, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { calculateEffectiveSectorExposure, isKnownETF } from "@/lib/etf-data"

interface Holding {
  id: string
  ticker: string
  allocation_percent: number | null
  sector: string | null
  holding_type?: string
}

// Historical scenario data: approximate sector-level impact during major events
// Source: approximate drawdowns from peak to trough
const SCENARIOS = [
  {
    id: "covid-2020",
    name: "COVID-19 Crash",
    period: "Feb - Mar 2020",
    description:
      "Global pandemic triggered rapid sell-off. S&P 500 fell ~34% in 23 trading days before recovering.",
    spDrawdown: -33.9,
    sectorImpact: {
      Technology: -31,
      Financials: -40,
      Healthcare: -25,
      "Consumer Discretionary": -38,
      Communication: -28,
      Industrials: -41,
      "Consumer Staples": -18,
      Energy: -62,
      Materials: -32,
      "Real Estate": -37,
      Utilities: -29,
    } as Record<string, number>,
    recovery: "Markets recovered to pre-COVID levels by August 2020 (~5 months).",
  },
  {
    id: "rate-hike-2022",
    name: "2022 Rate Hike Cycle",
    period: "Jan - Oct 2022",
    description:
      "Fed raised rates aggressively to combat inflation. Growth stocks and bonds sold off heavily.",
    spDrawdown: -25.4,
    sectorImpact: {
      Technology: -35,
      Financials: -18,
      Healthcare: -12,
      "Consumer Discretionary": -36,
      Communication: -40,
      Industrials: -17,
      "Consumer Staples": -5,
      Energy: 58,
      Materials: -15,
      "Real Estate": -30,
      Utilities: -8,
    } as Record<string, number>,
    recovery:
      "Gradual recovery through 2023 as inflation eased. Tech rebounded strongly in H2 2023.",
  },
  {
    id: "gfc-2008",
    name: "Global Financial Crisis",
    period: "Sep 2008 - Mar 2009",
    description:
      "Banking crisis and housing collapse. S&P 500 fell ~57% from its 2007 peak.",
    spDrawdown: -56.8,
    sectorImpact: {
      Technology: -49,
      Financials: -79,
      Healthcare: -38,
      "Consumer Discretionary": -55,
      Communication: -44,
      Industrials: -57,
      "Consumer Staples": -28,
      Energy: -52,
      Materials: -56,
      "Real Estate": -68,
      Utilities: -42,
    } as Record<string, number>,
    recovery:
      "Full S&P 500 recovery took until March 2013 (~4 years from trough).",
  },
]

export function HistoricalScenarios({ holdings }: { holdings: Holding[] }) {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0].id)

  const effectiveExposure = useMemo(() => {
    const holdingsForCalc = holdings
      .filter((h) => h.allocation_percent && h.allocation_percent > 0)
      .map((h) => ({
        ticker: h.ticker,
        allocation_percent: h.allocation_percent || 0,
        holding_type:
          h.holding_type || (isKnownETF(h.ticker) ? "etf" : "stock"),
        sector: h.sector,
      }))
    return calculateEffectiveSectorExposure(holdingsForCalc)
  }, [holdings])

  const totalAlloc = holdings.reduce(
    (s, h) => s + (h.allocation_percent || 0),
    0
  )

  const scenario = SCENARIOS.find((s) => s.id === selectedScenario) || SCENARIOS[0]

  // Calculate estimated portfolio impact based on sector weights
  const portfolioImpact = useMemo(() => {
    if (totalAlloc === 0) return null

    let weightedImpact = 0
    const sectorBreakdown: { sector: string; weight: number; impact: number; contribution: number }[] = []

    for (const [sector, pct] of Object.entries(effectiveExposure)) {
      const weight = pct / totalAlloc
      const sectorDrawdown = scenario.sectorImpact[sector] ?? scenario.spDrawdown
      const contribution = weight * sectorDrawdown
      weightedImpact += contribution
      sectorBreakdown.push({
        sector,
        weight: pct,
        impact: sectorDrawdown,
        contribution,
      })
    }

    sectorBreakdown.sort((a, b) => a.contribution - b.contribution)

    return {
      estimatedDrawdown: weightedImpact,
      breakdown: sectorBreakdown,
    }
  }, [effectiveExposure, scenario, totalAlloc])

  if (holdings.length === 0) {
    return (
      <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Historical Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Add holdings to simulate historical scenarios.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Historical Context
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              How your current portfolio structure would have performed
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scenario selector */}
        <div className="flex gap-2 flex-wrap">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedScenario(s.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                selectedScenario === s.id
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Scenario detail */}
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">
                {scenario.name}
              </h3>
              <Badge variant="outline" className="text-xs">
                {scenario.period}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {scenario.description}
            </p>
          </div>

          {/* Estimated Impact */}
          {portfolioImpact && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground mb-1">
                    Your Portfolio (est.)
                  </p>
                  <p
                    className={`text-2xl font-bold tabular-nums ${
                      portfolioImpact.estimatedDrawdown < 0
                        ? "text-red-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {portfolioImpact.estimatedDrawdown >= 0 ? "+" : ""}
                    {portfolioImpact.estimatedDrawdown.toFixed(1)}%
                  </p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground mb-1">
                    S&P 500
                  </p>
                  <p
                    className={`text-2xl font-bold tabular-nums ${
                      scenario.spDrawdown < 0
                        ? "text-red-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {scenario.spDrawdown >= 0 ? "+" : ""}
                    {scenario.spDrawdown.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Sector-level breakdown */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Sector-level impact
                </p>
                {portfolioImpact.breakdown.slice(0, 5).map((item) => (
                  <div
                    key={item.sector}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground">
                        {item.sector}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        ({item.weight.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium tabular-nums ${
                          item.impact < 0 ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {item.impact >= 0 ? "+" : ""}
                        {item.impact}%
                      </span>
                      {item.impact < -40 ? (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      ) : item.impact > 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed p-2 rounded-md bg-muted/10">
                {scenario.recovery}
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-chart-4/5 border border-chart-4/10">
          <AlertTriangle className="h-3.5 w-3.5 text-chart-4 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            This is a historical simulation based on approximate sector-level
            drawdowns. Individual stock behavior may differ significantly. This
            does not predict future performance.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
