"use client"

import React from "react"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, ArrowRight, Loader2, Zap, Crown, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface Credits {
  plan: string
  credits_remaining: number
  credits_total: number
}

export default function BillingPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [credits, setCredits] = useState<Credits | null>(null)
  const [loading, setLoading] = useState(true)
  const [justPurchased, setJustPurchased] = useState(false)

  useEffect(() => {
    if (sessionId) {
      setJustPurchased(true)
    }

    const fetchCredits = async () => {
      try {
        const res = await fetch("/api/credits")
        if (res.ok) {
          const data = await res.json()
          setCredits(data)
        }
      } catch { /* ignore */ }
      setLoading(false)
    }

    // If just purchased, wait a moment for webhook to process
    if (sessionId) {
      setTimeout(fetchCredits, 2000)
    } else {
      fetchCredits()
    }
  }, [sessionId])

  const isUnlimited = credits?.plan === "unlimited" || credits?.credits_total === -1
  const usagePercent = credits && !isUnlimited
    ? ((credits.credits_total - credits.credits_remaining) / credits.credits_total) * 100
    : 0

  const planDisplay: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
    free: { name: "Starter", icon: <Zap className="h-5 w-5" />, color: "text-muted-foreground" },
    pro: { name: "Pro", icon: <Sparkles className="h-5 w-5" />, color: "text-primary" },
    unlimited: { name: "Unlimited", icon: <Crown className="h-5 w-5" />, color: "text-primary" },
  }

  const currentPlan = planDisplay[credits?.plan || "free"] || planDisplay.free

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {justPurchased && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-6">
            <CheckCircle2 className="h-10 w-10 text-primary flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Welcome to {currentPlan.name}!</h2>
              <p className="text-sm text-muted-foreground">
                Your subscription is active. Your AI credits have been added to your account.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Plan</span>
            <Badge variant="outline" className={`flex items-center gap-1.5 ${currentPlan.color}`}>
              {currentPlan.icon}
              {currentPlan.name}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">AI Chat Credits</span>
              <span className="text-sm font-medium text-foreground">
                {isUnlimited ? (
                  "Unlimited"
                ) : (
                  `${credits?.credits_remaining ?? 0} / ${credits?.credits_total ?? 10} remaining`
                )}
              </span>
            </div>
            {!isUnlimited && (
              <Progress value={usagePercent} className="h-2" />
            )}
          </div>

          {credits?.plan === "free" && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border/60">
              <p className="text-sm text-muted-foreground mb-3">
                Upgrade to unlock more AI messages and advanced features.
              </p>
              <Button asChild className="group">
                <Link href="/pricing">
                  View Plans
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          )}

          {(credits?.plan === "pro" || credits?.plan === "unlimited") && (
            <p className="text-xs text-muted-foreground">
              Credits reset at the start of each billing cycle. Manage your subscription from your Stripe dashboard.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
