"use client"

import React from "react"
import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, Search, TrendingUp, Building2, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { ETF_DATA, STOCK_SECTORS, isKnownETF, getStockSector, type ETFSectorBreakdown } from "@/lib/etf-data"

// Build a unified ticker list from our data
const ALL_TICKERS = [
  ...Object.entries(ETF_DATA).map(([ticker, data]) => ({
    ticker,
    name: data.name,
    type: "etf" as const,
    sector: null as string | null,
  })),
  ...Object.entries(STOCK_SECTORS).map(([ticker, sector]) => ({
    ticker,
    name: getStockDisplayName(ticker),
    type: "stock" as const,
    sector,
  })),
]

function getStockDisplayName(ticker: string): string {
  const names: Record<string, string> = {
    AAPL: "Apple Inc.", MSFT: "Microsoft Corp.", GOOGL: "Alphabet Inc. (Class A)", GOOG: "Alphabet Inc. (Class C)",
    AMZN: "Amazon.com Inc.", NVDA: "NVIDIA Corp.", META: "Meta Platforms Inc.", TSLA: "Tesla Inc.",
    "BRK.B": "Berkshire Hathaway (Class B)", "BRK.A": "Berkshire Hathaway (Class A)",
    UNH: "UnitedHealth Group", JNJ: "Johnson & Johnson", JPM: "JPMorgan Chase", V: "Visa Inc.",
    PG: "Procter & Gamble", HD: "Home Depot", MA: "Mastercard", XOM: "Exxon Mobil",
    CVX: "Chevron Corp.", LLY: "Eli Lilly", ABBV: "AbbVie Inc.", MRK: "Merck & Co.",
    PFE: "Pfizer Inc.", KO: "Coca-Cola Co.", PEP: "PepsiCo Inc.", AVGO: "Broadcom Inc.",
    COST: "Costco Wholesale", TMO: "Thermo Fisher Scientific", WMT: "Walmart Inc.",
    CSCO: "Cisco Systems", CRM: "Salesforce Inc.", ABT: "Abbott Laboratories",
    ACN: "Accenture plc", MCD: "McDonald's Corp.", NFLX: "Netflix Inc.", AMD: "Advanced Micro Devices",
    INTC: "Intel Corp.", ADBE: "Adobe Inc.", DIS: "Walt Disney Co.", NKE: "Nike Inc.",
    PYPL: "PayPal Holdings", BA: "Boeing Co.", CAT: "Caterpillar Inc.", GE: "General Electric",
    RTX: "RTX Corp.", UNP: "Union Pacific", HON: "Honeywell", GS: "Goldman Sachs",
    MS: "Morgan Stanley", BLK: "BlackRock Inc.", C: "Citigroup Inc.", BAC: "Bank of America",
    WFC: "Wells Fargo", SCHW: "Charles Schwab", NEE: "NextEra Energy", DUK: "Duke Energy",
    SO: "Southern Company", COP: "ConocoPhillips", SLB: "SLB (Schlumberger)", EOG: "EOG Resources",
    LIN: "Linde plc", APD: "Air Products", SHW: "Sherwin-Williams", FCX: "Freeport-McMoRan",
    AMT: "American Tower", PLD: "Prologis Inc.", CCI: "Crown Castle", SPG: "Simon Property Group",
    T: "AT&T Inc.", VZ: "Verizon Communications", TMUS: "T-Mobile US", CMCSA: "Comcast Corp.",
    PLTR: "Palantir Technologies", SQ: "Block Inc.", SHOP: "Shopify Inc.", SNOW: "Snowflake Inc.",
    COIN: "Coinbase Global", SOFI: "SoFi Technologies", UBER: "Uber Technologies",
    ABNB: "Airbnb Inc.", SPOT: "Spotify Technology", NET: "Cloudflare Inc.",
    CRWD: "CrowdStrike Holdings", ZS: "Zscaler Inc.", DDOG: "Datadog Inc.",
    MDB: "MongoDB Inc.", PANW: "Palo Alto Networks", RIVN: "Rivian Automotive",
    F: "Ford Motor Co.", GM: "General Motors",
  }
  return names[ticker] || ticker
}

interface AddHoldingFormProps {
  portfolioId: string | undefined
  userId: string
}

export function AddHoldingForm({ portfolioId, userId }: AddHoldingFormProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTicker, setSelectedTicker] = useState<typeof ALL_TICKERS[number] | null>(null)
  const [quantity, setQuantity] = useState("")
  const [allocation, setAllocation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [success, setSuccess] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter tickers based on search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return ALL_TICKERS.slice(0, 8)
    const q = searchQuery.toUpperCase().trim()
    return ALL_TICKERS.filter(
      (t) => t.ticker.includes(q) || t.name.toUpperCase().includes(q)
    ).slice(0, 10)
  }, [searchQuery])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (item: typeof ALL_TICKERS[number]) => {
    setSelectedTicker(item)
    setSearchQuery(item.ticker)
    setShowDropdown(false)
  }

  const etfInfo: ETFSectorBreakdown | null = selectedTicker?.type === "etf"
    ? ETF_DATA[selectedTicker.ticker] || null
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    if (!portfolioId) {
      setError("Portfolio not found. Please refresh the page.")
      setIsLoading(false)
      return
    }

    const ticker = selectedTicker?.ticker || searchQuery.toUpperCase()
    if (!ticker) {
      setError("Please select a ticker.")
      setIsLoading(false)
      return
    }

    const holdingType = selectedTicker?.type || (isKnownETF(ticker) ? "etf" : "stock")
    const sector = holdingType === "stock"
      ? (selectedTicker?.sector || getStockSector(ticker) || null)
      : null

    const supabase = createClient()
    const { error: insertError } = await supabase.from("holdings").insert({
      portfolio_id: portfolioId,
      user_id: userId,
      ticker,
      quantity: quantity ? parseFloat(quantity) : null,
      allocation_percent: allocation ? parseFloat(allocation) : null,
      sector,
      holding_type: holdingType,
    })

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setSearchQuery("")
    setSelectedTicker(null)
    setQuantity("")
    setAllocation("")
    setIsLoading(false)
    router.refresh()
    setTimeout(() => setSuccess(false), 2000)
  }

  // Top sector breakdowns for selected ETF
  const topSectors = etfInfo
    ? Object.entries(etfInfo.sectors)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    : []

  return (
    <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5 group">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
          Add Holding
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticker search */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <Label htmlFor="ticker-search">Search Stock or ETF</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                id="ticker-search"
                placeholder="Search AAPL, SPY, QQQ..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedTicker(null)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-9"
                autoComplete="off"
                required
                disabled={isLoading}
              />
            </div>

            {/* Dropdown results */}
            {showDropdown && filtered.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {filtered.map((item) => (
                  <button
                    key={item.ticker}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <div className={`h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      item.type === "etf"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-foreground"
                    }`}>
                      {item.type === "etf" ? <TrendingUp className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{item.ticker}</span>
                        <Badge variant="outline" className={`text-xs px-1 py-0 h-4 ${
                          item.type === "etf" ? "border-primary/30 text-primary" : ""
                        }`}>
                          {item.type === "etf" ? "ETF" : "Stock"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                    </div>
                    {item.sector && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">{item.sector}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ETF Sector Breakdown Preview */}
          {etfInfo && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{etfInfo.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{etfInfo.description}</p>
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-medium text-muted-foreground">Sector exposure auto-detected:</p>
                {topSectors.map(([sector, pct]) => (
                  <div key={sector} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-foreground">{sector}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {Object.keys(etfInfo.sectors).length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{Object.keys(etfInfo.sectors).length - 5} more sectors
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Selected stock info */}
          {selectedTicker && selectedTicker.type === "stock" && selectedTicker.sector && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/60 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{selectedTicker.name}</span>
              <Badge variant="outline" className="text-xs ml-auto">{selectedTicker.sector}</Badge>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Shares</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                placeholder="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allocation">Portfolio %</Label>
              <Input
                id="allocation"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="25"
                value={allocation}
                onChange={(e) => setAllocation(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : success ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Added!
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add {selectedTicker?.type === "etf" ? "ETF" : "Holding"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
