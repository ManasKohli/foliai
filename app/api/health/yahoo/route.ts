import { NextResponse } from "next/server"
import { fetchYahooFinance } from "@/lib/yahoo-finance"

interface TestResult {
  name: string
  success: boolean
  status: number
  error: string | null
  duration: string
  hasData: boolean
}

// GET /api/health/yahoo - Diagnostic endpoint to test Yahoo Finance API connectivity
export async function GET() {
  const tests = [
    {
      name: "v8 Chart",
      path: "/v8/finance/chart/AAPL?range=1d&interval=5m",
    },
    {
      name: "v10 Summary",
      path: "/v10/finance/quoteSummary/AAPL?modules=price",
    },
    {
      name: "v1 Search",
      path: "/v1/finance/search?q=AAPL&quotesCount=1",
    },
  ]

  const results: TestResult[] = await Promise.all(
    tests.map(async (test) => {
      const start = Date.now()
      const { data, error, status } = await fetchYahooFinance<Record<string, unknown>>(
        test.path,
        { revalidate: 0 } // No caching for health checks
      )
      const duration = Date.now() - start

      return {
        name: test.name,
        success: data !== null,
        status,
        error,
        duration: `${duration}ms`,
        hasData: data !== null && Object.keys(data).length > 0,
      }
    })
  )

  const allHealthy = results.every((r) => r.success)

  return NextResponse.json(
    {
      healthy: allHealthy,
      timestamp: new Date().toISOString(),
      tests: results,
    },
    { status: allHealthy ? 200 : 503 }
  )
}
