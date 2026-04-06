"use client";

import { fmtPrice, fmtMarketCap, fmtPct, scoreColor, scoreBg } from "@/lib/utils";
import type { ScoredTicker } from "@/lib/scoring";
import PriceChart from "./PriceChart";
import ScoreBreakdownChart from "./ScoreBreakdownChart";
import { X } from "lucide-react";

interface Props {
  ticker: ScoredTicker;
  onClose: () => void;
}

export default function DetailPanel({ ticker: t, onClose }: Props) {
  const pe = t.trailingPE ?? t.forwardPE;

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-[#1e2a45] sticky top-0 bg-[#0f1629] z-10">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-100">{t.ticker}</h2>
            <span className={`px-2 py-0.5 rounded border text-sm font-bold ${scoreBg(t.score)} ${scoreColor(t.score)}`}>
              {Math.round(t.score)}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">{t.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t.sector} · {t.industry}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1e2a45] transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Price", value: fmtPrice(t.price) },
            { label: "Market Cap", value: fmtMarketCap(t.marketCap) },
            { label: "P/E Ratio", value: pe ? pe.toFixed(1) : "—" },
            { label: "Div. Yield", value: t.dividendYield ? fmtPct(t.dividendYield) : "—" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-[#131929] border border-[#1e2a45] rounded-lg p-3">
              <p className="text-xs text-slate-400">{kpi.label}</p>
              <p className="text-base font-semibold text-slate-100 mt-0.5">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Returns */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "1M Return", value: t.ret1m },
            { label: "3M Return", value: t.ret3m },
            { label: "12M Return", value: t.ret12m },
          ].map((r) => (
            <div key={r.label} className="bg-[#131929] border border-[#1e2a45] rounded-lg p-3">
              <p className="text-xs text-slate-400">{r.label}</p>
              <p className={`text-base font-semibold mt-0.5 ${r.value !== null && r.value >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                {fmtPct(r.value)}
              </p>
            </div>
          ))}
        </div>

        {/* Price chart */}
        <div className="bg-[#131929] border border-[#1e2a45] rounded-lg p-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">1-Year Price</h3>
          <PriceChart history={t.priceHistory} ma50={t.ma50} />
        </div>

        {/* Score breakdown */}
        <div className="bg-[#131929] border border-[#1e2a45] rounded-lg p-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Score Breakdown</h3>
          <ScoreBreakdownChart
            momentum={t.momentumScore}
            quality={t.qualityScore}
            valuation={t.valuationScore}
            trend={t.trendScore}
          />
        </div>

        {/* Rationale */}
        <div className="bg-[#131929] border border-[#1e2a45] rounded-lg p-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Rationale</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{t.rationale}</p>
        </div>

        {/* Risk flags */}
        {t.riskFlags.length > 0 && (
          <div className="bg-accent-red/5 border border-accent-red/20 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-accent-red uppercase tracking-wider mb-2">Risk Flags</h3>
            <div className="flex flex-wrap gap-1.5">
              {t.riskFlags.map((flag) => (
                <span key={flag} className="px-2 py-0.5 text-xs bg-accent-red/10 text-accent-red border border-accent-red/20 rounded">
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Extra metrics */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Ann. Volatility", value: fmtPct(t.realizedVol) },
            { label: "Max Drawdown", value: fmtPct(t.maxDrawdown) },
            { label: "Beta", value: t.beta?.toFixed(2) ?? "—" },
            { label: "52W High", value: fmtPrice(t.fiftyTwoWeekHigh) },
          ].map((m) => (
            <div key={m.label} className="bg-[#131929] border border-[#1e2a45] rounded-lg p-3">
              <p className="text-xs text-slate-400">{m.label}</p>
              <p className="text-sm font-medium text-slate-200 mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
