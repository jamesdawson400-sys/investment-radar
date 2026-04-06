import type { TickerData } from "./yahoo-finance";

export interface ScoredTicker extends TickerData {
  score: number;
  momentumScore: number;
  qualityScore: number;
  valuationScore: number;
  trendScore: number;
  rationale: string;
  riskFlags: string[];
  volAdjReturn: number | null;
}

// --- Percentile rank helper ---
function percentileRank(values: number[], ascending = true): number[] {
  const n = values.length;
  if (n === 0) return [];
  const sorted = [...values].sort((a, b) => (ascending ? a - b : b - a));
  return values.map((v) => {
    const rank = sorted.filter((s) => s < v).length;
    return n === 1 ? 50 : (rank / (n - 1)) * 100;
  });
}

// --- PE → valuation score ---
function peToValuation(pe: number | null): number {
  if (pe === null || pe <= 0) return 50;
  if (pe < 10) return 100;
  if (pe < 15) return 85;
  if (pe < 20) return 70;
  if (pe < 30) return 55;
  if (pe < 50) return 35;
  if (pe < 80) return 15;
  return 5;
}

// --- Trend: distance from 52w high → score ---
function distToTrend(dist: number | null): number {
  if (dist === null) return 50;
  const d = Math.abs(dist); // dist is negative (below high)
  if (d <= 0.0) return 95;
  if (d <= 0.05) return 88;
  if (d <= 0.10) return 80;
  if (d <= 0.15) return 70;
  if (d <= 0.20) return 58;
  if (d <= 0.30) return 42;
  return 25;
}

// --- Build rationale ---
function buildRationale(t: TickerData, scores: { momentum: number; quality: number; valuation: number; trend: number }): string {
  const parts: string[] = [];
  if (t.ret12m !== null) {
    parts.push(`${t.ticker} has delivered ${(t.ret12m * 100).toFixed(1)}% over the past 12 months`);
  }
  if (scores.momentum >= 70) parts.push("showing strong price momentum");
  else if (scores.momentum < 40) parts.push("lagging on price momentum");

  if (t.realizedVol !== null) {
    parts.push(`with ${(t.realizedVol * 100).toFixed(1)}% annualised volatility`);
  }
  if (scores.valuation >= 70) parts.push("trading at an attractive valuation");
  else if (scores.valuation < 30) parts.push("at a stretched valuation");

  if (t.distFrom52wHigh !== null && Math.abs(t.distFrom52wHigh) < 0.1) {
    parts.push("near its 52-week high");
  }
  return parts.length ? parts.join(", ") + "." : "Insufficient data for rationale.";
}

// --- Build risk flags ---
function buildRiskFlags(t: TickerData, scores: { momentum: number; quality: number; valuation: number; trend: number }): string[] {
  const flags: string[] = [];
  if (scores.valuation < 30) flags.push("High valuation");
  if (t.realizedVol !== null && t.realizedVol > 0.4) flags.push("Elevated volatility");
  if (t.maxDrawdown !== null && t.maxDrawdown < -0.3) flags.push("Deep drawdown risk");
  if (t.beta !== null && t.beta > 1.5) flags.push("High beta");
  if (scores.momentum < 35 && scores.trend < 40) flags.push("Momentum divergence");
  if (t.trailingPE === null && t.forwardPE === null) flags.push("No P/E data");
  return flags;
}

// --- Main scoring function ---
export function scoreUniverse(universe: TickerData[]): ScoredTicker[] {
  const n = universe.length;
  if (n === 0) return [];

  // --- Momentum sub-scores (percentile-ranked) ---
  const ret12ms = universe.map((t) => t.ret12m ?? 0);
  const ret3ms = universe.map((t) => t.ret3m ?? 0);
  const ret1ms = universe.map((t) => t.ret1m ?? 0);

  const pct12m = percentileRank(ret12ms);
  const pct3m = percentileRank(ret3ms);
  const pct1m = percentileRank(ret1ms);

  const momentumScores = universe.map((_, i) =>
    pct12m[i] * 0.55 + pct3m[i] * 0.30 + pct1m[i] * 0.15
  );

  // --- Quality sub-scores (lower vol / drawdown = better → invert) ---
  const vols = universe.map((t) => t.realizedVol ?? 0.3);
  const drawdowns = universe.map((t) => Math.abs(t.maxDrawdown ?? 0));

  const pctVolInv = percentileRank(vols.map((v) => -v)); // lower vol → higher rank
  const pctDDInv = percentileRank(drawdowns.map((d) => -d)); // smaller drawdown → higher rank

  const qualityScores = universe.map((_, i) =>
    pctDDInv[i] * 0.55 + pctVolInv[i] * 0.45
  );

  // --- Valuation (PE-based, individual, not relative) ---
  const valuationScores = universe.map((t) =>
    peToValuation(t.trailingPE ?? t.forwardPE)
  );

  // --- Trend (distance from 52w high) ---
  const trendScores = universe.map((t) => distToTrend(t.distFrom52wHigh));

  // --- Composite ---
  const compositeScores = universe.map((_, i) =>
    momentumScores[i] * 0.35 +
    qualityScores[i] * 0.25 +
    valuationScores[i] * 0.20 +
    trendScores[i] * 0.20
  );

  return universe.map((t, i) => {
    const scores = {
      momentum: momentumScores[i],
      quality: qualityScores[i],
      valuation: valuationScores[i],
      trend: trendScores[i],
    };
    return {
      ...t,
      score: Math.round(compositeScores[i] * 10) / 10,
      momentumScore: Math.round(momentumScores[i] * 10) / 10,
      qualityScore: Math.round(qualityScores[i] * 10) / 10,
      valuationScore: Math.round(valuationScores[i] * 10) / 10,
      trendScore: Math.round(trendScores[i] * 10) / 10,
      rationale: buildRationale(t, scores),
      riskFlags: buildRiskFlags(t, scores),
      volAdjReturn: t.ret12m !== null && t.realizedVol ? t.ret12m / t.realizedVol : null,
    };
  });
}
