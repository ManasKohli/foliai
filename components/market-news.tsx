"use client"

import { useState, useEffect } from "react"
import { Newspaper, ExternalLink, RefreshCw, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Holding {
  id: string
  ticker: string
  allocation_percent: number | null
  sector: string | null
  holding_type?: string
}

interface NewsArticle {
  title: string
  description: string
  source: string
  url: string
  publishedAt: string
}

// Keywords to detect which sectors a news article relates to
const SECTOR_KEYWORDS: Record<string, string[]> = {
  Technology: ["tech", "ai", "artificial intelligence", "software", "chip", "semiconductor", "nvidia", "apple", "microsoft", "google", "meta", "cloud", "saas", "cyber", "shopify", "constellation software"],
  Financials: ["bank", "jpmorgan", "goldman", "financial", "lending", "credit", "interest rate", "fed", "treasury", "yield", "royal bank", "td bank", "bmo", "scotiabank", "cibc", "manulife", "brookfield", "bank of canada"],
  Healthcare: ["health", "pharma", "drug", "biotech", "fda", "hospital", "medical", "eli lilly", "novo nordisk", "obesity", "cannabis", "canopy"],
  Energy: ["oil", "gas", "energy", "opec", "crude", "petroleum", "renewable", "solar", "exxon", "chevron", "suncor", "enbridge", "tc energy", "canadian natural", "pipeline", "oilsands", "oil sands"],
  "Consumer Discretionary": ["retail", "consumer", "amazon", "tesla", "spending", "e-commerce", "dollarama", "canada goose", "restaurant brands"],
  "Consumer Staples": ["grocery", "food", "beverage", "walmart", "costco", "procter", "loblaw", "couche-tard", "saputo", "metro inc"],
  Industrials: ["manufacturing", "industrial", "boeing", "defense", "infrastructure", "transportation", "canadian national", "cp rail", "air canada", "cae"],
  "Real Estate": ["real estate", "housing", "mortgage", "reit", "property", "canadian housing", "condo"],
  Materials: ["mining", "metals", "gold", "copper", "steel", "chemical", "barrick", "nutrien", "potash", "franco-nevada", "agnico"],
  Utilities: ["utility", "electric", "power grid", "natural gas", "fortis", "hydro one", "emera"],
  Communication: ["media", "streaming", "telecom", "advertising", "social media", "telus", "bce", "rogers", "bell"],
}

function detectSectors(text: string): string[] {
  const lower = text.toLowerCase()
  const detected: string[] = []
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      detected.push(sector)
    }
  }
  return detected.length > 0 ? detected : ["Market"]
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

export function MarketNews({ holdings }: { holdings: Holding[] }) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const userSectors = new Set(holdings.map((h) => h.sector).filter(Boolean))

  const fetchNews = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/market-news")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setArticles(data.articles || [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  // For each article, determine relevance to the user's portfolio
  function getRelevanceTag(article: NewsArticle): { sectors: string[]; isRelevant: boolean } {
    const detected = detectSectors(`${article.title} ${article.description}`)
    const isRelevant = detected.some((s) => userSectors.has(s))
    return { sectors: detected, isRelevant }
  }

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-primary" />
            Market News
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
    <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-primary" />
            Market News
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={fetchNews}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh news</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading && articles.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading market news...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-2">Could not load news</p>
            <Button variant="outline" size="sm" onClick={fetchNews}>
              Try again
            </Button>
          </div>
        ) : (
          articles.slice(0, 6).map((article, index) => {
            const { sectors, isRelevant } = getRelevanceTag(article)
            return (
              <a
                key={index}
                href={article.url !== "#" ? article.url : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block p-3 rounded-lg transition-all duration-200 hover:bg-muted/30 -mx-1 ${
                  isRelevant ? "border-l-2 border-primary/40 pl-3" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    {article.title}
                    {article.url !== "#" && (
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    )}
                  </h4>
                </div>
                {article.description && (
                  <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">{article.source}</span>
                  <span className="text-xs text-muted-foreground/50">{"/"}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(article.publishedAt)}</span>
                  {sectors.slice(0, 2).map((sector) => (
                    <Badge
                      key={sector}
                      variant="outline"
                      className={`text-xs px-1.5 py-0 h-5 transition-colors duration-200 ${
                        userSectors.has(sector)
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "group-hover:bg-muted/50"
                      }`}
                    >
                      {sector}
                    </Badge>
                  ))}
                  {isRelevant && (
                    <span className="text-xs text-primary font-medium">Affects your portfolio</span>
                  )}
                </div>
              </a>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
