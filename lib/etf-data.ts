// ETF sector breakdown data for popular ETFs
// This maps ETF tickers to their approximate sector allocations

export interface ETFSectorBreakdown {
  name: string
  description: string
  sectors: Record<string, number> // sector name -> percentage
}

export const ETF_DATA: Record<string, ETFSectorBreakdown> = {
  SPY: {
    name: "SPDR S&P 500 ETF",
    description: "Tracks the S&P 500 Index",
    sectors: {
      Technology: 31,
      Healthcare: 12,
      Financials: 13,
      "Consumer Discretionary": 10,
      Communication: 9,
      Industrials: 8,
      "Consumer Staples": 6,
      Energy: 4,
      Utilities: 2,
      "Real Estate": 2,
      Materials: 3,
    },
  },
  QQQ: {
    name: "Invesco QQQ Trust",
    description: "Tracks the Nasdaq-100 Index",
    sectors: {
      Technology: 58,
      Communication: 16,
      "Consumer Discretionary": 13,
      Healthcare: 7,
      "Consumer Staples": 3,
      Industrials: 2,
      Utilities: 1,
    },
  },
  VOO: {
    name: "Vanguard S&P 500 ETF",
    description: "Tracks the S&P 500 Index",
    sectors: {
      Technology: 31,
      Healthcare: 12,
      Financials: 13,
      "Consumer Discretionary": 10,
      Communication: 9,
      Industrials: 8,
      "Consumer Staples": 6,
      Energy: 4,
      Utilities: 2,
      "Real Estate": 2,
      Materials: 3,
    },
  },
  VTI: {
    name: "Vanguard Total Stock Market ETF",
    description: "Tracks the CRSP US Total Market Index",
    sectors: {
      Technology: 30,
      Healthcare: 13,
      Financials: 13,
      "Consumer Discretionary": 10,
      Industrials: 9,
      Communication: 8,
      "Consumer Staples": 5,
      Energy: 4,
      Utilities: 3,
      "Real Estate": 3,
      Materials: 2,
    },
  },
  IWM: {
    name: "iShares Russell 2000 ETF",
    description: "Tracks the Russell 2000 small-cap index",
    sectors: {
      Healthcare: 17,
      Financials: 16,
      Industrials: 16,
      Technology: 14,
      "Consumer Discretionary": 10,
      Energy: 7,
      "Real Estate": 6,
      Communication: 4,
      Materials: 4,
      "Consumer Staples": 3,
      Utilities: 3,
    },
  },
  DIA: {
    name: "SPDR Dow Jones Industrial Average ETF",
    description: "Tracks the Dow Jones Industrial Average",
    sectors: {
      Financials: 18,
      Technology: 17,
      Healthcare: 16,
      Industrials: 14,
      "Consumer Discretionary": 13,
      "Consumer Staples": 7,
      Communication: 5,
      Energy: 4,
      Materials: 3,
      Utilities: 3,
    },
  },
  ARKK: {
    name: "ARK Innovation ETF",
    description: "Actively managed innovation-focused ETF",
    sectors: {
      Technology: 42,
      Healthcare: 28,
      Communication: 14,
      "Consumer Discretionary": 10,
      Industrials: 4,
      Financials: 2,
    },
  },
  XLK: {
    name: "Technology Select Sector SPDR",
    description: "Tracks the Technology Select Sector Index",
    sectors: {
      Technology: 100,
    },
  },
  XLF: {
    name: "Financial Select Sector SPDR",
    description: "Tracks the Financial Select Sector Index",
    sectors: {
      Financials: 100,
    },
  },
  XLE: {
    name: "Energy Select Sector SPDR",
    description: "Tracks the Energy Select Sector Index",
    sectors: {
      Energy: 100,
    },
  },
  XLV: {
    name: "Health Care Select Sector SPDR",
    description: "Tracks the Health Care Select Sector Index",
    sectors: {
      Healthcare: 100,
    },
  },
  XLI: {
    name: "Industrial Select Sector SPDR",
    description: "Tracks the Industrial Select Sector Index",
    sectors: {
      Industrials: 100,
    },
  },
  XLP: {
    name: "Consumer Staples Select Sector SPDR",
    description: "Tracks the Consumer Staples Select Sector Index",
    sectors: {
      "Consumer Staples": 100,
    },
  },
  XLY: {
    name: "Consumer Discretionary Select Sector SPDR",
    description: "Tracks the Consumer Discretionary Select Sector Index",
    sectors: {
      "Consumer Discretionary": 100,
    },
  },
  VGT: {
    name: "Vanguard Information Technology ETF",
    description: "Tracks the MSCI US Investable Market IT Index",
    sectors: {
      Technology: 100,
    },
  },
  SCHD: {
    name: "Schwab U.S. Dividend Equity ETF",
    description: "High-dividend yielding US stocks",
    sectors: {
      Financials: 18,
      Healthcare: 16,
      "Consumer Staples": 14,
      Industrials: 14,
      Technology: 12,
      Energy: 10,
      Communication: 6,
      "Consumer Discretionary": 5,
      Materials: 3,
      Utilities: 2,
    },
  },
  VUG: {
    name: "Vanguard Growth ETF",
    description: "Tracks the CRSP US Large Cap Growth Index",
    sectors: {
      Technology: 45,
      "Consumer Discretionary": 16,
      Communication: 12,
      Healthcare: 10,
      Industrials: 8,
      Financials: 5,
      "Consumer Staples": 2,
      "Real Estate": 1,
      Materials: 1,
    },
  },
  VTV: {
    name: "Vanguard Value ETF",
    description: "Tracks the CRSP US Large Cap Value Index",
    sectors: {
      Financials: 21,
      Healthcare: 17,
      Industrials: 13,
      "Consumer Staples": 10,
      Energy: 8,
      Technology: 8,
      Utilities: 7,
      Communication: 6,
      "Consumer Discretionary": 5,
      "Real Estate": 3,
      Materials: 2,
    },
  },
  EEM: {
    name: "iShares MSCI Emerging Markets ETF",
    description: "Tracks emerging markets equities",
    sectors: {
      Technology: 22,
      Financials: 21,
      "Consumer Discretionary": 13,
      Communication: 10,
      Materials: 8,
      Energy: 6,
      Industrials: 6,
      "Consumer Staples": 5,
      Healthcare: 4,
      Utilities: 3,
      "Real Estate": 2,
    },
  },
  VXUS: {
    name: "Vanguard Total International Stock ETF",
    description: "Tracks the FTSE Global All Cap ex US Index",
    sectors: {
      Financials: 20,
      Technology: 14,
      Industrials: 14,
      Healthcare: 10,
      "Consumer Discretionary": 11,
      "Consumer Staples": 7,
      Communication: 6,
      Materials: 7,
      Energy: 5,
      Utilities: 3,
      "Real Estate": 3,
    },
  },
}

// Stock sector mapping for common stocks
export const STOCK_SECTORS: Record<string, string> = {
  AAPL: "Technology",
  MSFT: "Technology",
  GOOGL: "Technology",
  GOOG: "Technology",
  AMZN: "Consumer Discretionary",
  NVDA: "Technology",
  META: "Communication",
  TSLA: "Consumer Discretionary",
  BRK: "Financials",
  "BRK.B": "Financials",
  "BRK.A": "Financials",
  UNH: "Healthcare",
  JNJ: "Healthcare",
  JPM: "Financials",
  V: "Financials",
  PG: "Consumer Staples",
  HD: "Consumer Discretionary",
  MA: "Financials",
  XOM: "Energy",
  CVX: "Energy",
  LLY: "Healthcare",
  ABBV: "Healthcare",
  MRK: "Healthcare",
  PFE: "Healthcare",
  KO: "Consumer Staples",
  PEP: "Consumer Staples",
  AVGO: "Technology",
  COST: "Consumer Staples",
  TMO: "Healthcare",
  WMT: "Consumer Staples",
  CSCO: "Technology",
  CRM: "Technology",
  ABT: "Healthcare",
  ACN: "Technology",
  MCD: "Consumer Discretionary",
  NFLX: "Communication",
  AMD: "Technology",
  INTC: "Technology",
  ADBE: "Technology",
  DIS: "Communication",
  NKE: "Consumer Discretionary",
  PYPL: "Financials",
  BA: "Industrials",
  CAT: "Industrials",
  GE: "Industrials",
  RTX: "Industrials",
  UNP: "Industrials",
  HON: "Industrials",
  GS: "Financials",
  MS: "Financials",
  BLK: "Financials",
  C: "Financials",
  BAC: "Financials",
  WFC: "Financials",
  SCHW: "Financials",
  NEE: "Utilities",
  DUK: "Utilities",
  SO: "Utilities",
  COP: "Energy",
  SLB: "Energy",
  EOG: "Energy",
  LIN: "Materials",
  APD: "Materials",
  SHW: "Materials",
  FCX: "Materials",
  AMT: "Real Estate",
  PLD: "Real Estate",
  CCI: "Real Estate",
  SPG: "Real Estate",
  T: "Communication",
  VZ: "Communication",
  TMUS: "Communication",
  CMCSA: "Communication",
  PLTR: "Technology",
  SQ: "Financials",
  BLOCK: "Financials",
  SHOP: "Technology",
  SNOW: "Technology",
  COIN: "Financials",
  SOFI: "Financials",
  UBER: "Industrials",
  ABNB: "Consumer Discretionary",
  SPOT: "Communication",
  RBLX: "Communication",
  U: "Technology",
  NET: "Technology",
  CRWD: "Technology",
  ZS: "Technology",
  DDOG: "Technology",
  MDB: "Technology",
  PANW: "Technology",
  RIVN: "Consumer Discretionary",
  LCID: "Consumer Discretionary",
  F: "Consumer Discretionary",
  GM: "Consumer Discretionary",
}

export function isKnownETF(ticker: string): boolean {
  return ticker.toUpperCase() in ETF_DATA
}

export function getStockSector(ticker: string): string | null {
  return STOCK_SECTORS[ticker.toUpperCase()] || null
}

export function getETFData(ticker: string): ETFSectorBreakdown | null {
  return ETF_DATA[ticker.toUpperCase()] || null
}

// Calculate effective sector exposure from a portfolio of stocks and ETFs
export function calculateEffectiveSectorExposure(
  holdings: Array<{
    ticker: string
    allocation_percent: number
    holding_type: string
    sector: string | null
  }>
): Record<string, number> {
  const sectorExposure: Record<string, number> = {}

  for (const holding of holdings) {
    const allocation = Number(holding.allocation_percent) || 0

    if (holding.holding_type === "etf") {
      const etfData = getETFData(holding.ticker)
      if (etfData) {
        // Distribute this holding's allocation across ETF's sectors
        for (const [sector, pct] of Object.entries(etfData.sectors)) {
          const effectiveAllocation = (allocation * pct) / 100
          sectorExposure[sector] = (sectorExposure[sector] || 0) + effectiveAllocation
        }
      } else {
        // Unknown ETF, put under "Other"
        sectorExposure["Other"] = (sectorExposure["Other"] || 0) + allocation
      }
    } else {
      // Individual stock
      const sector = holding.sector || getStockSector(holding.ticker) || "Other"
      sectorExposure[sector] = (sectorExposure[sector] || 0) + allocation
    }
  }

  // Round values
  for (const key of Object.keys(sectorExposure)) {
    sectorExposure[key] = Math.round(sectorExposure[key] * 100) / 100
  }

  return sectorExposure
}
