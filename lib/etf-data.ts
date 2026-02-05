// ETF sector breakdown data for popular ETFs (US + Canadian)
// This maps ETF tickers to their approximate sector allocations

export interface ETFSectorBreakdown {
  name: string
  description: string
  exchange?: string
  sectors: Record<string, number>
}

export const ETF_DATA: Record<string, ETFSectorBreakdown> = {
  // === US ETFs ===
  SPY: {
    name: "SPDR S&P 500 ETF",
    description: "Tracks the S&P 500 Index",
    exchange: "NYSE",
    sectors: { Technology: 31, Financials: 13, Healthcare: 12, "Consumer Discretionary": 10, Communication: 9, Industrials: 8, "Consumer Staples": 6, Energy: 4, Materials: 3, "Real Estate": 2, Utilities: 2 },
  },
  QQQ: {
    name: "Invesco QQQ Trust",
    description: "Tracks the Nasdaq-100 Index",
    exchange: "NASDAQ",
    sectors: { Technology: 58, Communication: 16, "Consumer Discretionary": 13, Healthcare: 7, "Consumer Staples": 3, Industrials: 2, Utilities: 1 },
  },
  VOO: {
    name: "Vanguard S&P 500 ETF",
    description: "Tracks the S&P 500 Index",
    exchange: "NYSE",
    sectors: { Technology: 31, Financials: 13, Healthcare: 12, "Consumer Discretionary": 10, Communication: 9, Industrials: 8, "Consumer Staples": 6, Energy: 4, Materials: 3, "Real Estate": 2, Utilities: 2 },
  },
  VTI: {
    name: "Vanguard Total Stock Market ETF",
    description: "Tracks the CRSP US Total Market Index",
    exchange: "NYSE",
    sectors: { Technology: 30, Financials: 13, Healthcare: 13, "Consumer Discretionary": 10, Industrials: 9, Communication: 8, "Consumer Staples": 5, Energy: 4, Utilities: 3, "Real Estate": 3, Materials: 2 },
  },
  IWM: {
    name: "iShares Russell 2000 ETF",
    description: "Tracks the Russell 2000 small-cap index",
    exchange: "NYSE",
    sectors: { Healthcare: 17, Financials: 16, Industrials: 16, Technology: 14, "Consumer Discretionary": 10, Energy: 7, "Real Estate": 6, Communication: 4, Materials: 4, "Consumer Staples": 3, Utilities: 3 },
  },
  DIA: {
    name: "SPDR Dow Jones Industrial Average ETF",
    description: "Tracks the Dow Jones Industrial Average",
    exchange: "NYSE",
    sectors: { Financials: 18, Technology: 17, Healthcare: 16, Industrials: 14, "Consumer Discretionary": 13, "Consumer Staples": 7, Communication: 5, Energy: 4, Materials: 3, Utilities: 3 },
  },
  ARKK: {
    name: "ARK Innovation ETF",
    description: "Actively managed innovation-focused ETF",
    exchange: "NYSE",
    sectors: { Technology: 42, Healthcare: 28, Communication: 14, "Consumer Discretionary": 10, Industrials: 4, Financials: 2 },
  },
  XLK: { name: "Technology Select Sector SPDR", description: "S&P 500 Technology sector", exchange: "NYSE", sectors: { Technology: 100 } },
  XLF: { name: "Financial Select Sector SPDR", description: "S&P 500 Financial sector", exchange: "NYSE", sectors: { Financials: 100 } },
  XLE: { name: "Energy Select Sector SPDR", description: "S&P 500 Energy sector", exchange: "NYSE", sectors: { Energy: 100 } },
  XLV: { name: "Health Care Select Sector SPDR", description: "S&P 500 Healthcare sector", exchange: "NYSE", sectors: { Healthcare: 100 } },
  XLI: { name: "Industrial Select Sector SPDR", description: "S&P 500 Industrial sector", exchange: "NYSE", sectors: { Industrials: 100 } },
  XLP: { name: "Consumer Staples Select Sector SPDR", description: "S&P 500 Consumer Staples sector", exchange: "NYSE", sectors: { "Consumer Staples": 100 } },
  XLY: { name: "Consumer Discretionary Select Sector SPDR", description: "S&P 500 Consumer Discretionary sector", exchange: "NYSE", sectors: { "Consumer Discretionary": 100 } },
  VGT: { name: "Vanguard Information Technology ETF", description: "MSCI US Investable Market IT Index", exchange: "NYSE", sectors: { Technology: 100 } },
  SCHD: {
    name: "Schwab U.S. Dividend Equity ETF",
    description: "High-dividend yielding US stocks",
    exchange: "NYSE",
    sectors: { Financials: 18, Healthcare: 16, "Consumer Staples": 14, Industrials: 14, Technology: 12, Energy: 10, Communication: 6, "Consumer Discretionary": 5, Materials: 3, Utilities: 2 },
  },
  VUG: {
    name: "Vanguard Growth ETF",
    description: "CRSP US Large Cap Growth Index",
    exchange: "NYSE",
    sectors: { Technology: 45, "Consumer Discretionary": 16, Communication: 12, Healthcare: 10, Industrials: 8, Financials: 5, "Consumer Staples": 2, "Real Estate": 1, Materials: 1 },
  },
  VTV: {
    name: "Vanguard Value ETF",
    description: "CRSP US Large Cap Value Index",
    exchange: "NYSE",
    sectors: { Financials: 21, Healthcare: 17, Industrials: 13, "Consumer Staples": 10, Energy: 8, Technology: 8, Utilities: 7, Communication: 6, "Consumer Discretionary": 5, "Real Estate": 3, Materials: 2 },
  },
  EEM: {
    name: "iShares MSCI Emerging Markets ETF",
    description: "Tracks emerging markets equities",
    exchange: "NYSE",
    sectors: { Technology: 22, Financials: 21, "Consumer Discretionary": 13, Communication: 10, Materials: 8, Energy: 6, Industrials: 6, "Consumer Staples": 5, Healthcare: 4, Utilities: 3, "Real Estate": 2 },
  },
  VXUS: {
    name: "Vanguard Total International Stock ETF",
    description: "FTSE Global All Cap ex US Index",
    exchange: "NYSE",
    sectors: { Financials: 20, Technology: 14, Industrials: 14, Healthcare: 10, "Consumer Discretionary": 11, "Consumer Staples": 7, Communication: 6, Materials: 7, Energy: 5, Utilities: 3, "Real Estate": 3 },
  },

  // === Canadian ETFs ===
  "XIU.TO": {
    name: "iShares S&P/TSX 60 Index ETF",
    description: "Tracks the S&P/TSX 60 Index - top 60 Canadian stocks",
    exchange: "TSX",
    sectors: { Financials: 35, Energy: 17, Technology: 11, Industrials: 10, Materials: 10, Communication: 5, Utilities: 5, "Consumer Staples": 3, "Consumer Discretionary": 2, Healthcare: 1, "Real Estate": 1 },
  },
  "XIC.TO": {
    name: "iShares Core S&P/TSX Capped Composite ETF",
    description: "Broad Canadian equity exposure",
    exchange: "TSX",
    sectors: { Financials: 33, Energy: 17, Industrials: 11, Materials: 10, Technology: 10, Communication: 5, Utilities: 4, "Consumer Staples": 3, "Consumer Discretionary": 3, "Real Estate": 2, Healthcare: 2 },
  },
  "VCN.TO": {
    name: "Vanguard FTSE Canada All Cap Index ETF",
    description: "All-cap Canadian equity exposure",
    exchange: "TSX",
    sectors: { Financials: 34, Energy: 16, Industrials: 11, Materials: 10, Technology: 10, Communication: 5, Utilities: 4, "Consumer Staples": 3, "Consumer Discretionary": 3, "Real Estate": 2, Healthcare: 2 },
  },
  "ZSP.TO": {
    name: "BMO S&P 500 Index ETF",
    description: "CAD-hedged S&P 500 exposure",
    exchange: "TSX",
    sectors: { Technology: 31, Financials: 13, Healthcare: 12, "Consumer Discretionary": 10, Communication: 9, Industrials: 8, "Consumer Staples": 6, Energy: 4, Materials: 3, "Real Estate": 2, Utilities: 2 },
  },
  "XQQ.TO": {
    name: "iShares NASDAQ 100 Index ETF (CAD-Hedged)",
    description: "CAD-hedged Nasdaq-100 exposure",
    exchange: "TSX",
    sectors: { Technology: 58, Communication: 16, "Consumer Discretionary": 13, Healthcare: 7, "Consumer Staples": 3, Industrials: 2, Utilities: 1 },
  },
  "XEQT.TO": {
    name: "iShares Core Equity ETF Portfolio",
    description: "All-in-one global equity allocation",
    exchange: "TSX",
    sectors: { Technology: 22, Financials: 17, Industrials: 11, Healthcare: 10, "Consumer Discretionary": 10, Communication: 7, "Consumer Staples": 5, Energy: 6, Materials: 5, Utilities: 3, "Real Estate": 4 },
  },
  "VEQT.TO": {
    name: "Vanguard All-Equity ETF Portfolio",
    description: "All-in-one global equity portfolio",
    exchange: "TSX",
    sectors: { Technology: 22, Financials: 17, Industrials: 11, Healthcare: 10, "Consumer Discretionary": 10, Communication: 7, "Consumer Staples": 5, Energy: 6, Materials: 5, Utilities: 3, "Real Estate": 4 },
  },
  "VGRO.TO": {
    name: "Vanguard Growth ETF Portfolio",
    description: "80% equity / 20% bond global allocation",
    exchange: "TSX",
    sectors: { Technology: 18, Financials: 14, Industrials: 9, Healthcare: 8, "Consumer Discretionary": 8, Communication: 6, "Consumer Staples": 4, Energy: 5, Materials: 4, Utilities: 2, "Real Estate": 3, "Fixed Income": 19 },
  },
  "VBAL.TO": {
    name: "Vanguard Balanced ETF Portfolio",
    description: "60% equity / 40% bond global allocation",
    exchange: "TSX",
    sectors: { Technology: 13, Financials: 10, Industrials: 7, Healthcare: 6, "Consumer Discretionary": 6, Communication: 4, "Consumer Staples": 3, Energy: 4, Materials: 3, Utilities: 2, "Real Estate": 2, "Fixed Income": 40 },
  },
  "ZEB.TO": {
    name: "BMO Equal Weight Banks Index ETF",
    description: "Equal-weight Canadian Big 6 banks",
    exchange: "TSX",
    sectors: { Financials: 100 },
  },
  "XEG.TO": {
    name: "iShares S&P/TSX Capped Energy Index ETF",
    description: "Canadian energy sector",
    exchange: "TSX",
    sectors: { Energy: 100 },
  },
  "XFN.TO": {
    name: "iShares S&P/TSX Capped Financials Index ETF",
    description: "Canadian financial sector",
    exchange: "TSX",
    sectors: { Financials: 100 },
  },
  "XIT.TO": {
    name: "iShares S&P/TSX Capped Information Technology ETF",
    description: "Canadian technology sector",
    exchange: "TSX",
    sectors: { Technology: 100 },
  },
  "XGD.TO": {
    name: "iShares S&P/TSX Global Gold Index ETF",
    description: "Global gold mining companies",
    exchange: "TSX",
    sectors: { Materials: 100 },
  },
}

// Stock sector mapping for common stocks (US + Canadian)
export const STOCK_SECTORS: Record<string, { sector: string; name: string; exchange: string }> = {
  // === US Mega-cap + Large-cap ===
  AAPL: { sector: "Technology", name: "Apple Inc.", exchange: "NASDAQ" },
  MSFT: { sector: "Technology", name: "Microsoft Corp.", exchange: "NASDAQ" },
  GOOGL: { sector: "Technology", name: "Alphabet Inc. (Class A)", exchange: "NASDAQ" },
  GOOG: { sector: "Technology", name: "Alphabet Inc. (Class C)", exchange: "NASDAQ" },
  AMZN: { sector: "Consumer Discretionary", name: "Amazon.com Inc.", exchange: "NASDAQ" },
  NVDA: { sector: "Technology", name: "NVIDIA Corp.", exchange: "NASDAQ" },
  META: { sector: "Communication", name: "Meta Platforms Inc.", exchange: "NASDAQ" },
  TSLA: { sector: "Consumer Discretionary", name: "Tesla Inc.", exchange: "NASDAQ" },
  "BRK.B": { sector: "Financials", name: "Berkshire Hathaway (B)", exchange: "NYSE" },
  UNH: { sector: "Healthcare", name: "UnitedHealth Group", exchange: "NYSE" },
  JNJ: { sector: "Healthcare", name: "Johnson & Johnson", exchange: "NYSE" },
  JPM: { sector: "Financials", name: "JPMorgan Chase", exchange: "NYSE" },
  V: { sector: "Financials", name: "Visa Inc.", exchange: "NYSE" },
  PG: { sector: "Consumer Staples", name: "Procter & Gamble", exchange: "NYSE" },
  HD: { sector: "Consumer Discretionary", name: "Home Depot", exchange: "NYSE" },
  MA: { sector: "Financials", name: "Mastercard", exchange: "NYSE" },
  XOM: { sector: "Energy", name: "Exxon Mobil", exchange: "NYSE" },
  CVX: { sector: "Energy", name: "Chevron Corp.", exchange: "NYSE" },
  LLY: { sector: "Healthcare", name: "Eli Lilly", exchange: "NYSE" },
  ABBV: { sector: "Healthcare", name: "AbbVie Inc.", exchange: "NYSE" },
  MRK: { sector: "Healthcare", name: "Merck & Co.", exchange: "NYSE" },
  PFE: { sector: "Healthcare", name: "Pfizer Inc.", exchange: "NYSE" },
  KO: { sector: "Consumer Staples", name: "Coca-Cola Co.", exchange: "NYSE" },
  PEP: { sector: "Consumer Staples", name: "PepsiCo Inc.", exchange: "NASDAQ" },
  AVGO: { sector: "Technology", name: "Broadcom Inc.", exchange: "NASDAQ" },
  COST: { sector: "Consumer Staples", name: "Costco Wholesale", exchange: "NASDAQ" },
  TMO: { sector: "Healthcare", name: "Thermo Fisher Scientific", exchange: "NYSE" },
  WMT: { sector: "Consumer Staples", name: "Walmart Inc.", exchange: "NYSE" },
  CSCO: { sector: "Technology", name: "Cisco Systems", exchange: "NASDAQ" },
  CRM: { sector: "Technology", name: "Salesforce Inc.", exchange: "NYSE" },
  ABT: { sector: "Healthcare", name: "Abbott Laboratories", exchange: "NYSE" },
  ACN: { sector: "Technology", name: "Accenture plc", exchange: "NYSE" },
  MCD: { sector: "Consumer Discretionary", name: "McDonald's Corp.", exchange: "NYSE" },
  NFLX: { sector: "Communication", name: "Netflix Inc.", exchange: "NASDAQ" },
  AMD: { sector: "Technology", name: "Advanced Micro Devices", exchange: "NASDAQ" },
  INTC: { sector: "Technology", name: "Intel Corp.", exchange: "NASDAQ" },
  ADBE: { sector: "Technology", name: "Adobe Inc.", exchange: "NASDAQ" },
  DIS: { sector: "Communication", name: "Walt Disney Co.", exchange: "NYSE" },
  NKE: { sector: "Consumer Discretionary", name: "Nike Inc.", exchange: "NYSE" },
  PYPL: { sector: "Financials", name: "PayPal Holdings", exchange: "NASDAQ" },
  BA: { sector: "Industrials", name: "Boeing Co.", exchange: "NYSE" },
  CAT: { sector: "Industrials", name: "Caterpillar Inc.", exchange: "NYSE" },
  GE: { sector: "Industrials", name: "GE Aerospace", exchange: "NYSE" },
  RTX: { sector: "Industrials", name: "RTX Corp.", exchange: "NYSE" },
  UNP: { sector: "Industrials", name: "Union Pacific", exchange: "NYSE" },
  HON: { sector: "Industrials", name: "Honeywell", exchange: "NASDAQ" },
  GS: { sector: "Financials", name: "Goldman Sachs", exchange: "NYSE" },
  MS: { sector: "Financials", name: "Morgan Stanley", exchange: "NYSE" },
  BLK: { sector: "Financials", name: "BlackRock Inc.", exchange: "NYSE" },
  C: { sector: "Financials", name: "Citigroup Inc.", exchange: "NYSE" },
  BAC: { sector: "Financials", name: "Bank of America", exchange: "NYSE" },
  WFC: { sector: "Financials", name: "Wells Fargo", exchange: "NYSE" },
  SCHW: { sector: "Financials", name: "Charles Schwab", exchange: "NYSE" },
  NEE: { sector: "Utilities", name: "NextEra Energy", exchange: "NYSE" },
  DUK: { sector: "Utilities", name: "Duke Energy", exchange: "NYSE" },
  SO: { sector: "Utilities", name: "Southern Company", exchange: "NYSE" },
  COP: { sector: "Energy", name: "ConocoPhillips", exchange: "NYSE" },
  SLB: { sector: "Energy", name: "SLB (Schlumberger)", exchange: "NYSE" },
  EOG: { sector: "Energy", name: "EOG Resources", exchange: "NYSE" },
  LIN: { sector: "Materials", name: "Linde plc", exchange: "NYSE" },
  APD: { sector: "Materials", name: "Air Products", exchange: "NYSE" },
  SHW: { sector: "Materials", name: "Sherwin-Williams", exchange: "NYSE" },
  FCX: { sector: "Materials", name: "Freeport-McMoRan", exchange: "NYSE" },
  AMT: { sector: "Real Estate", name: "American Tower", exchange: "NYSE" },
  PLD: { sector: "Real Estate", name: "Prologis Inc.", exchange: "NYSE" },
  CCI: { sector: "Real Estate", name: "Crown Castle", exchange: "NYSE" },
  SPG: { sector: "Real Estate", name: "Simon Property Group", exchange: "NYSE" },
  T: { sector: "Communication", name: "AT&T Inc.", exchange: "NYSE" },
  VZ: { sector: "Communication", name: "Verizon Communications", exchange: "NYSE" },
  TMUS: { sector: "Communication", name: "T-Mobile US", exchange: "NASDAQ" },
  CMCSA: { sector: "Communication", name: "Comcast Corp.", exchange: "NASDAQ" },
  PLTR: { sector: "Technology", name: "Palantir Technologies", exchange: "NYSE" },
  SQ: { sector: "Financials", name: "Block Inc.", exchange: "NYSE" },
  SHOP: { sector: "Technology", name: "Shopify Inc.", exchange: "NYSE" },
  SNOW: { sector: "Technology", name: "Snowflake Inc.", exchange: "NYSE" },
  COIN: { sector: "Financials", name: "Coinbase Global", exchange: "NASDAQ" },
  SOFI: { sector: "Financials", name: "SoFi Technologies", exchange: "NASDAQ" },
  UBER: { sector: "Industrials", name: "Uber Technologies", exchange: "NYSE" },
  ABNB: { sector: "Consumer Discretionary", name: "Airbnb Inc.", exchange: "NASDAQ" },
  SPOT: { sector: "Communication", name: "Spotify Technology", exchange: "NYSE" },
  NET: { sector: "Technology", name: "Cloudflare Inc.", exchange: "NYSE" },
  CRWD: { sector: "Technology", name: "CrowdStrike Holdings", exchange: "NASDAQ" },
  ZS: { sector: "Technology", name: "Zscaler Inc.", exchange: "NASDAQ" },
  DDOG: { sector: "Technology", name: "Datadog Inc.", exchange: "NASDAQ" },
  MDB: { sector: "Technology", name: "MongoDB Inc.", exchange: "NASDAQ" },
  PANW: { sector: "Technology", name: "Palo Alto Networks", exchange: "NASDAQ" },
  RIVN: { sector: "Consumer Discretionary", name: "Rivian Automotive", exchange: "NASDAQ" },
  F: { sector: "Consumer Discretionary", name: "Ford Motor Co.", exchange: "NYSE" },
  GM: { sector: "Consumer Discretionary", name: "General Motors", exchange: "NYSE" },

  // === Canadian TSX Stocks ===
  "RY.TO": { sector: "Financials", name: "Royal Bank of Canada", exchange: "TSX" },
  "TD.TO": { sector: "Financials", name: "Toronto-Dominion Bank", exchange: "TSX" },
  "BNS.TO": { sector: "Financials", name: "Bank of Nova Scotia", exchange: "TSX" },
  "BMO.TO": { sector: "Financials", name: "Bank of Montreal", exchange: "TSX" },
  "CM.TO": { sector: "Financials", name: "Canadian Imperial Bank of Commerce", exchange: "TSX" },
  "NA.TO": { sector: "Financials", name: "National Bank of Canada", exchange: "TSX" },
  "MFC.TO": { sector: "Financials", name: "Manulife Financial", exchange: "TSX" },
  "SLF.TO": { sector: "Financials", name: "Sun Life Financial", exchange: "TSX" },
  "GWO.TO": { sector: "Financials", name: "Great-West Lifeco", exchange: "TSX" },
  "POW.TO": { sector: "Financials", name: "Power Corp. of Canada", exchange: "TSX" },
  "ENB.TO": { sector: "Energy", name: "Enbridge Inc.", exchange: "TSX" },
  "TRP.TO": { sector: "Energy", name: "TC Energy Corp.", exchange: "TSX" },
  "CNQ.TO": { sector: "Energy", name: "Canadian Natural Resources", exchange: "TSX" },
  "SU.TO": { sector: "Energy", name: "Suncor Energy", exchange: "TSX" },
  "CVE.TO": { sector: "Energy", name: "Cenovus Energy", exchange: "TSX" },
  "IMO.TO": { sector: "Energy", name: "Imperial Oil", exchange: "TSX" },
  "PPL.TO": { sector: "Energy", name: "Pembina Pipeline", exchange: "TSX" },
  "ARX.TO": { sector: "Energy", name: "ARC Resources", exchange: "TSX" },
  "TOU.TO": { sector: "Energy", name: "Tourmaline Oil", exchange: "TSX" },
  "CP.TO": { sector: "Industrials", name: "Canadian Pacific Kansas City", exchange: "TSX" },
  "CNR.TO": { sector: "Industrials", name: "Canadian National Railway", exchange: "TSX" },
  "WCN.TO": { sector: "Industrials", name: "Waste Connections", exchange: "TSX" },
  "CAE.TO": { sector: "Industrials", name: "CAE Inc.", exchange: "TSX" },
  "TFII.TO": { sector: "Industrials", name: "TFI International", exchange: "TSX" },
  "SHOP.TO": { sector: "Technology", name: "Shopify Inc.", exchange: "TSX" },
  "CSU.TO": { sector: "Technology", name: "Constellation Software", exchange: "TSX" },
  "OTEX.TO": { sector: "Technology", name: "Open Text Corp.", exchange: "TSX" },
  "LSPD.TO": { sector: "Technology", name: "Lightspeed Commerce", exchange: "TSX" },
  "BB.TO": { sector: "Technology", name: "BlackBerry Ltd.", exchange: "TSX" },
  "REAL.TO": { sector: "Technology", name: "Real Matters Inc.", exchange: "TSX" },
  "ABX.TO": { sector: "Materials", name: "Barrick Gold Corp.", exchange: "TSX" },
  "NTR.TO": { sector: "Materials", name: "Nutrien Ltd.", exchange: "TSX" },
  "FNV.TO": { sector: "Materials", name: "Franco-Nevada Corp.", exchange: "TSX" },
  "WPM.TO": { sector: "Materials", name: "Wheaton Precious Metals", exchange: "TSX" },
  "AEM.TO": { sector: "Materials", name: "Agnico Eagle Mines", exchange: "TSX" },
  "K.TO": { sector: "Materials", name: "Kinross Gold Corp.", exchange: "TSX" },
  "FM.TO": { sector: "Materials", name: "First Quantum Minerals", exchange: "TSX" },
  "CCL-B.TO": { sector: "Materials", name: "CCL Industries", exchange: "TSX" },
  "T.TO": { sector: "Communication", name: "TELUS Corp.", exchange: "TSX" },
  "BCE.TO": { sector: "Communication", name: "BCE Inc.", exchange: "TSX" },
  "RCI-B.TO": { sector: "Communication", name: "Rogers Communications", exchange: "TSX" },
  "QBR-B.TO": { sector: "Communication", name: "Quebecor Inc.", exchange: "TSX" },
  "FTS.TO": { sector: "Utilities", name: "Fortis Inc.", exchange: "TSX" },
  "EMA.TO": { sector: "Utilities", name: "Emera Inc.", exchange: "TSX" },
  "AQN.TO": { sector: "Utilities", name: "Algonquin Power & Utilities", exchange: "TSX" },
  "H.TO": { sector: "Utilities", name: "Hydro One Ltd.", exchange: "TSX" },
  "ATD.TO": { sector: "Consumer Staples", name: "Alimentation Couche-Tard", exchange: "TSX" },
  "L.TO": { sector: "Consumer Staples", name: "Loblaw Companies", exchange: "TSX" },
  "MRU.TO": { sector: "Consumer Staples", name: "Metro Inc.", exchange: "TSX" },
  "SAP.TO": { sector: "Consumer Staples", name: "Saputo Inc.", exchange: "TSX" },
  "DOL.TO": { sector: "Consumer Discretionary", name: "Dollarama Inc.", exchange: "TSX" },
  "QSR.TO": { sector: "Consumer Discretionary", name: "Restaurant Brands International", exchange: "TSX" },
  "GOOS.TO": { sector: "Consumer Discretionary", name: "Canada Goose Holdings", exchange: "TSX" },
  "AC.TO": { sector: "Industrials", name: "Air Canada", exchange: "TSX" },
  "WSP.TO": { sector: "Industrials", name: "WSP Global Inc.", exchange: "TSX" },
  "BAM.TO": { sector: "Financials", name: "Brookfield Asset Management", exchange: "TSX" },
  "BN.TO": { sector: "Financials", name: "Brookfield Corp.", exchange: "TSX" },
  "IFC.TO": { sector: "Financials", name: "Intact Financial Corp.", exchange: "TSX" },
  "REI-UN.TO": { sector: "Real Estate", name: "RioCan REIT", exchange: "TSX" },
  "HR-UN.TO": { sector: "Real Estate", name: "H&R REIT", exchange: "TSX" },
  "AP-UN.TO": { sector: "Real Estate", name: "Allied Properties REIT", exchange: "TSX" },
  "WEED.TO": { sector: "Healthcare", name: "Canopy Growth Corp.", exchange: "TSX" },
  "TLRY.TO": { sector: "Healthcare", name: "Tilray Brands", exchange: "TSX" },
}

export function isKnownETF(ticker: string): boolean {
  return ticker.toUpperCase() in ETF_DATA
}

export function getStockSector(ticker: string): string | null {
  return STOCK_SECTORS[ticker.toUpperCase()]?.sector || null
}

export function getStockInfo(ticker: string): { sector: string; name: string; exchange: string } | null {
  return STOCK_SECTORS[ticker.toUpperCase()] || null
}

export function getETFData(ticker: string): ETFSectorBreakdown | null {
  return ETF_DATA[ticker.toUpperCase()] || null
}

export function getExchange(ticker: string): string {
  const stock = STOCK_SECTORS[ticker.toUpperCase()]
  if (stock) return stock.exchange
  const etf = ETF_DATA[ticker.toUpperCase()]
  if (etf) return etf.exchange || "US"
  if (ticker.toUpperCase().endsWith(".TO")) return "TSX"
  return "US"
}

// Build a unified ticker list for search
export function getAllTickers(): Array<{ ticker: string; name: string; type: "stock" | "etf"; sector: string | null; exchange: string }> {
  const etfs = Object.entries(ETF_DATA).map(([ticker, data]) => ({
    ticker,
    name: data.name,
    type: "etf" as const,
    sector: null as string | null,
    exchange: data.exchange || "US",
  }))
  const stocks = Object.entries(STOCK_SECTORS).map(([ticker, info]) => ({
    ticker,
    name: info.name,
    type: "stock" as const,
    sector: info.sector,
    exchange: info.exchange,
  }))
  return [...etfs, ...stocks]
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
        for (const [sector, pct] of Object.entries(etfData.sectors)) {
          const effectiveAllocation = (allocation * pct) / 100
          sectorExposure[sector] = (sectorExposure[sector] || 0) + effectiveAllocation
        }
      } else {
        sectorExposure["Other"] = (sectorExposure["Other"] || 0) + allocation
      }
    } else {
      const sector = holding.sector || getStockSector(holding.ticker) || "Other"
      sectorExposure[sector] = (sectorExposure[sector] || 0) + allocation
    }
  }

  for (const key of Object.keys(sectorExposure)) {
    sectorExposure[key] = Math.round(sectorExposure[key] * 100) / 100
  }

  return sectorExposure
}
