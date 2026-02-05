import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: credits } = await supabase
    .from("user_credits")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!credits) {
    // Auto-create for existing users who don't have a credits record
    const { data: newCredits } = await supabase
      .from("user_credits")
      .insert({
        user_id: user.id,
        plan: "free",
        credits_remaining: 10,
        credits_total: 10,
      })
      .select()
      .single()

    return NextResponse.json(
      newCredits || {
        plan: "free",
        credits_remaining: 10,
        credits_total: 10,
      }
    )
  }

  return NextResponse.json(credits)
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: credits } = await supabase
    .from("user_credits")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!credits) {
    return NextResponse.json(
      { error: "No credits record found" },
      { status: 404 }
    )
  }

  // Unlimited plan
  if (credits.plan === "unlimited" || credits.credits_total === -1) {
    return NextResponse.json({ allowed: true, remaining: -1 })
  }

  // Check if user has credits
  if (credits.credits_remaining <= 0) {
    return NextResponse.json(
      {
        allowed: false,
        remaining: 0,
        message: "No AI credits remaining. Please upgrade your plan.",
      },
      { status: 403 }
    )
  }

  // Deduct one credit
  const { data: updated } = await supabase
    .from("user_credits")
    .update({
      credits_remaining: credits.credits_remaining - 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single()

  return NextResponse.json({
    allowed: true,
    remaining: updated?.credits_remaining ?? credits.credits_remaining - 1,
  })
}
