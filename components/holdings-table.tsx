"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Trash2, TrendingUp, TrendingDown, Building2, Loader2, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { isKnownETF, getETFData, getStockSector, getExchange } from "@/lib/etf-data"
import { StockDetailModal } from "@/components/stock-detail-modal"

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

export function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [prices, setPrices] = useState<Record<string, PriceData>>({})
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [selectedStock, setSelectedStock] = useState<{ ticker: string; name: string } | null>(null)

  const tickers = useMemo(() => holdings.map((h) => h.ticker), [holdings])

  useEffect(() => {
    if (tickers.length === 0) return
    const fetchPrices = async () => {
      setLoadingPrices(true)
      try {
        const res = await fetch(`/api/stock-prices?tickers=${tickers.join(",")}`)
        if (res.ok) {
          const data = await res.json()
          setPrices(data.quotes || {})
        }
      } catch {
        // stay empty
      } finally {
        setLoadingPrices(false)
      }
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 120000)
    return () => clearInterval(interval)
  }, [tickers])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from("holdings").delete().eq("id", id)
    router.refresh()
    setDeletingId(null)
  }

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No holdings yet. Add your first stock or ETF to get started.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Holdings</CardTitle>
            <div className="flex items-center gap-2">
              {loadingPrices && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              <span className="text-xs text-muted-foreground">
                {holdings.length} {holdings.length === 1 ? "holding" : "holdings"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Ticker</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Allocation</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding) => {
                const type = holding.holding_type || (isKnownETF(holding.ticker) ? "etf" : "stock")
                const isEtf = type === "etf"
                const exchange = getExchange(holding.ticker)
                const isTSX = exchange === "TSX"
                const priceData = prices[holding.ticker]
                const value = priceData && holding.quantity ? priceData.price * holding.quantity : null
                const isUp = priceData ? priceData.changePercent > 0 : false
                const isDown = priceData ? priceData.changePercent < 0 : false
                const displayName = priceData?.name || holding.ticker

                return (
                  <TableRow key={holding.id} className="transition-colors duration-200 hover:bg-muted/50 group/row">
                    <TableCell>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedStock({
                            ticker: holding.ticker,
                            name: displayName,
                          })
                        }
                        className="text-left group/ticker"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold group-hover/ticker:text-primary transition-colors">
                            {holding.ticker}
                          </span>
                          <BarChart3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity" />
                          {isTSX && (
                            <Badge
                              variant="outline"
                              className="text-xs px-1 py-0 h-4 bg-red-500/10 text-red-400 border-red-500/20"
                            >
                              TSX
                            </Badge>
                          )}
                        </div>
                        {priceData && (
                          <span className="text-xs text-muted-foreground group-hover/ticker:text-primary/70 transition-colors">
                            {priceData.name}
                          </span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${isEtf ? "border-primary/30 text-primary" : ""}`}
                      >
                        {isEtf ? <TrendingUp className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                        {isEtf ? "ETF" : "Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {priceData ? (
                        <span className="font-medium">
                          {priceData.currency === "CAD" ? "C" : ""}${priceData.price.toFixed(2)}
                        </span>
                      ) : loadingPrices ? (
                        <span className="text-muted-foreground text-xs">...</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {priceData ? (
                        <div
                          className={`flex items-center justify-end gap-1 ${
                            isUp ? "text-emerald-400" : isDown ? "text-red-400" : "text-muted-foreground"
                          }`}
                        >
                          {isUp ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : isDown ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : null}
                          <span className="text-sm">
                            {isUp ? "+" : ""}
                            {priceData.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {holding.quantity ?? "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {value ? (
                        <span className="font-medium">
                          {priceData?.currency === "CAD" ? "C" : ""}$
                          {value.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {holding.allocation_percent ? `${holding.allocation_percent}%` : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(holding.id)}
                        disabled={deletingId === holding.id}
                        className="text-muted-foreground hover:text-destructive hover:scale-110 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete holding</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock Detail Modal */}
      {selectedStock && (
        <StockDetailModal
          ticker={selectedStock.ticker}
          name={selectedStock.name}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </>
  )
}
