"use client"

import { useMemo, useState, useEffect } from "react"
import { Layers, Grid3X3, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { calculateEffectiveSectorExposure, isKnownETF } from "@/lib/etf-data"

interface Holding {
  id: string
  ticker: string
  quantity: number | null
  allocation_percent: number | null
  sector: string | null
  holding_type?: string
}

interface PriceData {
  price: number
  change: number
  changePercent: number
  previousClose: number
  name: string
  currency: string
}

const SECTOR_COLORS: Record<string, string> = {
  Technology: "hsl(217, 91%, 60%)",
  Financials: "hsl(38, 92%, 50%)",
  Healthcare: "hsl(142, 71%, 45%)",
  "Consumer Discretionary": "hsl(0, 84%, 60%)",
  Communication: "hsl(172, 66%, 50%)",
  Industrials: "hsl(262, 83%, 58%)",
  "Consumer Staples": "hsl(47, 100%, 50%)",
  Energy: "hsl(25, 95%, 55%)",
  Materials: "hsl(199, 89%, 48%)",
  "Real Estate": "hsl(310, 60%, 55%)",
  Utilities: "hsl(280, 65%, 60%)",
}

// ===== Sector Bubble Chart =====
function SectorBubbleChart({ holdings }: { holdings: Holding[] }) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({})

  const tickers = useMemo(() => holdings.map((h) => h.ticker), [holdings])

  useEffect(() => {
    if (tickers.length === 0) return
    const fetchPrices = async () => {
      try {
        const res = await fetch(`/api/stock-prices?tickers=${tickers.join(",")}`)
        if (res.ok) {
          const data = await res.json()
          setPrices(data.quotes || {})
        }
      } catch { /* skip */ }
    }
    fetchPrices()
  }, [tickers])

  const effectiveExposure = useMemo(() => {
    const holdingsForCalc = holdings
      .filter((h) => h.allocation_percent && h.allocation_percent > 0)
      .map((h) => ({
        ticker: h.ticker,
        allocation_percent: h.allocation_percent || 0,
        holding_type: h.holding_type || (isKnownETF(h.ticker) ? "etf" : "stock"),
        sector: h.sector,
      }))
    return calculateEffectiveSectorExposure(holdingsForCalc)
  }, [holdings])

  // Calculate avg daily change per sector
  const bubbleData = useMemo(() => {
    const sectorChanges: Record<string, { total: number; count: number }> = {}

    for (const h of holdings) {
      const p = prices[h.ticker]
      const sector = h.sector || "Other"
      if (p) {
        if (!sectorChanges[sector]) sectorChanges[sector] = { total: 0, count: 0 }
        sectorChanges[sector].total += p.changePercent
        sectorChanges[sector].count += 1
      }
    }

    return Object.entries(effectiveExposure).map(([sector, pct]) => {
      const avgChange = sectorChanges[sector]
        ? sectorChanges[sector].total / sectorChanges[sector].count
        : 0
      return {
        name: sector,
        allocation: pct,
        change: Math.round(avgChange * 100) / 100,
        z: pct,
      }
    })
  }, [effectiveExposure, holdings, prices])

  if (bubbleData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
        No sector data available
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <XAxis
              type="number"
              dataKey="allocation"
              name="Allocation"
              tick={{ fontSize: 10, fill: "hsl(215, 20%, 50%)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              label={{
                value: "Allocation %",
                position: "insideBottom",
                offset: -5,
                style: { fontSize: 10, fill: "hsl(215, 20%, 50%)" },
              }}
            />
            <YAxis
              type="number"
              dataKey="change"
              name="Daily Change"
              tick={{ fontSize: 10, fill: "hsl(215, 20%, 50%)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
              label={{
                value: "Today's Change",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 10, fill: "hsl(215, 20%, 50%)" },
              }}
            />
            <ZAxis
              type="number"
              dataKey="z"
              range={[100, 1500]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 47%, 11%)",
                border: "1px solid hsl(217, 33%, 20%)",
                borderRadius: "8px",
                color: "hsl(210, 40%, 98%)",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => {
                if (name === "Allocation") return [`${value.toFixed(1)}%`, name]
                if (name === "Daily Change") return [`${value >= 0 ? "+" : ""}${value.toFixed(2)}%`, name]
                return [value, name]
              }}
            />
            <Scatter data={bubbleData}>
              {bubbleData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={SECTOR_COLORS[entry.name] || "hsl(215, 20%, 50%)"}
                  fillOpacity={0.7}
                  stroke={SECTOR_COLORS[entry.name] || "hsl(215, 20%, 50%)"}
                  strokeWidth={1}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-2 px-2">
        {bubbleData.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: SECTOR_COLORS[item.name] || "hsl(215, 20%, 50%)" }}
            />
            <span className="text-xs text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== Correlation Heatmap =====
function CorrelationHeatmap({ holdings }: { holdings: Holding[] }) {
  const effectiveExposure = useMemo(() => {
    const holdingsForCalc = holdings
      .filter((h) => h.allocation_percent && h.allocation_percent > 0)
      .map((h) => ({
        ticker: h.ticker,
        allocation_percent: h.allocation_percent || 0,
        holding_type: h.holding_type || (isKnownETF(h.ticker) ? "etf" : "stock"),
        sector: h.sector,
      }))
    return calculateEffectiveSectorExposure(holdingsForCalc)
  }, [holdings])

  const sectors = Object.keys(effectiveExposure).slice(0, 6)

  // Simplified correlation matrix based on known sector relationships
  const SECTOR_CORRELATIONS: Record<string, Record<string, number>> = {
    Technology: { Technology: 1, Communication: 0.8, "Consumer Discretionary": 0.6, Financials: 0.4, Healthcare: 0.3, Energy: 0.1, Industrials: 0.5, "Consumer Staples": 0.2, Materials: 0.3, "Real Estate": 0.2, Utilities: 0.1 },
    Communication: { Communication: 1, Technology: 0.8, "Consumer Discretionary": 0.7, Financials: 0.4, Healthcare: 0.3, Energy: 0.1, Industrials: 0.4, "Consumer Staples": 0.2, Materials: 0.3, "Real Estate": 0.2, Utilities: 0.1 },
    Financials: { Financials: 1, Technology: 0.4, Communication: 0.4, "Consumer Discretionary": 0.5, Healthcare: 0.3, Energy: 0.4, Industrials: 0.6, "Consumer Staples": 0.4, Materials: 0.5, "Real Estate": 0.6, Utilities: 0.5 },
    Healthcare: { Healthcare: 1, Technology: 0.3, Communication: 0.3, Financials: 0.3, "Consumer Discretionary": 0.3, Energy: 0.2, Industrials: 0.3, "Consumer Staples": 0.5, Materials: 0.2, "Real Estate": 0.2, Utilities: 0.4 },
    "Consumer Discretionary": { "Consumer Discretionary": 1, Technology: 0.6, Communication: 0.7, Financials: 0.5, Healthcare: 0.3, Energy: 0.2, Industrials: 0.5, "Consumer Staples": 0.3, Materials: 0.4, "Real Estate": 0.3, Utilities: 0.2 },
    Energy: { Energy: 1, Technology: 0.1, Communication: 0.1, Financials: 0.4, Healthcare: 0.2, "Consumer Discretionary": 0.2, Industrials: 0.4, "Consumer Staples": 0.3, Materials: 0.6, "Real Estate": 0.2, Utilities: 0.3 },
    Industrials: { Industrials: 1, Technology: 0.5, Communication: 0.4, Financials: 0.6, Healthcare: 0.3, "Consumer Discretionary": 0.5, Energy: 0.4, "Consumer Staples": 0.4, Materials: 0.7, "Real Estate": 0.4, Utilities: 0.4 },
    "Consumer Staples": { "Consumer Staples": 1, Technology: 0.2, Communication: 0.2, Financials: 0.4, Healthcare: 0.5, "Consumer Discretionary": 0.3, Energy: 0.3, Industrials: 0.4, Materials: 0.3, "Real Estate": 0.4, Utilities: 0.6 },
    Materials: { Materials: 1, Technology: 0.3, Communication: 0.3, Financials: 0.5, Healthcare: 0.2, "Consumer Discretionary": 0.4, Energy: 0.6, Industrials: 0.7, "Consumer Staples": 0.3, "Real Estate": 0.3, Utilities: 0.3 },
    "Real Estate": { "Real Estate": 1, Technology: 0.2, Communication: 0.2, Financials: 0.6, Healthcare: 0.2, "Consumer Discretionary": 0.3, Energy: 0.2, Industrials: 0.4, "Consumer Staples": 0.4, Materials: 0.3, Utilities: 0.5 },
    Utilities: { Utilities: 1, Technology: 0.1, Communication: 0.1, Financials: 0.5, Healthcare: 0.4, "Consumer Discretionary": 0.2, Energy: 0.3, Industrials: 0.4, "Consumer Staples": 0.6, Materials: 0.3, "Real Estate": 0.5 },
  }

  const getCorrelation = (s1: string, s2: string): number => {
    return SECTOR_CORRELATIONS[s1]?.[s2] ?? SECTOR_CORRELATIONS[s2]?.[s1] ?? 0.5
  }

  const getHeatColor = (val: number): string => {
    if (val >= 0.8) return "bg-red-500/60"
    if (val >= 0.6) return "bg-chart-4/40"
    if (val >= 0.4) return "bg-chart-4/20"
    if (val >= 0.2) return "bg-chart-1/15"
    return "bg-chart-3/10"
  }

  if (sectors.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
        Need at least 2 sectors for correlation view
      </div>
    )
  }

  const shortName = (s: string) => {
    const map: Record<string, string> = {
      Technology: "Tech",
      Financials: "Fin",
      Healthcare: "Health",
      "Consumer Discretionary": "Discr",
      Communication: "Comm",
      Industrials: "Indust",
      "Consumer Staples": "Stapl",
      Energy: "Energy",
      Materials: "Matrl",
      "Real Estate": "REst",
      Utilities: "Util",
    }
    return map[s] || s.slice(0, 5)
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `auto repeat(${sectors.length}, 1fr)` }}>
          {/* Header row */}
          <div />
          {sectors.map((s) => (
            <div
              key={`h-${s}`}
              className="text-xs text-muted-foreground text-center px-1 py-1 font-medium"
            >
              {shortName(s)}
            </div>
          ))}
          {/* Data rows */}
          {sectors.map((row) => (
            <>
              <div
                key={`r-${row}`}
                className="text-xs text-muted-foreground px-2 py-2 flex items-center font-medium"
              >
                {shortName(row)}
              </div>
              {sectors.map((col) => {
                const val = getCorrelation(row, col)
                return (
                  <div
                    key={`${row}-${col}`}
                    className={`h-10 min-w-[40px] rounded flex items-center justify-center text-xs font-medium tabular-nums transition-colors hover:opacity-80 ${getHeatColor(val)} ${
                      row === col ? "text-foreground" : "text-muted-foreground"
                    }`}
                    title={`${row} x ${col}: ${val.toFixed(2)}`}
                  >
                    {val.toFixed(1)}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-chart-3/10" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-chart-4/20" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-red-500/60" />
          <span>High</span>
        </div>
      </div>
    </div>
  )
}

// ===== Main Export =====
export function AdvancedVisualizations({ holdings }: { holdings: Holding[] }) {
  const [activeTab, setActiveTab] = useState<"bubble" | "heatmap">("bubble")

  if (holdings.length === 0) {
    return (
      <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Advanced Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Add holdings to see advanced visualizations.
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
              <Layers className="h-4 w-4 text-primary" />
              Advanced Analytics
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Deeper insights into portfolio structure
            </p>
          </div>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("bubble")}
              className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all duration-200 ${
                activeTab === "bubble"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <TrendingUp className="h-3 w-3" />
              Sector Bubble
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("heatmap")}
              className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all duration-200 ${
                activeTab === "heatmap"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Grid3X3 className="h-3 w-3" />
              Correlation
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === "bubble" ? (
          <SectorBubbleChart holdings={holdings} />
        ) : (
          <CorrelationHeatmap holdings={holdings} />
        )}
      </CardContent>
    </Card>
  )
}
