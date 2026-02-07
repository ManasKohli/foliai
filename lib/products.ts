export interface PricingPlan {
  id: string
  name: string
  description: string
  priceInCents: number
  credits: number
  features: string[]
  popular?: boolean
}

export const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Starter",
    description: "Get started with basic portfolio analysis",
    priceInCents: 0,
    credits: 10,
    features: [
      "10 AI chat messages / month",
      "1 portfolio",
      "Up to 10 holdings",
      "Basic sector breakdown",
      "Pre-market briefing (futures, gold, rates)",
      "Daily market news",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For active investors who want deeper insights",
    priceInCents: 1499,
    credits: 200,
    popular: true,
    features: [
      "200 AI chat messages / month",
      "Unlimited portfolios",
      "Unlimited holdings",
      "ETF look-through analysis",
      "Real-time price tracking",
      "Macro outlook with moving averages",
      "Fear & Greed index + yield curve",
      "Advanced AI portfolio insights",
      "Historical performance charts",
      "Priority support",
    ],
  },
  {
    id: "unlimited",
    name: "Unlimited",
    description: "Unlimited access for power users and professionals",
    priceInCents: 3999,
    credits: -1, // -1 means unlimited
    features: [
      "Unlimited AI chat messages",
      "Everything in Pro",
      "Full macro dashboard + yield curve",
      "Multi-portfolio comparison",
      "Export reports (PDF/CSV)",
      "API access",
      "Custom AI instructions",
      "Dedicated support",
    ],
  },
]

export function getPlanById(id: string): PricingPlan | undefined {
  return PLANS.find((p) => p.id === id)
}

export function getPlanCredits(planId: string): number {
  const plan = getPlanById(planId)
  return plan?.credits ?? 10
}

export function isUnlimited(planId: string): boolean {
  const plan = getPlanById(planId)
  return plan?.credits === -1
}
