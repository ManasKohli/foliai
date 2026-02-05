"use client"

import { Newspaper, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Holding {
  id: string
  ticker: string
  allocation_percent: number | null
  sector: string | null
}

interface NewsItem {
  headline: string
  source: string
  timeAgo: string
  relevantSector: string
  impact: string
}

export function MarketNews({ holdings }: { holdings: Holding[] }) {
  const sectors = holdings.reduce((acc, h) => {
    const sector = h.sector || "Other"
    acc.add(sector)
    return acc
  }, new Set<string>())

  const hasTech = sectors.has("Technology")
  const hasHealthcare = sectors.has("Healthcare")
  const hasFinance = sectors.has("Finance")

  // Mock news data - in production, this would come from a news API
  const newsItems: NewsItem[] = [
    {
      headline: "Federal Reserve Signals Patience on Rate Cuts Amid Inflation Concerns",
      source: "Reuters",
      timeAgo: "2h ago",
      relevantSector: "Finance",
      impact: hasFinance || hasTech
        ? "This impacts your portfolio because rate-sensitive stocks like tech and financials may see pressure."
        : "This may affect broader market sentiment and growth stock valuations."
    },
    {
      headline: "Major Tech Companies Report Strong AI Revenue Growth",
      source: "Bloomberg",
      timeAgo: "4h ago",
      relevantSector: "Technology",
      impact: hasTech
        ? "This is positive for your technology holdings as AI adoption continues to accelerate."
        : "AI growth is driving tech sector gains, which may affect your portfolio indirectly."
    },
    {
      headline: "Healthcare Stocks Rally on Positive Drug Trial Results",
      source: "WSJ",
      timeAgo: "6h ago",
      relevantSector: "Healthcare",
      impact: hasHealthcare
        ? "Your healthcare positions may benefit from renewed investor interest in the sector."
        : "Healthcare sector strength provides defensive options in uncertain markets."
    },
    {
      headline: "Consumer Spending Data Shows Resilient Economy",
      source: "CNBC",
      timeAgo: "8h ago",
      relevantSector: "Consumer",
      impact: "Strong consumer spending supports corporate earnings and overall market health."
    }
  ]

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-primary" />
            Relevant Market News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add holdings to see personalized news relevance.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          Relevant Market News
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {newsItems.slice(0, 4).map((item, index) => (
          <div key={index} className="group">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                {item.headline}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
            </div>
            <div className="flex items-center gap-2 mt-1.5 mb-2">
              <span className="text-xs text-muted-foreground">{item.source}</span>
              <span className="text-xs text-muted-foreground/50">•</span>
              <span className="text-xs text-muted-foreground">{item.timeAgo}</span>
              <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                {item.relevantSector}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground/80 bg-muted/30 rounded-md p-2">
              {item.impact}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
