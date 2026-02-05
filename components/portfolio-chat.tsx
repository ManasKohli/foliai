"use client"

import React from "react"

import { useState } from "react"
import { MessageCircle, Send, Loader2, Info } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

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

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/portfolio-chat" }),
  })

  const isLoading = status === "streaming" || status === "submitted"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Include portfolio context with ETF look-through
    let portfolioContext = "[No holdings in portfolio]"
    if (holdings.length > 0) {
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

      portfolioContext = `[Portfolio: ${holdingsList}. Effective sector exposure (including ETF look-through): ${sectorSummary}]`
    }

    sendMessage({ text: `${portfolioContext}\n\nUser question: ${input}` })
    setInput("")
  }

  const suggestedQuestions = [
    "Why is my portfolio risky?",
    "Am I diversified enough?",
    "What should I watch this week?",
    "Explain my sector exposure",
  ]

  return (
    <Card className="flex flex-col h-[400px] transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Portfolio Chat
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Ask questions about your portfolio in plain English
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-4">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Try asking:
              </p>
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
                        // Clean up the user message to hide portfolio context
                        const text = message.role === "user"
                          ? part.text.replace(/\[Portfolio Context:.*?\]\n\nUser question: /s, "")
                          : part.text
                        return <span key={index}>{text}</span>
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
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2 mt-4 flex-shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your portfolio..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
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
          <span>Educational only. Not financial advice.</span>
        </div>
      </CardContent>
    </Card>
  )
}
