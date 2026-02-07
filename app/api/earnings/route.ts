import { NextResponse } from "next/server"

// GET /api/earnings?ticker=AAPL
// Returns earnings date for a ticker using Finnhub free API
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get("ticker")?.trim().toUpperCase()

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker param" }, { status: 400 })
  }

  try {
    const apiKey = process.env.FINNHUB_API_KEY
    if (!apiKey) {
      console.error("[Earnings] FINNHUB_API_KEY not set in environment variables")
      return NextResponse.json({ earningsDate: null })
    }

    // Use Finnhub API for earnings calendar with date range
    // Fetch from 30 days ago to 90 days in the future
    const today = new Date()
    const from = new Date(today)
    from.setDate(from.getDate() - 30)
    const to = new Date(today)
    to.setDate(to.getDate() + 90)

    const fromStr = from.toISOString().split("T")[0]
    const toStr = to.toISOString().split("T")[0]

    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${fromStr}&to=${toStr}&token=${apiKey}`

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!res.ok) {
      console.error(`[Earnings] Finnhub returned ${res.status}`)
      return NextResponse.json({ earningsDate: null })
    }

    const data = await res.json()
    const allEarnings = data?.earningsCalendar || []

    // Filter for this specific ticker
    const earningsCalendar = allEarnings.filter(
      (e: { symbol?: string }) => e.symbol === ticker
    )

    if (earningsCalendar.length === 0) {
      return NextResponse.json({ earningsDate: null })
    }

    const todayStr = new Date().toISOString().split("T")[0]

    // First try to find upcoming earnings
    const upcomingEarnings = earningsCalendar
      .filter((e: { date?: string }) => e.date && e.date >= todayStr)
      .sort((a: { date: string }, b: { date: string }) =>
        a.date.localeCompare(b.date)
      )

    // If we have upcoming earnings, return the next one
    if (upcomingEarnings.length > 0) {
      const nextEarnings = upcomingEarnings[0]
      return NextResponse.json({
        earningsDate: nextEarnings.date,
        eps: nextEarnings.epsEstimate || null,
        epsActual: nextEarnings.epsActual || null,
        revenueEstimate: nextEarnings.revenueEstimate || null,
        revenueActual: nextEarnings.revenueActual || null,
        quarter: nextEarnings.quarter || null,
        year: nextEarnings.year || null,
        isUpcoming: true,
      })
    }

    // If no upcoming earnings, return the most recent past earnings
    const pastEarnings = earningsCalendar
      .filter((e: { date?: string }) => e.date && e.date < todayStr)
      .sort((a: { date: string }, b: { date: string }) =>
        b.date.localeCompare(a.date)
      )

    if (pastEarnings.length > 0) {
      const mostRecent = pastEarnings[0]
      return NextResponse.json({
        earningsDate: mostRecent.date,
        eps: mostRecent.epsEstimate || mostRecent.epsActual || null,
        epsActual: mostRecent.epsActual || null,
        revenueEstimate: mostRecent.revenueEstimate || null,
        revenueActual: mostRecent.revenueActual || null,
        quarter: mostRecent.quarter || null,
        year: mostRecent.year || null,
        isUpcoming: false,
      })
    }

    return NextResponse.json({ earningsDate: null })
  } catch (error) {
    console.error(`[Earnings] Error fetching earnings for ${ticker}:`, error)
    return NextResponse.json({ earningsDate: null })
  }
}
