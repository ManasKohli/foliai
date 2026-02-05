"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { Check, PieChart, ArrowRight, Zap, Crown, Sparkles, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PLANS } from "@/lib/products"
import { Checkout } from "@/components/checkout"

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  if (selectedPlan) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center">
            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to plans
            </button>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold text-foreground text-center mb-8">
            Complete your subscription
          </h1>
          <Checkout planId={selectedPlan} />
        </main>
      </div>
    )
  }

  const planIcons: Record<string, React.ReactNode> = {
    free: <Zap className="h-5 w-5" />,
    pro: <Sparkles className="h-5 w-5" />,
    unlimited: <Crown className="h-5 w-5" />,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <PieChart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Folio AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            Simple, transparent pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight text-balance">
            Choose the right plan for your portfolio
          </h1>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Start free and upgrade as you grow. All plans include real-time prices, ETF look-through analysis, and market news.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                  : "hover:border-primary/40 hover:shadow-primary/5"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground shadow-md">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4 pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${plan.popular ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {planIcons[plan.id]}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.priceInCents === 0
                        ? "$0"
                        : `$${(plan.priceInCents / 100).toFixed(2)}`}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.credits === -1
                      ? "Unlimited AI messages"
                      : `${plan.credits} AI messages per month`}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className={`w-full group ${plan.popular ? "" : "variant-outline"}`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => {
                    if (plan.priceInCents === 0) {
                      window.location.href = "/auth/sign-up"
                    } else {
                      setSelectedPlan(plan.id)
                    }
                  }}
                >
                  {plan.priceInCents === 0 ? "Get Started Free" : "Subscribe"}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
                <ul className="space-y-2.5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "What counts as an AI credit?",
                a: "Each message you send to the AI Portfolio Chat uses 1 credit. AI-generated insights on your dashboard are free and don't count against your credits.",
              },
              {
                q: "What happens when I run out of credits?",
                a: "Your portfolio dashboard, real-time prices, charts, and market news continue working. Only the AI chat feature is paused until your credits refresh or you upgrade.",
              },
              {
                q: "Do credits reset monthly?",
                a: "Yes. Your credits reset to your plan's full amount at the start of each billing cycle.",
              },
              {
                q: "Can I switch plans?",
                a: "Absolutely. You can upgrade or downgrade at any time. When you upgrade, you'll immediately receive the new plan's credit allotment.",
              },
              {
                q: "Do you support Canadian TSX stocks?",
                a: "Yes! Folio AI supports both US and Canadian exchanges, including TSX-listed stocks, Canadian ETFs (XIU.TO, XIC.TO, VEQT.TO, etc.), and CAD-denominated assets.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="group p-4 rounded-lg border border-border/60 hover:border-primary/30 transition-all duration-200"
              >
                <h3 className="font-medium text-foreground">{faq.q}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          Folio AI is an educational tool and does not provide financial advice.
        </div>
      </footer>
    </div>
  )
}
