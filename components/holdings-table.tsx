"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, TrendingUp, Building2 } from "lucide-react"
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
import { isKnownETF, getETFData, getStockSector } from "@/lib/etf-data"

interface Holding {
  id: string
  ticker: string
  quantity: number | null
  allocation_percent: number | null
  sector: string | null
  holding_type?: string
}

export function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
    <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Holdings</CardTitle>
          <span className="text-xs text-muted-foreground">
            {holdings.length} {holdings.length === 1 ? "holding" : "holdings"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Ticker</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead>Allocation</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding) => {
              const type = holding.holding_type || (isKnownETF(holding.ticker) ? "etf" : "stock")
              const isEtf = type === "etf"
              const etfData = isEtf ? getETFData(holding.ticker) : null
              const displaySector = holding.sector || getStockSector(holding.ticker)
              const topEtfSectors = etfData
                ? Object.entries(etfData.sectors).sort(([, a], [, b]) => b - a).slice(0, 2)
                : []

              return (
                <TableRow key={holding.id} className="transition-colors duration-200 hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{holding.ticker}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs gap-1 ${
                        isEtf ? "border-primary/30 text-primary" : ""
                      }`}
                    >
                      {isEtf ? <TrendingUp className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                      {isEtf ? "ETF" : "Stock"}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{holding.quantity ?? "-"}</TableCell>
                  <TableCell className="tabular-nums">
                    {holding.allocation_percent ? `${holding.allocation_percent}%` : "-"}
                  </TableCell>
                  <TableCell>
                    {isEtf && topEtfSectors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {topEtfSectors.map(([sector, pct]) => (
                          <span key={sector} className="text-xs text-muted-foreground">
                            {sector} {pct}%
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm">{displaySector || "-"}</span>
                    )}
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
  )
}
