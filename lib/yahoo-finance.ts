// eslint-disable-next-line @typescript-eslint/no-require-imports
const yahooFinance = require("yahoo-finance2").default;

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

export async function fetchTickerData(ticker: string): Promise<TickerData | null> {
  try {
    const [quote, history] = await Promise.all([
      yahooFinance.quote(ticker, {}, { validateResult: false }),
      yahooFinance.historical(ticker, {
        period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        period2: new Date(),
        interval: "1d",
      }, { validateResult: false }),
    ]);

    if (!quote || !history || history.length < 20) return null;

    const closes = (history as { date: Date; close: number | null }[])
      .filter((d) => d.close != null)
      .map((d) => ({ date: (d.date as Date).toISOString().split("T")[0], close: d.close as number }))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (closes.length < 20) return null;

    const prices = closes.map((d) => d.close);
    const latest = prices[prices.length - 1];

    // Returns
    const ret1m = prices.length >= 22 ? (latest / prices[prices.length - 22] - 1) : null;
    const ret3m = prices.length >= 63 ? (latest / prices[prices.length - 63] - 1) : null;
    const ret12m = prices.length >= 252 ? (latest / prices[0] - 1) : prices.length >= 20 ? (latest / prices[0] - 1) : null;

    // Annualised realised vol (log returns)
    const logRets: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      logRets.push(Math.log(prices[i] / prices[i - 1]));
    }
    const mean = logRets.reduce((a: number, b: number) => a + b, 0) / logRets.length;
    const variance = logRets.reduce((a: number, b: number) => a + (b - mean) ** 2, 0) / logRets.length;
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

    const high52w = (quote.fiftyTwoWeekHigh as number | null) ?? Math.max(...prices);
    const low52w = (quote.fiftyTwoWeekLow as number | null) ?? Math.min(...prices);
    const distFrom52wHigh = latest && high52w ? latest / high52w - 1 : null;

    return {
      ticker: ticker.toUpperCase(),
      name: (quote.longName ?? quote.shortName ?? ticker) as string,
      price: (quote.regularMarketPrice ?? quote.currentPrice ?? latest) as number,
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
