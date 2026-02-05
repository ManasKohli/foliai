"use client"

import React from "react"
import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, Search, TrendingUp, Building2, Check, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { ETF_DATA, isKnownETF, getStockSector, getETFData, getAllTickers, type ETFSectorBreakdown } from "@/lib/etf-data"

const LOCAL_TICKERS = getAllTickers()

type TickerResult = {
  ticker: string
  name: string
  type: "stock" | "etf"
  sector: string | null
  exchange: string
}

interface AddHoldingFormProps {
  portfolioId: string | undefined
  userId: string
}

export function AddHoldingForm({ portfolioId, userId }: AddHoldingFormProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTicker, setSelectedTicker] = useState<TickerResult | null>(null)
  const [quantity, setQuantity] = useState("")
  const [allocation, setAllocation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [success, setSuccess] = useState(false)
  const [apiResults, setApiResults] = useState<TickerResult[]>([])
  const [searching, setSearching] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Local instant filter
  const localFiltered = useMemo(() => {
    if (!searchQuery.trim()) return LOCAL_TICKERS.slice(0, 6)
    const q = searchQuery.toUpperCase().trim()
    return LOCAL_TICKERS.filter(
      (t) => t.ticker.includes(q) || t.name.toUpperCase().includes(q),
    ).slice(0, 6)
  }, [searchQuery])

  // Debounced remote search
  const searchRemote = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 1) {
      setApiResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stock-search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setApiResults(data.results || [])
        }
      } catch {
        // stay with local results
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

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

  // Merge local + remote, dedupe by ticker
  const mergedResults = useMemo(() => {
    const seen = new Set<string>()
    const merged: TickerResult[] = []
    // Local matches first (instant)
    for (const item of localFiltered) {
      if (!seen.has(item.ticker)) {
        seen.add(item.ticker)
        merged.push(item)
      }
    }
    // Then remote results
    for (const item of apiResults) {
      if (!seen.has(item.ticker)) {
        seen.add(item.ticker)
        // Enrich with local data if available
        const localInfo = LOCAL_TICKERS.find((l) => l.ticker === item.ticker)
        merged.push(localInfo || item)
      }
    }
    return merged.slice(0, 15)
  }, [localFiltered, apiResults])

  const handleSelect = (item: TickerResult) => {
    setSelectedTicker(item)
    setSearchQuery(item.ticker)
    setShowDropdown(false)
  }

  const etfInfo: ETFSectorBreakdown | null =
    selectedTicker?.type === "etf" ? (ETF_DATA[selectedTicker.ticker] || null) : null

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

    const ticker = selectedTicker?.ticker || searchQuery.toUpperCase().trim()
    if (!ticker) {
      setError("Please select a ticker.")
      setIsLoading(false)
      return
    }

    const holdingType = selectedTicker?.type || (isKnownETF(ticker) ? "etf" : "stock")
    const sector = holdingType === "stock" ? (selectedTicker?.sector || getStockSector(ticker) || null) : null

    const supabase = createClient()
    const { error: insertError } = await supabase.from("holdings").insert({
      portfolio_id: portfolioId,
      user_id: userId,
      ticker,
      quantity: quantity ? Number.parseFloat(quantity) : null,
      allocation_percent: allocation ? Number.parseFloat(allocation) : null,
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
    setApiResults([])
    setIsLoading(false)
    router.refresh()
    setTimeout(() => setSuccess(false), 2000)
  }

  const topSectors = etfInfo
    ? Object.entries(etfInfo.sectors).sort(([, a], [, b]) => b - a).slice(0, 5)
    : []

  const getExchangeBadge = (exchange: string) => {
    if (exchange === "TSX") return "bg-red-500/10 text-red-400 border-red-500/20"
    if (exchange === "NASDAQ") return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    if (exchange === "NYSE") return "bg-muted text-muted-foreground"
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  }

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
            <Label htmlFor="ticker-search">Search Any Stock, ETF, or Index</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="ticker-search"
                placeholder="Search AXP, GOLD, SHOP.TO, SPY..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedTicker(null)
                  setShowDropdown(true)
                  searchRemote(e.target.value)
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-9"
                autoComplete="off"
                required
                disabled={isLoading}
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Dropdown results */}
            {showDropdown && mergedResults.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto">
                {mergedResults.map((item) => (
                  <button
                    key={item.ticker}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <div
                      className={`h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        item.type === "etf" ? "bg-primary/15 text-primary" : "bg-muted text-foreground"
                      }`}
                    >
                      {item.type === "etf" ? <TrendingUp className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{item.ticker}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs px-1 py-0 h-4 ${item.type === "etf" ? "border-primary/30 text-primary" : ""}`}
                        >
                          {item.type === "etf" ? "ETF" : "Stock"}
                        </Badge>
                        <Badge variant="outline" className={`text-xs px-1 py-0 h-4 ${getExchangeBadge(item.exchange)}`}>
                          {item.exchange}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                    </div>
                    {item.sector && <span className="text-xs text-muted-foreground flex-shrink-0">{item.sector}</span>}
                  </button>
                ))}
                {searching && (
                  <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching global markets...
                  </div>
                )}
                {!searching && searchQuery.trim().length >= 2 && apiResults.length > 0 && (
                  <div className="px-3 py-1.5 text-xs text-muted-foreground border-t border-border/50 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Results from all global exchanges
                  </div>
                )}
              </div>
            )}

            {/* No results state */}
            {showDropdown && searchQuery.trim().length >= 2 && mergedResults.length === 0 && !searching && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
                No results found for &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          {/* ETF Sector Breakdown Preview */}
          {etfInfo && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{etfInfo.name}</span>
                {etfInfo.exchange && (
                  <Badge variant="outline" className={`text-xs px-1 py-0 h-4 ${getExchangeBadge(etfInfo.exchange)}`}>
                    {etfInfo.exchange}
                  </Badge>
                )}
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
                        <div className="h-full rounded-full bg-primary/60 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected stock info */}
          {selectedTicker && selectedTicker.type === "stock" && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/60 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{selectedTicker.name}</span>
              <Badge variant="outline" className={`text-xs ${getExchangeBadge(selectedTicker.exchange)}`}>
                {selectedTicker.exchange}
              </Badge>
              {selectedTicker.sector && (
                <Badge variant="outline" className="text-xs ml-auto">
                  {selectedTicker.sector}
                </Badge>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Shares</Label>
              <Input id="quantity" type="number" step="any" placeholder="100" value={quantity} onChange={(e) => setQuantity(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allocation">Portfolio %</Label>
              <Input id="allocation" type="number" step="0.01" min="0" max="100" placeholder="25" value={allocation} onChange={(e) => setAllocation(e.target.value)} disabled={isLoading} />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</>
            ) : success ? (
              <><Check className="mr-2 h-4 w-4" />Added!</>
            ) : (
              <><Plus className="mr-2 h-4 w-4" />Add {selectedTicker?.type === "etf" ? "ETF" : "Holding"}</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
