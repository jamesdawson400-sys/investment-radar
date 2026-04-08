"use client";
import { useState } from "react";
import type { ScoredTicker } from "@/lib/scoring";
import PriceChart from "./PriceChart";
import ScoreBreakdownChart from "./ScoreBreakdownChart";
import { Star, StarOff, AlertTriangle } from "lucide-react";

interface Props {
  results: ScoredTicker[];
  selected: ScoredTicker | null;
  onSelect: (t: ScoredTicker) => void;
  onWatch: (t: ScoredTicker) => void;
  watchlist: string[];
  scoreColor: (s: number) => string;
}

function pct(v: number | null) {
  if (v == null) return "—";
  return (v >= 0 ? "+" : "") + (v * 100).toFixed(2) + "%";
}
function pctColor(v: number | null) {
  if (v == null) return "#8899b0";
  return v >= 0 ? "#10b981" : "#ef4444";
}
function fmt2(v: number | null, decimals = 2, suffix = "") {
  if (v == null) return "—";
  return v.toFixed(decimals) + suffix;
}

export default function SecurityTab({ results, selected, onSelect, onWatch, watchlist, scoreColor }: Props) {
  const [ticker, setTicker] = useState<string>(selected?.ticker ?? results[0]?.ticker ?? "");
  const t = results.find((r) => r.ticker === ticker) ?? results[0];

  if (!t) return <div className="p-8 text-[#8899b0] text-sm">No results available.</div>;

  const watched = watchlist.includes(t.ticker);

  return (
    <div className="h-full overflow-auto">
      {/* Ticker selector */}
      <div className="sticky top-0 z-10 bg-[#0a0e1a] border-b border-[rgba(0,212,255,0.08)] px-5 py-2.5 flex items-center gap-3">
        <label className="text-xs text-[#8899b0]">Security</label>
        <select
          value={ticker}
          onChange={(e) => { setTicker(e.target.value); onSelect(results.find((r) => r.ticker === e.target.value)!); }}
          className="bg-[#0c1428] border border-[rgba(0,212,255,0.15)] text-[#dce6f0] text-xs rounded px-3 py-1.5 outline-none"
        >
          {results.map((r) => (
            <option key={r.ticker} value={r.ticker}>{r.ticker} — {r.name}</option>
          ))}
        </select>
        <button
          onClick={() => onWatch(t)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-colors"
          style={{
            borderColor: watched ? "#f59e0b40" : "rgba(0,212,255,0.15)",
            color: watched ? "#f59e0b" : "#00d4ff",
            background: watched ? "#f59e0b10" : "transparent",
          }}
        >
          {watched ? <Star size={12} className="fill-current" /> : <StarOff size={12} />}
          {watched ? "Watching" : "Add to Watchlist"}
        </button>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Last Price", value: t.price > 0 ? "$" + t.price.toFixed(2) : "—", color: "#dce6f0" },
            { label: "Conviction Score", value: t.score.toFixed(0), color: scoreColor(t.score) },
            { label: "12M Return", value: pct(t.ret12m), color: pctColor(t.ret12m) },
            { label: "Ann. Volatility", value: t.realizedVol ? (t.realizedVol * 100).toFixed(1) + "%" : "—", color: t.realizedVol != null && t.realizedVol > 0.4 ? "#ef4444" : "#8899b0" },
            { label: "Max Drawdown", value: t.maxDrawdown ? (t.maxDrawdown * 100).toFixed(1) + "%" : "—", color: t.maxDrawdown != null && t.maxDrawdown < -0.3 ? "#ef4444" : "#8899b0" },
          ].map((k) => (
            <div key={k.label} className="bg-[#0c1428] border border-[rgba(0,212,255,0.08)] rounded-lg p-3">
              <div className="text-[10px] text-[#4a5568] uppercase tracking-wider">{k.label}</div>
              <div className="text-xl font-bold mt-1" style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0c1428] border border-[rgba(0,212,255,0.08)] rounded-lg p-4">
            <p className="text-xs text-[#8899b0] font-medium mb-3">{t.ticker} — 1-Year Price History</p>
            {t.priceHistory.length > 0
              ? <PriceChart history={t.priceHistory} ma50={t.ma50} high52w={t.fiftyTwoWeekHigh} low52w={t.fiftyTwoWeekLow} />
              : <div className="h-40 flex items-center justify-center text-xs text-[#4a5568]">No price history</div>}
          </div>
          <div className="bg-[#0c1428] border border-[rgba(0,212,255,0.08)] rounded-lg p-4">
            <p className="text-xs text-[#8899b0] font-medium mb-3">Score Decomposition</p>
            <ScoreBreakdownChart momentum={t.momentumScore} quality={t.qualityScore} valuation={t.valuationScore} trend={t.trendScore} />
            <p className="text-[10px] text-[#4a5568] mt-2">Momentum 35% · Quality 25% · Valuation 20% · Trend 20%</p>
          </div>
        </div>

        {/* Rationale */}
        {t.rationale && (
          <div className="bg-[#0c1428] border-l-2 border-[#00d4ff] rounded-r-lg p-4">
            <p className="text-[10px] text-[#00d4ff] uppercase tracking-wider font-semibold mb-1.5">Investment Thesis</p>
            <p className="text-sm text-[#dce6f0] leading-relaxed">{t.rationale}</p>
          </div>
        )}

        {/* Risk flags */}
        <div className="bg-[#0c1428] border border-[rgba(0,212,255,0.08)] rounded-lg p-4">
          <p className="text-[10px] text-[#8899b0] uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
            <AlertTriangle size={11} /> Key Risk Factors
          </p>
          {t.riskFlags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {t.riskFlags.map((r) => (
                <span key={r} className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{r}</span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#10b981]">No material risk flags identified.</p>
          )}
        </div>

        {/* Fundamental table */}
        <div className="bg-[#0c1428] border border-[rgba(0,212,255,0.08)] rounded-lg p-4">
          <p className="text-[10px] text-[#8899b0] uppercase tracking-wider font-semibold mb-3">Fundamental & Technical Data</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            {[
              ["Sector", t.sector],
              ["Industry", t.industry],
              ["Market Cap", t.marketCap ? "$" + (t.marketCap / 1e9).toFixed(1) + "B" : "—"],
              ["Trailing P/E", fmt2(t.trailingPE)],
              ["Forward P/E", fmt2(t.forwardPE)],
              ["Dividend Yield", t.dividendYield ? (t.dividendYield * 100).toFixed(2) + "%" : "—"],
              ["Beta", fmt2(t.beta)],
              ["52W High", t.fiftyTwoWeekHigh ? "$" + t.fiftyTwoWeekHigh.toFixed(2) : "—"],
              ["52W Low", t.fiftyTwoWeekLow ? "$" + t.fiftyTwoWeekLow.toFixed(2) : "—"],
              ["1M Return", pct(t.ret1m)],
              ["3M Return", pct(t.ret3m)],
              ["12M Return", pct(t.ret12m)],
              ["Realised Vol", t.realizedVol ? (t.realizedVol * 100).toFixed(1) + "%" : "—"],
              ["Max Drawdown", t.maxDrawdown ? (t.maxDrawdown * 100).toFixed(1) + "%" : "—"],
              ["Dist from 52W High", pct(t.distFrom52wHigh)],
              ["Vol-Adj Return", t.volAdjReturn != null ? t.volAdjReturn.toFixed(2) : "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1 border-b border-[rgba(0,212,255,0.05)]">
                <span className="text-[11px] text-[#8899b0]">{label}</span>
                <span className="text-[11px] text-[#dce6f0] font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
