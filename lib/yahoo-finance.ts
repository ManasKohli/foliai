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

// Crumb cache for v10 API (expires after 30 minutes)
let crumbCache: { crumb: string; cookie: string; expires: number } | null = null

interface FetchOptions {
  maxRetries?: number
  retryDelay?: number
  revalidate?: number
  requiresCrumb?: boolean
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
 * Fetch crumb token from Yahoo Finance for v10 API access
 */
async function fetchCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  // Check cache first
  if (crumbCache && crumbCache.expires > Date.now()) {
    return { crumb: crumbCache.crumb, cookie: crumbCache.cookie }
  }

  try {
    const ua = getRandomUserAgent()
    // Fetch Yahoo Finance quote page to extract crumb from HTML
    const res = await fetch("https://finance.yahoo.com/quote/AAPL", {
      headers: {
        "User-Agent": ua,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "no-store",
    })

    if (!res.ok) {
      console.error(`[YahooFinance] Failed to fetch quote page: ${res.status}`)
      return null
    }

    const html = await res.text()

    // Extract crumb from HTML (it's in a script tag as "CrumbStore":{"crumb":"..."})
    const crumbMatch = html.match(/"CrumbStore":\{"crumb":"([^"]+)"\}/)
    if (!crumbMatch || !crumbMatch[1]) {
      console.error("[YahooFinance] Could not find crumb in HTML")
      return null
    }

    const crumb = crumbMatch[1]

    // Extract cookies from response
    const setCookieHeaders = res.headers.getSetCookie?.() || []
    let cookies = ""
    if (setCookieHeaders.length > 0) {
      cookies = setCookieHeaders
        .map((cookie) => cookie.split(";")[0])
        .join("; ")
    } else {
      // Fallback for older Node versions
      const singleCookie = res.headers.get("set-cookie")
      if (singleCookie) {
        cookies = singleCookie.split(";")[0]
      }
    }

    // Cache for 30 minutes
    crumbCache = {
      crumb,
      cookie: cookies,
      expires: Date.now() + 30 * 60 * 1000,
    }

    console.log("[YahooFinance] Successfully fetched crumb token")
    return { crumb, cookie: cookies }
  } catch (error) {
    console.error("[YahooFinance] Failed to fetch crumb:", error)
    return null
  }
}

/**
 * Fetch from Yahoo Finance with retry logic and User-Agent rotation.
 * Automatically falls back to query2 endpoint if query1 fails.
 */
export async function fetchYahooFinance<T>(
  path: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  const { maxRetries = 2, retryDelay = 1000, revalidate = 60, requiresCrumb = false } = options
  const endpoints = [YAHOO_ENDPOINTS.primary, YAHOO_ENDPOINTS.fallback]

  // Get crumb if needed for v10 API
  let crumbData: { crumb: string; cookie: string } | null = null
  if (requiresCrumb) {
    crumbData = await fetchCrumb()
    if (!crumbData) {
      console.error("[YahooFinance] Failed to obtain crumb token")
      return { data: null, error: "Failed to obtain authentication token", status: 0 }
    }
  }

  for (const endpoint of endpoints) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const ua = USER_AGENTS[attempt % USER_AGENTS.length]
      let url = `${endpoint}${path}`

      // Add crumb to URL if required
      if (crumbData) {
        const separator = path.includes("?") ? "&" : "?"
        url += `${separator}crumb=${encodeURIComponent(crumbData.crumb)}`
      }

      try {
        const headers: Record<string, string> = {
          "User-Agent": ua,
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
        }

        // Add cookie if we have crumb
        if (crumbData) {
          headers.Cookie = crumbData.cookie
        }

        const res = await fetch(url, {
          headers,
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
