import { consumeStream, convertToModelMessages, streamText, UIMessage } from "ai"
import { xai } from "@ai-sdk/xai"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages, portfolioContext }: { messages: UIMessage[]; portfolioContext?: string } = await req.json()

  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Check and deduct credits
  const { data: credits } = await supabase
    .from("user_credits")
    .select("*")
    .eq("user_id", user.id)
    .single()

  const isUnlimited = credits?.plan === "unlimited" || credits?.credits_total === -1

  if (!isUnlimited) {
    const remaining = credits?.credits_remaining ?? 0
    if (remaining <= 0) {
      return new Response(
        JSON.stringify({ error: "NO_CREDITS" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      )
    }

    // Deduct one credit
    await supabase
      .from("user_credits")
      .update({
        credits_remaining: remaining - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
  }

  const result = streamText({
    model: xai("grok-4"),
    system: `You are Folio AI, a helpful portfolio analysis assistant powered by Grok. Your role is to explain portfolio concepts in plain, accessible language.

IMPORTANT GUIDELINES:
- You provide educational explanations only, NOT financial advice
- Always remind users that this is for educational purposes
- Focus on explaining concepts like diversification, risk, sector exposure, concentration
- Be conversational and friendly
- Keep responses concise (2-3 paragraphs max)
- When users share their portfolio context, reference their specific holdings
- Explain complex financial concepts in simple terms
- Never recommend specific buy/sell actions

SPECIAL: ETF LOOK-THROUGH ANALYSIS
- When a user holds ETFs (like SPY, QQQ, VOO, VTI, XIU.TO, XIC.TO), you understand that ETFs represent baskets of stocks across multiple sectors
- Use the "effective sector exposure" data provided in the context to explain the user's TRUE sector allocation
- Highlight ETF overlap risks - e.g., SPY and VOO are nearly identical
- For Canadian (TSX) holdings, note any CAD/USD currency considerations
- When discussing sector concentration, always use the effective (look-through) numbers

USER PORTFOLIO CONTEXT:
${portfolioContext || "No portfolio data available yet. The user hasn't added any holdings."}`,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
