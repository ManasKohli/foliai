"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

const SECTORS = [
  "Technology",
  "Healthcare",
  "Financials",
  "Consumer Discretionary",
  "Consumer Staples",
  "Energy",
  "Industrials",
  "Materials",
  "Real Estate",
  "Utilities",
  "Communication Services",
  "Other",
]

interface AddHoldingFormProps {
  portfolioId: string | undefined
  userId: string
}

export function AddHoldingForm({ portfolioId, userId }: AddHoldingFormProps) {
  const router = useRouter()
  const [ticker, setTicker] = useState("")
  const [quantity, setQuantity] = useState("")
  const [allocation, setAllocation] = useState("")
  const [sector, setSector] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!portfolioId) {
      setError("Portfolio not found. Please refresh the page.")
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const { error: insertError } = await supabase.from("holdings").insert({
      portfolio_id: portfolioId,
      user_id: userId,
      ticker: ticker.toUpperCase(),
      quantity: quantity ? parseFloat(quantity) : null,
      allocation_percent: allocation ? parseFloat(allocation) : null,
      sector: sector || null,
    })

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    setTicker("")
    setQuantity("")
    setAllocation("")
    setSector("")
    setIsLoading(false)
    router.refresh()
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
          Add Holding
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticker">Ticker Symbol</Label>
            <Input
              id="ticker"
              placeholder="e.g. AAPL"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
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
              <Label htmlFor="allocation">Allocation %</Label>
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

          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Select value={sector} onValueChange={setSector} disabled={isLoading}>
              <SelectTrigger id="sector">
                <SelectValue placeholder="Select sector" />
              </SelectTrigger>
              <SelectContent>
                {SECTORS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Holding
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
