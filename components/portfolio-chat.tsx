"use client"

import React, { useEffect, useState, useCallback } from "react"
import { MessageCircle, Send, Loader2, Info, Zap, Crown } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { calculateEffectiveSectorExposure, isKnownETF, getETFData } from "@/lib/etf-data"

interface Holding {
  id: string
  ticker: string
  allocation_percent: number | null
  sector: string | null
  holding_type?: string
}

interface PortfolioChatProps {
  holdings: Holding[]
}

export function PortfolioChat({ holdings }: PortfolioChatProps) {
  const [input, setInput] = useState("")
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)
  const [plan, setPlan] = useState("free")
  const [noCredits, setNoCredits] = useState(false)

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/credits")
      if (res.ok) {
        const data = await res.json()
        setCreditsRemaining(data.credits_remaining)
        setPlan(data.plan || "free")
        setNoCredits(data.credits_remaining <= 0 && data.plan !== "unlimited" && data.credits_total !== -1)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  const buildPortfolioContext = useCallback(() => {
    if (holdings.length === 0) return "No holdings in portfolio yet."

    const holdingsList = holdings.map(h => {
      const type = h.holding_type || (isKnownETF(h.ticker) ? "etf" : "stock")
      const etf = type === "etf" ? getETFData(h.ticker) : null
      const etfDetail = etf ? ` (${etf.name}, sectors: ${Object.entries(etf.sectors).slice(0, 3).map(([s, p]) => `${s} ${p}%`).join(", ")})` : ""
      return `${h.ticker} ${type.toUpperCase()} ${h.allocation_percent}%${h.sector ? ` in ${h.sector}` : ""}${etfDetail}`
    }).join("; ")

    const effectiveExposure = calculateEffectiveSectorExposure(
      holdings.filter(h => h.allocation_percent).map(h => ({
        ticker: h.ticker,
        allocation_percent: h.allocation_percent || 0,
        holding_type: h.holding_type || (isKnownETF(h.ticker) ? "etf" : "stock"),
        sector: h.sector,
      }))
    )
    const sectorSummary = Object.entries(effectiveExposure)
      .sort(([, a], [, b]) => b - a)
      .map(([s, p]) => `${s}: ${p.toFixed(1)}%`)
      .join(", ")

    return `Portfolio: ${holdingsList}. Effective sector exposure (including ETF look-through): ${sectorSummary}`
  }, [holdings])

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/portfolio-chat",
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          id,
          messages,
          portfolioContext: buildPortfolioContext(),
        },
      }),
    }),
    onError: (error) => {
      if (error.message?.includes("NO_CREDITS") || error.message?.includes("403")) {
        setNoCredits(true)
      }
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || noCredits) return
    setNoCredits(false)
    sendMessage({ text: input })
    setInput("")
    // Refresh credits count after a short delay
    setTimeout(fetchCredits, 1500)
  }

  const isUnlimited = plan === "unlimited" || creditsRemaining === -1

  const suggestedQuestions = [
    "Why is my portfolio risky?",
    "Am I diversified enough?",
    "Explain my sector exposure",
    "How do my ETFs overlap?",
  ]

  return (
    <Card className="flex flex-col h-[440px] transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            Portfolio Chat
            <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
              Grok AI
            </Badge>
          </CardTitle>
          {creditsRemaining !== null && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isUnlimited ? (
                <span className="flex items-center gap-1 text-primary">
                  <Crown className="h-3 w-3" /> Unlimited
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {creditsRemaining} credits left
                </span>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Ask questions about your portfolio in plain English
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-4">
          {messages.length === 0 && !noCredits ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setInput(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:scale-105 transition-all duration-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm transition-all duration-200 hover:shadow-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-foreground"
                    }`}
                  >
                    {message.parts.map((part, index) => {
                      if (part.type === "text") {
                        return <span key={index}>{part.text}</span>
                      }
                      return null
                    })}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted/50 rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}

          {noCredits && (
            <div className="mt-4 p-4 rounded-lg border border-primary/20 bg-primary/5 text-center space-y-3">
              <Zap className="h-8 w-8 text-primary mx-auto" />
              <div>
                <p className="text-sm font-medium text-foreground">Out of AI credits</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upgrade your plan to continue chatting with Folio AI
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href="/pricing">Upgrade Plan</Link>
              </Button>
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2 mt-4 flex-shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={noCredits ? "Upgrade to continue chatting..." : "Ask about your portfolio..."}
            disabled={isLoading || noCredits}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim() || noCredits}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </form>

        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground/70">
          <Info className="h-3 w-3" />
          <span>Powered by Grok. Educational only, not financial advice.</span>
        </div>
      </CardContent>
    </Card>
  )
}
