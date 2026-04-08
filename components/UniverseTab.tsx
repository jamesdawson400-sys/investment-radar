"use client";
import type { ScoredTicker } from "@/lib/scoring";
import ReturnChart from "./ReturnChart";
import { Download, Star, StarOff } from "lucide-react";

interface Props {
  results: ScoredTicker[];
  watchlist: string[];
  onSelect: (t: ScoredTicker) => void;
  onWatch: (t: ScoredTicker) => void;
  onExport: () => void;
  meta: { universeSize: number; filteredCount: number; scanDate: string } | null;
  scoreColor: (s: number) => string;
}

function fmt(v: number | null, decimals = 1, suffix = "") {
  if (v == null) return "—";
  return v.toFixed(decimals) + suffix;
}
function pct(v: number | null) {
  if (v == null) return "—";
  return (v >= 0 ? "+" : "") + (v * 100).toFixed(1) + "%";
}
function pctColor(v: number | null) {
  if (v == null) return "#8899b0";
  return v >= 0 ? "#10b981" : "#ef4444";
}

export default function UniverseTab({ results, watchlist, onSelect, onWatch, onExport, meta, scoreColor }: Props) {
  const topScore = results[0]?.score ?? null;
  const avgRet12m = results.length ? results.reduce((s, t) => s + (t.ret12m ?? 0), 0) / results.length : null;
  const highConviction = results.filter((t) => t.score >= 65).length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* KPI strip */}
      <div className="shrink-0 flex gap-3 px-5 py-3 border-b border-[rgba(0,212,255,0.08)] bg-[#0a0e1a]">
        {[
          { label: "Universe", value: String(meta?.universeSize ?? results.length), color: "#dce6f0" },
          { label: "Showing", value: String(meta?.filteredCount ?? results.length), color: "#dce6f0" },
          { label: "Top Score", value: topScore != null ? topScore.toFixed(0) : "—", color: topScore != null ? scoreColor(topScore) : "#8899b0" },
          { label: "Avg 12M Return", value: pct(avgRet12m), color: pctColor(avgRet12m) },
          { label: "High Conviction", value: String(highConviction), color: highConviction > 0 ? "#10b981" : "#8899b0" },
          { label: "Watchlist", value: String(watchlist.length), color: "#00d4ff" },
        ].map((k) => (
          <div key={k.label} className="flex-1 min-w-0 bg-[#0c1428] border border-[rgba(0,212,255,0.08)] rounded px-3 py-2">
            <div className="text-[10px] text-[#4a5568] uppercase tracking-wider">{k.label}</div>
            <div className="text-base font-bold mt-0.5" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#0c1428] border border-[rgba(0,212,255,0.15)] rounded text-xs text-[#00d4ff] hover:bg-[#132040] transition-colors"
        >
          <Download size={12} />
          Export JSON
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[rgba(0,212,255,0.08)] bg-[#0a0e1a] sticky top-0 z-10">
                {["#", "Ticker", "Price", "Mkt Cap $B", "Sector", "1M", "3M", "12M", "Vol %", "Max DD", "52W Hi %", "Beta", "Score", "Mom", "Qual", "Val", "Trend", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] text-[#4a5568] uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((t, i) => {
                const watched = watchlist.includes(t.ticker);
                return (
                  <tr
                    key={t.ticker}
                    className="border-b border-[rgba(0,212,255,0.05)] hover:bg-[#0f1c35] cursor-pointer transition-colors group"
                    onClick={() => onSelect(t)}
                  >
                    <td className="px-3 py-2 text-[#4a5568]">{i + 1}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-[#00d4ff]">{t.ticker}</td>
                    <td className="px-3 py-2 font-mono">${t.price > 0 ? t.price.toFixed(2) : "—"}</td>
                    <td className="px-3 py-2 font-mono">{t.marketCap ? (t.marketCap / 1e9).toFixed(0) : "—"}</td>
                    <td className="px-3 py-2 text-[#8899b0] max-w-[120px] truncate">{t.sector}</td>
                    <td className="px-3 py-2 font-mono" style={{ color: pctColor(t.ret1m) }}>{pct(t.ret1m)}</td>
                    <td className="px-3 py-2 font-mono" style={{ color: pctColor(t.ret3m) }}>{pct(t.ret3m)}</td>
                    <td className="px-3 py-2 font-mono font-semibold" style={{ color: pctColor(t.ret12m) }}>{pct(t.ret12m)}</td>
                    <td className="px-3 py-2 font-mono text-[#8899b0]">{t.realizedVol ? (t.realizedVol * 100).toFixed(1) : "—"}</td>
                    <td className="px-3 py-2 font-mono" style={{ color: t.maxDrawdown != null && t.maxDrawdown < -0.2 ? "#ef4444" : "#8899b0" }}>{t.maxDrawdown ? (t.maxDrawdown * 100).toFixed(1) + "%" : "—"}</td>
                    <td className="px-3 py-2 font-mono" style={{ color: pctColor(t.distFrom52wHigh) }}>{pct(t.distFrom52wHigh)}</td>
                    <td className="px-3 py-2 font-mono text-[#8899b0]">{fmt(t.beta, 2)}</td>
                    <td className="px-3 py-2">
                      <span className="inline-block w-9 text-center font-bold rounded text-xs py-0.5" style={{ color: scoreColor(t.score), background: scoreColor(t.score) + "20" }}>
                        {t.score.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[#8899b0]">{fmt(t.momentumScore, 0)}</td>
                    <td className="px-3 py-2 font-mono text-[#8899b0]">{fmt(t.qualityScore, 0)}</td>
                    <td className="px-3 py-2 font-mono text-[#8899b0]">{fmt(t.valuationScore, 0)}</td>
                    <td className="px-3 py-2 font-mono text-[#8899b0]">{fmt(t.trendScore, 0)}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onWatch(t); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#1e2a45]"
                      >
                        {watched
                          ? <Star size={12} className="fill-[#f59e0b] text-[#f59e0b]" />
                          : <StarOff size={12} className="text-[#4a5568]" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Return chart */}
        {results.length > 0 && (
          <div className="px-5 py-4 border-t border-[rgba(0,212,255,0.08)]">
            <p className="text-[10px] text-[#4a5568] uppercase tracking-wider font-semibold mb-3">
              Return Attribution · Top 10 Names by Score
            </p>
            <ReturnChart results={results} />
          </div>
        )}

        <div className="px-5 py-3 text-[10px] text-[#4a5568] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block" />
          Data sourced from Yahoo Finance. For informational purposes only. Not financial advice.
        </div>
      </div>
    </div>
  );
}
