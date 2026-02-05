"use client"

import { useState } from "react"
import { Brain, Loader2, Sparkles, AlertTriangle, TrendingUp, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Holding {
  id: string
  ticker: string
  allocation_percent: number | null
  sector: string | null
}

interface AIInsightsPanelProps {
  holdings: Holding[]
  portfolioId: string | undefined
  userId: string
}

interface Insight {
  type: "diversification" | "risk" | "opportunity"
  title: string
  description: string
}

export function AIInsightsPanel({ holdings, portfolioId, userId }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  const generateInsights = async () => {
    if (holdings.length === 0) return

    setIsLoading(true)

    // Calculate portfolio metrics for insights
    const totalAllocation = holdings.reduce((sum, h) => sum + (h.allocation_percent || 0), 0)
    const sectors = holdings.reduce(
      (acc, h) => {
        const sector = h.sector || "Other"
        acc[sector] = (acc[sector] || 0) + (h.allocation_percent || 0)
        return acc
      },
      {} as Record<string, number>
    )

    const sectorCount = Object.keys(sectors).length
    const maxSectorAllocation = Math.max(...Object.values(sectors))
    const maxHoldingAllocation = Math.max(...holdings.map((h) => h.allocation_percent || 0))

    const newInsights: Insight[] = []

    // Diversification insights
    if (holdings.length < 5) {
      newInsights.push({
        type: "diversification",
        title: "Limited Holdings",
        description: `With only ${holdings.length} holding${holdings.length === 1 ? "" : "s"}, your portfolio may benefit from additional diversification to reduce risk.`,
      })
    } else if (holdings.length >= 10) {
      newInsights.push({
        type: "diversification",
        title: "Well Diversified",
        description: `Your portfolio includes ${holdings.length} holdings, providing good diversification across multiple positions.`,
      })
    }

    // Sector concentration
    if (sectorCount === 1) {
      newInsights.push({
        type: "risk",
        title: "Sector Concentration",
        description: "All your holdings are in one sector. Consider diversifying across different sectors to reduce sector-specific risk.",
      })
    } else if (maxSectorAllocation > 50) {
      const dominantSector = Object.entries(sectors).find(([_, v]) => v === maxSectorAllocation)?.[0]
      newInsights.push({
        type: "risk",
        title: "High Sector Exposure",
        description: `${dominantSector} represents ${maxSectorAllocation.toFixed(1)}% of your portfolio. Consider reducing exposure if you want better balance.`,
      })
    }

    // Single holding concentration
    if (maxHoldingAllocation > 30) {
      const topHolding = holdings.find((h) => h.allocation_percent === maxHoldingAllocation)
      newInsights.push({
        type: "risk",
        title: "Concentrated Position",
        description: `${topHolding?.ticker} represents ${maxHoldingAllocation.toFixed(1)}% of your portfolio. High concentration in a single stock increases volatility.`,
      })
    }

    // Allocation check
    if (totalAllocation < 90) {
      newInsights.push({
        type: "opportunity",
        title: "Unutilized Allocation",
        description: `Your portfolio allocation totals ${totalAllocation.toFixed(1)}%. You have ${(100 - totalAllocation).toFixed(1)}% unallocated that could be invested.`,
      })
    } else if (totalAllocation > 100) {
      newInsights.push({
        type: "risk",
        title: "Over-Allocated",
        description: `Your total allocation is ${totalAllocation.toFixed(1)}%, which exceeds 100%. Review your holdings to correct the percentages.`,
      })
    }

    // Add a positive insight if portfolio looks healthy
    if (newInsights.length === 0 || (sectorCount >= 3 && maxHoldingAllocation <= 25 && holdings.length >= 5)) {
      newInsights.push({
        type: "opportunity",
        title: "Portfolio Health",
        description: "Your portfolio shows good diversification across holdings and sectors. Continue monitoring for any significant changes in allocation.",
      })
    }

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setInsights(newInsights)
    setIsLoading(false)
    setHasGenerated(true)
  }

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "diversification":
        return <TrendingUp className="h-4 w-4" />
      case "risk":
        return <AlertTriangle className="h-4 w-4" />
      case "opportunity":
        return <Sparkles className="h-4 w-4" />
    }
  }

  const getInsightColor = (type: Insight["type"]) => {
    switch (type) {
      case "diversification":
        return "text-chart-2 bg-chart-2/10"
      case "risk":
        return "text-chart-5 bg-chart-5/10"
      case "opportunity":
        return "text-chart-1 bg-chart-1/10"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {holdings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Add holdings to receive AI-powered insights about your portfolio.
          </p>
        ) : !hasGenerated ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Get AI-powered analysis of your portfolio including diversification, risk assessment, and opportunities.
            </p>
            <Button onClick={generateInsights} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-muted/50 border border-border/60"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-1 rounded ${getInsightColor(insight.type)}`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <h4 className="font-medium text-sm text-foreground">{insight.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={generateInsights} disabled={isLoading} className="w-full bg-transparent">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Regenerate Insights
                </>
              )}
            </Button>
          </>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Educational insights only. Not financial advice.
        </p>
      </CardContent>
    </Card>
  )
}
