"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"
import { isKnownETF, getETFData, calculateEffectiveSectorExposure } from "@/lib/etf-data"

interface Holding {
  id: string
  ticker: string
  allocation_percent: number | null
  sector: string | null
  holding_type?: string
}

interface ETFLiveData {
  sectors: Record<string, number>
  topHoldings: { symbol: string; name: string; percent: number }[]
  fund: { name: string; category: string; expenseRatio: number | null; totalAssets: number | null; yield: number | null }
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
  const [liveETFData, setLiveETFData] = useState<Record<string, ETFLiveData>>({})
  const [loadingETFs, setLoadingETFs] = useState(false)

  // Identify ETFs
  const etfTickers = useMemo(
    () => holdings.filter((h) => h.holding_type === "etf" || isKnownETF(h.ticker)).map((h) => h.ticker),
    [holdings]
  )

  // Fetch live ETF sector data from API
  useEffect(() => {
    if (etfTickers.length === 0) return
    setLoadingETFs(true)
    const fetchAll = async () => {
      const results: Record<string, ETFLiveData> = {}
      await Promise.all(
        etfTickers.map(async (ticker) => {
          try {
            const res = await fetch(`/api/etf-profile?ticker=${encodeURIComponent(ticker)}`)
            if (res.ok) {
              const data = await res.json()
              if (data.sectors && Object.keys(data.sectors).length > 0) {
                results[ticker] = {
                  sectors: data.sectors,
                  topHoldings: data.topHoldings || [],
                  fund: data.fund || {},
                }
              }
            }
          } catch {
            // fall back to hardcoded
          }
        })
      )
      setLiveETFData(results)
      setLoadingETFs(false)
    }
    fetchAll()
  }, [etfTickers])

  const pieData = holdings
    .filter((h) => h.allocation_percent && h.allocation_percent > 0)
    .map((h) => ({
      name: h.ticker,
      value: h.allocation_percent || 0,
      type: h.holding_type || (isKnownETF(h.ticker) ? "etf" : "stock"),
    }))

  const totalAllocation = holdings.reduce((sum, h) => sum + (h.allocation_percent || 0), 0)

  // Calculate effective sector exposure -- prefer live data, fall back to hardcoded
  const sectorData = useMemo(() => {
    const sectorMap: Record<string, number> = {}

    for (const h of holdings) {
      const alloc = h.allocation_percent || 0
      if (alloc <= 0) continue

      const isEtf = h.holding_type === "etf" || isKnownETF(h.ticker)

      if (isEtf) {
        // Try live data first, then hardcoded
        const live = liveETFData[h.ticker]
        const sectors = live?.sectors || getETFData(h.ticker)?.sectors

        if (sectors) {
          const sectorTotal = Object.values(sectors).reduce((s, v) => s + v, 0)
          for (const [sector, pct] of Object.entries(sectors)) {
            const normalizedPct = sectorTotal > 0 ? (pct / sectorTotal) * alloc : 0
            sectorMap[sector] = (sectorMap[sector] || 0) + normalizedPct
          }
        } else {
          sectorMap["Other"] = (sectorMap["Other"] || 0) + alloc
        }
      } else {
        const sector = h.sector || "Other"
        sectorMap[sector] = (sectorMap[sector] || 0) + alloc
      }
    }

    return Object.entries(sectorMap)
      .map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))
      .filter((s) => s.value > 0.1)
      .sort((a, b) => b.value - a.value)
  }, [holdings, liveETFData])

  const etfCount = etfTickers.length
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
      {/* Effective Sector Exposure */}
      <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5 border-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Effective Sector Exposure
                {loadingETFs && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {Object.keys(liveETFData).length > 0
                  ? "Live sector data from fund holdings (real-time)"
                  : "Your true sector breakdown, looking through ETFs to their underlying holdings"}
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

          {/* ETF look-through detail with live data */}
          {etfCount > 0 && (
            <div className="mt-6 pt-4 border-t border-border/60">
              <p className="text-xs font-medium text-muted-foreground mb-3">ETF look-through detail</p>
              <div className="grid gap-3">
                {holdings
                  .filter((h) => (h.holding_type === "etf" || isKnownETF(h.ticker)) && h.allocation_percent)
                  .map((h) => {
                    const live = liveETFData[h.ticker]
                    const hardcoded = getETFData(h.ticker)
                    const sectors = live?.sectors || hardcoded?.sectors
                    const topHoldings = live?.topHoldings || []
                    const fundName = live?.fund?.name || hardcoded?.name || h.ticker

                    if (!sectors) return null
                    const topSectors = Object.entries(sectors).sort(([, a], [, b]) => b - a).slice(0, 3)

                    return (
                      <div key={h.id} className="p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className="bg-primary/15 text-primary border-0 text-xs font-bold">
                            {h.ticker}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">{fundName}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{h.allocation_percent}%</span>
                          {live && (
                            <Badge variant="outline" className="text-xs border-emerald-500/20 text-emerald-400 px-1 py-0 h-4">
                              Live
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap mb-1">
                          {topSectors.map(([sector, pct]) => (
                            <span key={sector} className="text-xs text-muted-foreground">
                              {sector} {pct.toFixed(1)}%
                            </span>
                          ))}
                        </div>
                        {topHoldings.length > 0 && (
                          <div className="flex gap-2 flex-wrap mt-1">
                            <span className="text-xs text-muted-foreground/50">Top:</span>
                            {topHoldings.slice(0, 5).map((th) => (
                              <span key={th.symbol} className="text-xs text-primary/80">
                                {th.symbol} {th.percent.toFixed(1)}%
                              </span>
                            ))}
                          </div>
                        )}
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
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
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
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
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
