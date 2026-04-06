"use client";

import { fmtPct, fmtPrice, scoreColor, scoreBg } from "@/lib/utils";
import type { ScoredTicker } from "@/lib/scoring";
import { Eye, Star } from "lucide-react";

interface Props {
  results: ScoredTicker[];
  watchlist: string[];
  selectedTicker: string | null;
  onSelect: (t: ScoredTicker) => void;
  onWatch: (t: ScoredTicker) => void;
}

export default function ResultsList({ results, watchlist, selectedTicker, onSelect, onWatch }: Props) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
        <span className="text-4xl">📡</span>
        <p className="text-sm">No results — adjust filters and run again</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#1e2a45]">
      {results.map((t, i) => (
        <div
          key={t.ticker}
          className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer
            ${selectedTicker === t.ticker ? "bg-[#00d4ff]/5 border-l-2 border-[#00d4ff]" : "hover:bg-[#131929]"}`}
          onClick={() => onSelect(t)}
        >
          {/* Rank */}
          <span className="text-slate-500 text-xs w-5 text-right shrink-0">{i + 1}</span>

          {/* Ticker + name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm">{t.ticker}</span>
              <span className="text-xs text-slate-400 truncate">{t.sector}</span>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">{t.name}</p>
          </div>

          {/* Price + return */}
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-200">{fmtPrice(t.price)}</p>
            <p className={`text-xs font-medium ${t.ret12m !== null && t.ret12m >= 0 ? "text-accent-green" : "text-accent-red"}`}>
              {fmtPct(t.ret12m)}
            </p>
          </div>

          {/* Score badge */}
          <div className={`w-10 h-10 rounded flex items-center justify-center border text-sm font-bold shrink-0 ${scoreBg(t.score)} ${scoreColor(t.score)}`}>
            {Math.round(t.score)}
          </div>

          {/* Actions */}
          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onSelect(t)}
              className="p-1.5 rounded text-slate-400 hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-colors"
              title="View detail"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={() => onWatch(t)}
              className={`p-1.5 rounded transition-colors ${
                watchlist.includes(t.ticker)
                  ? "text-accent-amber hover:text-slate-400"
                  : "text-slate-400 hover:text-accent-amber hover:bg-accent-amber/10"
              }`}
              title={watchlist.includes(t.ticker) ? "Remove from watchlist" : "Add to watchlist"}
            >
              <Star size={14} fill={watchlist.includes(t.ticker) ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
