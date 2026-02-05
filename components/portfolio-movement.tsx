"use client"

import { Activity, TrendingDown, Building2, Briefcase } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Holding {
  id: string
  ticker: string
  allocation_percent: number | null
  sector: string | null
}

export function PortfolioMovement({ holdings }: { holdings: Holding[] }) {
  const sectors = holdings.reduce((acc, h) => {
    const sector = h.sector || "Other"
    acc[sector] = (acc[sector] || 0) + (h.allocation_percent || 0)
    return acc
  }, {} as Record<string, number>)

  const dominantSector = Object.entries(sectors).sort((a, b) => b[1] - a[1])[0]
  const hasTech = sectors["Technology"] && sectors["Technology"] > 0

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Why did my portfolio move?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add holdings to see movement explanations.
          </p>
        </CardContent>
      </Card>
    )
  }

  const movements = [
    {
      icon: TrendingDown,
      title: "Market Movement",
      description: "Broader markets are slightly lower today following mixed economic data and investor caution ahead of upcoming earnings.",
      color: "text-chart-5"
    },
    {
      icon: Building2,
      title: "Sector Movement",
      description: hasTech
        ? "Technology sector is leading declines (-1.2%) due to concerns about AI spending and rate sensitivity. Healthcare is outperforming (+0.4%)."
        : `${dominantSector?.[0] || "Your sectors"} are experiencing mild volatility today with mixed performance across subsectors.`,
      color: "text-chart-4"
    },
    {
      icon: Briefcase,
      title: "Holdings Impact",
      description: holdings.length > 3
        ? `Your ${holdings.length} holdings are reacting to sector trends. Diversification is helping limit overall portfolio impact.`
        : "With concentrated positions, your portfolio is more sensitive to individual stock movements.",
      color: "text-chart-1"
    }
  ]

  return (
    <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Why did my portfolio move?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {movements.map((item, index) => (
          <div 
            key={index} 
            className="flex gap-3 p-3 rounded-lg transition-all duration-300 hover:bg-muted/30 hover:translate-x-1 cursor-default"
          >
            <div className={`p-2 rounded-lg bg-muted/50 h-fit ${item.color} transition-transform duration-300 group-hover:scale-110`}>
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
              <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
