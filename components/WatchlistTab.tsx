"use client";
import type { ScoredTicker } from "@/lib/scoring";
import type { WatchItem } from "@/app/page";
import { X, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  items: WatchItem[];
  results: ScoredTicker[];
  onRemove: (ticker: string) => void;
  scoreColor: (s: number) => string;
}

export default function WatchlistTab({ items, results, onRemove, scoreColor }: Props) {
  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#4a5568] gap-3 p-8">
        <div className="text-sm">No items in watchlist</div>
        <div className="text-xs text-[#4a5568]">Add tickers from Universe Overview or Conviction Names</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto px-5 py-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-[#dce6f0]">Watchlist</h2>
        <p className="text-xs text-[#4a5568] mt-0.5">{items.length} name{items.length !== 1 ? "s" : ""} tracked</p>
      </div>

      {/* Score vs Entry table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[rgba(0,212,255,0.08)] bg-[#0a0e1a]">
              {["Ticker", "Entry Score", "Current Score", "Change", "12M Return", "Sector", "Date Added", ""].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-[10px] text-[#4a5568] uppercase tracking-wider font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const current = results.find((r) => r.ticker === item.ticker);
              const currentScore = current?.score ?? null;
              const delta = currentScore != null ? currentScore - item.addedScore : null;
              const ret12m = current?.ret12m ?? null;

              return (
                <tr key={item.ticker} className="border-b border-[rgba(0,212,255,0.05)] hover:bg-[#0f1c35] transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-[#00d4ff]">{item.ticker}</td>
                  <td className="px-4 py-3">
                    <span style={{ color: scoreColor(item.addedScore) }} className="font-semibold">{item.addedScore.toFixed(0)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {currentScore != null
                      ? <span style={{ color: scoreColor(currentScore) }} className="font-semibold">{currentScore.toFixed(0)}</span>
                      : <span className="text-[#4a5568]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {delta != null ? (
                      <span className={`flex items-center gap-1 font-mono ${delta > 0 ? "text-[#10b981]" : delta < 0 ? "text-[#ef4444]" : "text-[#8899b0]"}`}>
                        {delta > 0 ? <TrendingUp size={11} /> : delta < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                        {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                      </span>
                    ) : <span className="text-[#4a5568]">—</span>}
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ color: ret12m != null ? (ret12m >= 0 ? "#10b981" : "#ef4444") : "#4a5568" }}>
                    {ret12m != null ? (ret12m >= 0 ? "+" : "") + (ret12m * 100).toFixed(1) + "%" : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#8899b0]">{current?.sector ?? "—"}</td>
                  <td className="px-4 py-3 text-[#4a5568]">{item.addedDate.split("T")[0]}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onRemove(item.ticker)}
                      className="p-1 rounded hover:bg-red-500/10 text-[#4a5568] hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
