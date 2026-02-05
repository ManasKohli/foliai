"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"
import { calculateEffectiveSectorExposure, isKnownETF, getETFData } from "@/lib/etf-data"

interface Holding {
  id: string
  ticker: string
  allocation_percent: number | null
  sector: string | null
  holding_type?: string
}

const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(172, 66%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(199, 89%, 48%)",
  "hsl(47, 100%, 50%)",
  "hsl(310, 60%, 55%)",
  "hsl(25, 95%, 55%)",
  "hsl(280, 65%, 60%)",
]

export function PortfolioOverview({ holdings }: { holdings: Holding[] }) {
  // Pie chart: direct holdings allocation
  const pieData = holdings
    .filter((h) => h.allocation_percent && h.allocation_percent > 0)
    .map((h) => ({
      name: h.ticker,
      value: h.allocation_percent || 0,
      type: h.holding_type || (isKnownETF(h.ticker) ? "etf" : "stock"),
    }))

  const totalAllocation = holdings.reduce((sum, h) => sum + (h.allocation_percent || 0), 0)

  // Calculate effective sector exposure (looks through ETFs)
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

  const sectorData = useMemo(() => {
    return Object.entries(effectiveExposure)
      .map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))
      .sort((a, b) => b.value - a.value)
  }, [effectiveExposure])

  // Count ETFs and stocks
  const etfCount = holdings.filter(
    (h) => (h.holding_type === "etf") || isKnownETF(h.ticker)
  ).length
  const stockCount = holdings.length - etfCount

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Add holdings to see your portfolio visualization
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Effective Sector Exposure - the star feature */}
      <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5 border-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Effective Sector Exposure</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Your true sector breakdown, looking through ETFs to their underlying holdings
              </p>
            </div>
            <div className="flex items-center gap-2">
              {stockCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {stockCount} {stockCount === 1 ? "stock" : "stocks"}
                </Badge>
              )}
              {etfCount > 0 && (
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  {etfCount} {etfCount === 1 ? "ETF" : "ETFs"}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sectorData.length > 0 ? (
            <div className="space-y-3">
              {sectorData.map((sector, index) => (
                <div key={sector.name} className="group/bar">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground font-medium">{sector.name}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">{sector.value.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out group-hover/bar:opacity-90"
                      style={{
                        width: `${Math.min((sector.value / (totalAllocation || 100)) * 100, 100)}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Set allocation percentages to see sector exposure
            </p>
          )}

          {/* ETF breakdown detail */}
          {etfCount > 0 && (
            <div className="mt-6 pt-4 border-t border-border/60">
              <p className="text-xs font-medium text-muted-foreground mb-3">ETF look-through detail</p>
              <div className="grid gap-2">
                {holdings
                  .filter((h) => (h.holding_type === "etf" || isKnownETF(h.ticker)) && h.allocation_percent)
                  .map((h) => {
                    const etf = getETFData(h.ticker)
                    if (!etf) return null
                    const topSectors = Object.entries(etf.sectors).sort(([, a], [, b]) => b - a).slice(0, 3)
                    return (
                      <div key={h.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors">
                        <Badge className="bg-primary/15 text-primary border-0 text-xs font-bold">
                          {h.ticker}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{h.allocation_percent}% of portfolio</span>
                        <span className="text-xs text-muted-foreground/50 mx-1">{"="}</span>
                        <div className="flex gap-1 flex-wrap">
                          {topSectors.map(([sector, pct]) => (
                            <span key={sector} className="text-xs text-muted-foreground">
                              {sector} {((h.allocation_percent! * pct) / 100).toFixed(1)}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })
                  .filter(Boolean)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Holdings pie chart */}
        <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Holdings Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke={entry.type === "etf" ? "hsl(217, 91%, 60%)" : "none"}
                        strokeWidth={entry.type === "etf" ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name: string, props: { payload?: { type?: string } }) => [
                      `${value.toFixed(1)}%`,
                      props.payload?.type === "etf" ? "ETF" : "Stock",
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(222, 47%, 8%)",
                      border: "1px solid hsl(217, 33%, 17%)",
                      borderRadius: "8px",
                      color: "hsl(210, 40%, 98%)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">Total Allocation</p>
              <p className="text-2xl font-bold text-foreground">{totalAllocation.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>

        {/* Sector bar chart */}
        <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Sector Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorData.slice(0, 8)} layout="vertical">
                  <XAxis type="number" domain={[0, "auto"]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Effective Exposure"]}
                    contentStyle={{
                      backgroundColor: "hsl(222, 47%, 8%)",
                      border: "1px solid hsl(217, 33%, 17%)",
                      borderRadius: "8px",
                      color: "hsl(210, 40%, 98%)",
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
