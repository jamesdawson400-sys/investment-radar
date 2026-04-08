import type { ScoredTicker } from "./scoring";

export interface ScreenFilters {
  minMarketCapB: number;   // billions
  maxVolPct: number;       // percent e.g. 60 means 60%
  minScore: number;
  sectors: string[];
}

export type SortKey = "score" | "ret12m" | "volAdjReturn" | "qualityScore";

export function applyFilters(universe: ScoredTicker[], filters: ScreenFilters): ScoredTicker[] {
  return universe.filter((t) => {
    if (filters.minMarketCapB > 0 && t.marketCap !== null) {
      if (t.marketCap < filters.minMarketCapB * 1e9) return false;
    }
    if (t.realizedVol !== null && t.realizedVol * 100 > filters.maxVolPct) return false;
    if (t.score < filters.minScore) return false;
    if (filters.sectors.length > 0 && !filters.sectors.includes(t.sector)) return false;
    return true;
  });
}

export function sortResults(universe: ScoredTicker[], key: SortKey): ScoredTicker[] {
  return [...universe].sort((a, b) => {
    const aVal = a[key] ?? -Infinity;
    const bVal = b[key] ?? -Infinity;
    return (bVal as number) - (aVal as number);
  });
}

export const DEFAULT_UNIVERSE = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
  "META", "TSLA", "JPM", "JNJ", "V",
];
