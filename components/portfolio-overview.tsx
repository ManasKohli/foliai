"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"

interface Holding {
  id: string
  ticker: string
  allocation_percent: number | null
  sector: string | null
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
]

export function PortfolioOverview({ holdings }: { holdings: Holding[] }) {
  const pieData = holdings
    .filter((h) => h.allocation_percent && h.allocation_percent > 0)
    .map((h) => ({
      name: h.ticker,
      value: h.allocation_percent || 0,
    }))

  const sectorData = holdings.reduce(
    (acc, h) => {
      const sector = h.sector || "Other"
      const existing = acc.find((s) => s.name === sector)
      if (existing) {
        existing.value += h.allocation_percent || 0
      } else {
        acc.push({ name: sector, value: h.allocation_percent || 0 })
      }
      return acc
    },
    [] as { name: string; value: number }[]
  )

  const totalAllocation = holdings.reduce((sum, h) => sum + (h.allocation_percent || 0), 0)

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
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
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
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "Allocation"]}
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 8%)",
                    border: "1px solid hsl(217, 33%, 17%)",
                    borderRadius: "8px",
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sector Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "Allocation"]}
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 8%)",
                    border: "1px solid hsl(217, 33%, 17%)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
