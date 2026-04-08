export interface TickerData {
  ticker: string;
  name: string;
  price: number;
  marketCap: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  dividendYield: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  beta: number | null;
  sector: string;
  industry: string;
  ret1m: number | null;
  ret3m: number | null;
  ret12m: number | null;
  realizedVol: number | null;
  maxDrawdown: number | null;
  distFrom52wHigh: number | null;
  priceHistory: { date: string; close: number }[];
  ma50: number | null;
}

const YF_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://finance.yahoo.com/",
  Origin: "https://finance.yahoo.com",
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), ms);
  return promise.finally(() => clearTimeout(timer));
}

async function safeFetch(url: string, ms = 7000): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { headers: YF_HEADERS, signal: controller.signal });
    if (res.ok) return res;
    // Try query2 as fallback if query1 fails
    if (url.includes("query1")) {
      const url2 = url.replace("query1", "query2");
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), ms);
      try {
        const res2 = await fetch(url2, { headers: YF_HEADERS, signal: ctrl2.signal });
        return res2.ok ? res2 : null;
      } catch { return null; } finally { clearTimeout(t2); }
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Batch fetch quotes for all tickers in one request
async function fetchBatchQuotes(
  tickers: string[]
): Promise<Record<string, Record<string, unknown>>> {
  const symbols = tickers.join(",");
  const fields = [
    "shortName", "longName", "regularMarketPrice", "marketCap",
    "trailingPE", "forwardPE", "trailingAnnualDividendYield",
    "fiftyTwoWeekHigh", "fiftyTwoWeekLow", "beta",
    "sector", "industry",
  ].join(",");

  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=${fields}&lang=en-US&region=US`;
  const res = await safeFetch(url, 8000);
  if (!res) return {};

  try {
    const json = await res.json();
    const quotes: unknown[] = json?.quoteResponse?.result ?? [];
    const map: Record<string, Record<string, unknown>> = {};
    for (const q of quotes) {
      const quote = q as Record<string, unknown>;
      const sym = quote.symbol as string;
      if (sym) map[sym.toUpperCase()] = quote;
    }
    return map;
  } catch {
    return {};
  }
}

// Fetch 1-year daily price history for a single ticker
async function fetchChart(ticker: string): Promise<{ date: string; close: number }[] | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y`;
  const res = await safeFetch(url, 7000);
  if (!res) return null;

  try {
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const timestamps: number[] = result.timestamp ?? [];
    const rawCloses: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    return timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split("T")[0],
        close: rawCloses[i],
      }))
      .filter((d): d is { date: string; close: number } => d.close != null && isFinite(d.close))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return null;
  }
}

function computeMetrics(closes: { date: string; close: number }[]) {
  const prices = closes.map((d) => d.close);
  const latest = prices[prices.length - 1];

  const ret1m = prices.length >= 22 ? (latest / prices[prices.length - 22] - 1) : null;
  const ret3m = prices.length >= 63 ? (latest / prices[prices.length - 63] - 1) : null;
  const ret12m = prices.length >= 20 ? (latest / prices[0] - 1) : null;

  const logRets: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    logRets.push(Math.log(prices[i] / prices[i - 1]));
  }
  const mean = logRets.reduce((a, b) => a + b, 0) / logRets.length;
  const variance = logRets.reduce((a, b) => a + (b - mean) ** 2, 0) / logRets.length;
  const realizedVol = Math.sqrt(variance * 252);

  let peak = prices[0];
  let maxDrawdown = 0;
  for (const p of prices) {
    if (p > peak) peak = p;
    const dd = (p - peak) / peak;
    if (dd < maxDrawdown) maxDrawdown = dd;
  }

  const last50 = prices.slice(-50);
  const ma50 = last50.reduce((a, b) => a + b, 0) / last50.length;

  return { ret1m, ret3m, ret12m, realizedVol, maxDrawdown, ma50, latest };
}

export async function fetchUniverse(tickers: string[]): Promise<TickerData[]> {
  // Step 1: fetch all quotes in ONE batch request
  const quotes = await fetchBatchQuotes(tickers);

  // Step 2: fetch price history for each ticker in parallel
  const chartResults = await Promise.allSettled(
    tickers.map((t) => fetchChart(t))
  );

  const results: TickerData[] = [];

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i].toUpperCase();
    const quote = quotes[ticker] ?? {};
    const chartResult = chartResults[i];
    const closes =
      chartResult.status === "fulfilled" && chartResult.value && chartResult.value.length >= 20
        ? chartResult.value
        : null;

    if (!closes) continue; // skip tickers with no price history

    const { ret1m, ret3m, ret12m, realizedVol, maxDrawdown, ma50, latest } = computeMetrics(closes);

    const price = (quote.regularMarketPrice as number | null) ?? latest;
    const high52w = (quote.fiftyTwoWeekHigh as number | null) ?? Math.max(...closes.map((c) => c.close));
    const low52w = (quote.fiftyTwoWeekLow as number | null) ?? Math.min(...closes.map((c) => c.close));
    const distFrom52wHigh = price && high52w ? price / high52w - 1 : null;

    results.push({
      ticker,
      name: ((quote.longName ?? quote.shortName ?? ticker) as string),
      price,
      marketCap: (quote.marketCap as number | null) ?? null,
      trailingPE: (quote.trailingPE as number | null) ?? null,
      forwardPE: (quote.forwardPE as number | null) ?? null,
      dividendYield: (quote.trailingAnnualDividendYield as number | null) ?? null,
      fiftyTwoWeekHigh: high52w,
      fiftyTwoWeekLow: low52w,
      beta: (quote.beta as number | null) ?? null,
      sector: (quote.sector as string | null) ?? "Unknown",
      industry: (quote.industry as string | null) ?? "Unknown",
      ret1m,
      ret3m,
      ret12m,
      realizedVol,
      maxDrawdown,
      distFrom52wHigh,
      priceHistory: closes,
      ma50,
    });
  }

  return results;
}

// Keep named export for compatibility
export type { TickerData as default };
