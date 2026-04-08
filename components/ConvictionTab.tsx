"use client";
import type { ScoredTicker } from "@/lib/scoring";
import { Star, StarOff, Zap } from "lucide-react";

interface Props {
  results: ScoredTicker[];
  onSelect: (t: ScoredTicker) => void;
  onWatch: (t: ScoredTicker) => void;
  watchlist: string[];
  scoreColor: (s: number) => string;
}

function pct(v: number | null) {
  if (v == null) return "—";
  return (v >= 0 ? "+" : "") + (v * 100).toFixed(1) + "%";
}
function pctColor(v: number | null) {
  if (v == null) return "#8899b0";
  return v >= 0 ? "#10b981" : "#ef4444";
}

export default function ConvictionTab({ results, onSelect, onWatch, watchlist, scoreColor }: Props) {
  const top5 = results.slice(0, 5);

  return (
    <div className="h-full overflow-auto px-5 py-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#dce6f0] flex items-center gap-2">
            <Zap size={14} className="text-[#00d4ff]" />
            Top Conviction Names
          </h2>
          <p className="text-xs text-[#4a5568] mt-0.5">Percentile-ranked · deterministic · 0–100 scale</p>
        </div>
        <div className="text-[10px] text-[#4a5568] flex gap-4">
          <span><span className="inline-block w-2 h-2 rounded-full bg-[#10b981] mr-1" />High ≥65</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-[#f59e0b] mr-1" />Mid 45–64</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-[#ef4444] mr-1" />Low &lt;45</span>
        </div>
      </div>

      <div className="text-[10px] text-[#4a5568] mb-4 px-1">
        Momentum 35% · Quality 25% · Valuation 20% · Trend 20%
      </div>

      <div className="space-y-3">
        {top5.map((t, i) => {
          const watched = watchlist.includes(t.ticker);
          return (
            <div
              key={t.ticker}
              className="bg-[#0c1428] border border-[rgba(0,212,255,0.1)] rounded-xl p-4 hover:border-[rgba(0,212,255,0.25)] transition-all cursor-pointer"
              onClick={() => onSelect(t)}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Rank */}
                <div className="text-3xl font-bold text-[#4a5568] w-8 shrink-0 leading-none mt-1">#{i + 1}</div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#00d4ff] font-mono">{t.ticker}</span>
                    <span className="text-[11px] text-[#4a5568]">{t.sector}</span>
                    {t.price > 0 && <span className="text-[11px] text-[#8899b0]">${t.price.toFixed(2)}</span>}
                  </div>
                  <p className="text-xs text-[#8899b0] leading-relaxed line-clamp-2">{t.rationale || "No rationale generated."}</p>
                  {t.riskFlags.length > 0 && (
                    <p className="text-[11px] text-[#4a5568] mt-1.5 truncate">
                      ⚠ {t.riskFlags.slice(0, 2).join(" · ")}
                    </p>
                  )}
                </div>

                {/* Score */}
                <div className="shrink-0 text-center">
                  <div className="text-2xl font-bold" style={{ color: scoreColor(t.score) }}>{t.score.toFixed(0)}</div>
                  <div className="text-[10px] text-[#4a5568]">score</div>
                </div>

                {/* Returns */}
                <div className="shrink-0 text-right space-y-1">
                  <div className="text-xs" style={{ color: pctColor(t.ret12m) }}>{pct(t.ret12m)} <span className="text-[#4a5568]">12M</span></div>
                  <div className="text-xs" style={{ color: pctColor(t.ret3m) }}>{pct(t.ret3m)} <span className="text-[#4a5568]">3M</span></div>
                  <div className="text-xs" style={{ color: pctColor(t.ret1m) }}>{pct(t.ret1m)} <span className="text-[#4a5568]">1M</span></div>
                </div>

                {/* Watch button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onWatch(t); }}
                  className="shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border transition-colors"
                  style={{
                    borderColor: watched ? "#f59e0b40" : "rgba(0,212,255,0.15)",
                    color: watched ? "#f59e0b" : "#00d4ff",
                  }}
                >
                  {watched ? <Star size={11} className="fill-current" /> : <StarOff size={11} />}
                  {watched ? "Watching" : "Track"}
                </button>
              </div>

              {/* Score bars */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[
                  { label: "Momentum", value: t.momentumScore, color: "#7c3aed" },
                  { label: "Quality", value: t.qualityScore, color: "#10b981" },
                  { label: "Valuation", value: t.valuationScore, color: "#f59e0b" },
                  { label: "Trend", value: t.trendScore, color: "#00d4ff" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] text-[#4a5568]">{s.label}</span>
                      <span className="text-[9px]" style={{ color: s.color }}>{s.value?.toFixed(0) ?? "—"}</span>
                    </div>
                    <div className="h-1 bg-[#1e2a45] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.value ?? 0}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Remaining results summary */}
      {results.length > 5 && (
        <div className="mt-4 pt-4 border-t border-[rgba(0,212,255,0.08)]">
          <p className="text-xs text-[#4a5568] mb-2">All names by score:</p>
          <div className="flex flex-wrap gap-2">
            {results.slice(5).map((t) => (
              <button
                key={t.ticker}
                onClick={() => onSelect(t)}
                className="text-xs px-2.5 py-1 rounded bg-[#0c1428] border border-[rgba(0,212,255,0.08)] hover:border-[rgba(0,212,255,0.2)] transition-colors"
              >
                <span className="font-mono text-[#00d4ff]">{t.ticker}</span>
                <span className="ml-1.5" style={{ color: scoreColor(t.score) }}>{t.score.toFixed(0)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
