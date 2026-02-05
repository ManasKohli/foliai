"use server"

import { stripe } from "@/lib/stripe"
import { PLANS } from "@/lib/products"

export async function createCheckoutSession(planId: string) {
  const plan = PLANS.find((p) => p.id === planId)
  if (!plan || plan.priceInCents === 0) {
    throw new Error("Invalid plan selected")
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Folio AI ${plan.name}`,
            description: plan.description,
          },
          unit_amount: plan.priceInCents,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    ui_mode: "embedded",
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      planId: plan.id,
      credits: plan.credits.toString(),
    },
  })

  return { clientSecret: session.client_secret }
}
