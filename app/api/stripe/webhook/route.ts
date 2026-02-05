import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  let event
  try {
    if (sig && process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } else {
      event = JSON.parse(body)
    }
  } catch {
    return NextResponse.json({ error: "Webhook error" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    const planId = session.metadata?.planId
    const credits = Number.parseInt(session.metadata?.credits || "0", 10)
    const customerEmail = session.customer_details?.email

    if (customerEmail && planId) {
      // Find user by email
      const { data: userData } = await supabaseAdmin.auth.admin.listUsers()
      const user = userData?.users?.find((u) => u.email === customerEmail)

      if (user) {
        await supabaseAdmin
          .from("user_credits")
          .upsert(
            {
              user_id: user.id,
              plan: planId,
              credits_remaining: credits,
              credits_total: credits,
              stripe_customer_id: session.customer as string,
              stripe_session_id: session.id,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          )
      }
    }
  }

  return NextResponse.json({ received: true })
}
