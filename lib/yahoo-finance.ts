/**
 * Yahoo Finance API Utility
 * Centralized fetch with retry logic, User-Agent rotation, and proper error handling.
 */

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
]

const YAHOO_ENDPOINTS = {
  primary: "https://query1.finance.yahoo.com",
  fallback: "https://query2.finance.yahoo.com",
}

interface FetchOptions {
  maxRetries?: number
  retryDelay?: number
  revalidate?: number
}

interface FetchResult<T> {
  data: T | null
  error: string | null
  status: number
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

/**
 * Fetch from Yahoo Finance with retry logic and User-Agent rotation.
 * Automatically falls back to query2 endpoint if query1 fails.
 */
export async function fetchYahooFinance<T>(
  path: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  const { maxRetries = 2, retryDelay = 1000, revalidate = 60 } = options
  const endpoints = [YAHOO_ENDPOINTS.primary, YAHOO_ENDPOINTS.fallback]

  for (const endpoint of endpoints) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const ua = USER_AGENTS[attempt % USER_AGENTS.length]
      const url = `${endpoint}${path}`

      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": ua,
            Accept: "application/json",
            "Accept-Language": "en-US,en;q=0.9",
          },
          next: { revalidate },
        })

        if (res.status === 429) {
          // Rate limited - wait and retry with different User-Agent
          console.warn(
            `[YahooFinance] Rate limited on ${endpoint}, attempt ${attempt + 1}/${maxRetries + 1}`
          )
          if (attempt < maxRetries) {
            await sleep(retryDelay * (attempt + 1))
            continue
          }
          // Try next endpoint
          break
        }

        if (!res.ok) {
          console.error(
            `[YahooFinance] HTTP ${res.status} from ${endpoint}${path}`
          )
          if (attempt < maxRetries) {
            await sleep(retryDelay)
            continue
          }
          break
        }

        const data = await res.json()
        return { data, error: null, status: res.status }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(
          `[YahooFinance] Fetch error on ${endpoint}${path}: ${errorMsg}`
        )
        if (attempt < maxRetries) {
          await sleep(retryDelay)
          continue
        }
        // Try next endpoint
        break
      }
    }
  }

  return { data: null, error: "All endpoints failed", status: 0 }
}

/**
 * Build Yahoo Finance chart URL path
 */
export function buildChartPath(
  ticker: string,
  range: string,
  interval: string
): string {
  return `/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}&includePrePost=false`
}

/**
 * Build Yahoo Finance quote summary URL path
 */
export function buildQuoteSummaryPath(
  ticker: string,
  modules: string[]
): string {
  return `/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules.join(",")}`
}

/**
 * Build Yahoo Finance search URL path
 */
export function buildSearchPath(query: string, count: number = 12): string {
  return `/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=${count}`
}

// Re-export a simple UA for components that do their own fetching
export const DEFAULT_USER_AGENT = getRandomUserAgent()
