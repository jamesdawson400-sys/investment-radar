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
  // computed from history
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
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

async function fetchYahooChart(ticker: string): Promise<{
  meta: Record<string, unknown>;
  closes: { date: string; close: number }[];
} | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y`;
  const res = await fetch(url, { headers: YF_HEADERS });
  if (!res.ok) return null;

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) return null;

  const timestamps: number[] = result.timestamp ?? [];
  const rawCloses: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

  const closes = timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split("T")[0],
      close: rawCloses[i],
    }))
    .filter((d): d is { date: string; close: number } => d.close != null && isFinite(d.close))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { meta: result.meta as Record<string, unknown>, closes };
}

async function fetchYahooQuoteSummary(ticker: string): Promise<Record<string, unknown> | null> {
  const modules = "assetProfile,summaryDetail,defaultKeyStatistics,financialData,price";
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`;
  const res = await fetch(url, { headers: YF_HEADERS });
  if (!res.ok) return null;

  const json = await res.json();
  const result = json?.quoteSummary?.result?.[0];
  return result ?? null;
}

export async function fetchTickerData(ticker: string): Promise<TickerData | null> {
  try {
    const [chartData, summary] = await Promise.all([
      fetchYahooChart(ticker),
      fetchYahooQuoteSummary(ticker),
    ]);

    if (!chartData || chartData.closes.length < 20) return null;

    const { meta, closes } = chartData;
    const prices = closes.map((d) => d.close);
    const latest = prices[prices.length - 1];

    // Returns
    const ret1m = prices.length >= 22 ? (latest / prices[prices.length - 22] - 1) : null;
    const ret3m = prices.length >= 63 ? (latest / prices[prices.length - 63] - 1) : null;
    const ret12m = prices.length >= 20 ? (latest / prices[0] - 1) : null;

    // Annualised realised vol (log returns)
    const logRets: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      logRets.push(Math.log(prices[i] / prices[i - 1]));
    }
    const mean = logRets.reduce((a, b) => a + b, 0) / logRets.length;
    const variance = logRets.reduce((a, b) => a + (b - mean) ** 2, 0) / logRets.length;
    const realizedVol = Math.sqrt(variance * 252);

    // Max drawdown
    let peak = prices[0];
    let maxDrawdown = 0;
    for (const p of prices) {
      if (p > peak) peak = p;
      const dd = (p - peak) / peak;
      if (dd < maxDrawdown) maxDrawdown = dd;
    }

    // 50-day MA
    const last50 = prices.slice(-50);
    const ma50 = last50.reduce((a, b) => a + b, 0) / last50.length;

    // Meta / summary fields
    const price = (meta.regularMarketPrice as number | null) ?? latest;
    const high52w = (meta.fiftyTwoWeekHigh as number | null) ?? Math.max(...prices);
    const low52w = (meta.fiftyTwoWeekLow as number | null) ?? Math.min(...prices);
    const distFrom52wHigh = price && high52w ? price / high52w - 1 : null;

    const sd = summary?.summaryDetail as Record<string, { raw?: number }> | undefined;
    const ks = summary?.defaultKeyStatistics as Record<string, { raw?: number }> | undefined;
    const ap = summary?.assetProfile as Record<string, string> | undefined;
    const pr = summary?.price as Record<string, { raw?: number } | string | number> | undefined;

    const g = <T>(obj: Record<string, { raw?: T }> | undefined, key: string): T | null =>
      (obj?.[key]?.raw as T | undefined) ?? null;

    return {
      ticker: ticker.toUpperCase(),
      name: (meta.longName ?? meta.shortName ?? ticker) as string,
      price,
      marketCap: g(pr as Record<string, { raw?: number }>, "marketCap"),
      trailingPE: g(sd, "trailingPE"),
      forwardPE: g(ks, "forwardPE"),
      dividendYield: g(sd, "dividendYield"),
      fiftyTwoWeekHigh: high52w,
      fiftyTwoWeekLow: low52w,
      beta: g(sd, "beta"),
      sector: ap?.sector ?? "Unknown",
      industry: ap?.industry ?? "Unknown",
      ret1m,
      ret3m,
      ret12m,
      realizedVol,
      maxDrawdown,
      distFrom52wHigh,
      priceHistory: closes,
      ma50,
    };
  } catch {
    return null;
  }
}

export async function fetchUniverse(tickers: string[]): Promise<TickerData[]> {
  const results = await Promise.allSettled(tickers.map(fetchTickerData));
  return results
    .filter((r): r is PromiseFulfilledResult<TickerData> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);
}
