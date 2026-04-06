"use client";

import { useState } from "react";
import { DEFAULT_UNIVERSE } from "@/lib/screening";

const SECTORS = [
  "Technology", "Healthcare", "Financials", "Consumer Discretionary",
  "Consumer Staples", "Industrials", "Energy", "Materials",
  "Real Estate", "Utilities", "Communication Services",
];

const SORT_OPTIONS = [
  { value: "score", label: "Conviction Score" },
  { value: "ret12m", label: "12M Return" },
  { value: "volAdjReturn", label: "Vol-Adjusted Return" },
  { value: "qualityScore", label: "Quality Score" },
];

export interface ScanParams {
  tickers: string[];
  minMarketCapB: number;
  maxVolPct: number;
  minScore: number;
  sectors: string[];
  sortKey: string;
}

interface Props {
  onScan: (params: ScanParams) => void;
  loading: boolean;
}

export default function ControlPanel({ onScan, loading }: Props) {
  const [universeMode, setUniverseMode] = useState<"default" | "paste">("default");
  const [pastedTickers, setPastedTickers] = useState("");
  const [minMarketCapB, setMinMarketCapB] = useState(0);
  const [maxVolPct, setMaxVolPct] = useState(100);
  const [minScore, setMinScore] = useState(0);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState("score");

  function toggleSector(s: string) {
    setSelectedSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function handleScan() {
    let tickers = DEFAULT_UNIVERSE;
    if (universeMode === "paste") {
      tickers = pastedTickers
        .split(/[\s,;\n]+/)
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean);
    }
    onScan({ tickers, minMarketCapB, maxVolPct, minScore, sectors: selectedSectors, sortKey });
  }

  return (
    <aside className="w-72 min-w-[260px] bg-[#0f1629] border-r border-[#1e2a45] flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#1e2a45]">
        <h1 className="text-[#00d4ff] font-bold text-lg tracking-tight">Investment Radar</h1>
        <p className="text-slate-400 text-xs mt-0.5">Quantitative screening</p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5">
        {/* Universe */}
        <section>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Universe</label>
          <div className="mt-2 flex gap-2">
            {(["default", "paste"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setUniverseMode(m)}
                className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                  universeMode === m
                    ? "bg-[#00d4ff]/10 border-[#00d4ff]/50 text-[#00d4ff]"
                    : "border-[#1e2a45] text-slate-400 hover:border-slate-500"
                }`}
              >
                {m === "default" ? "Default (16)" : "Paste tickers"}
              </button>
            ))}
          </div>
          {universeMode === "paste" && (
            <textarea
              className="mt-2 w-full bg-[#131929] border border-[#1e2a45] rounded p-2 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-[#00d4ff]/50"
              rows={4}
              placeholder={"AAPL, MSFT, GOOGL\nor one per line"}
              value={pastedTickers}
              onChange={(e) => setPastedTickers(e.target.value)}
            />
          )}
        </section>

        {/* Filters */}
        <section>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Filters</label>
          <div className="mt-3 space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Min Market Cap</span>
                <span className="text-slate-200">{minMarketCapB === 0 ? "Any" : `$${minMarketCapB}B`}</span>
              </div>
              <input type="range" min={0} max={500} step={10} value={minMarketCapB}
                onChange={(e) => setMinMarketCapB(Number(e.target.value))} />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Max Ann. Volatility</span>
                <span className="text-slate-200">{maxVolPct}%</span>
              </div>
              <input type="range" min={10} max={100} step={5} value={maxVolPct}
                onChange={(e) => setMaxVolPct(Number(e.target.value))} />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Min Conviction Score</span>
                <span className="text-slate-200">{minScore}</span>
              </div>
              <input type="range" min={0} max={90} step={5} value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))} />
            </div>
          </div>
        </section>

        {/* Sectors */}
        <section>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Sectors</label>
          <div className="mt-2 flex flex-wrap gap-1">
            {SECTORS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSector(s)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                  selectedSectors.includes(s)
                    ? "bg-[#00d4ff]/10 border-[#00d4ff]/40 text-[#00d4ff]"
                    : "border-[#1e2a45] text-slate-400 hover:border-slate-500"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Sort */}
        <section>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Rank By</label>
          <select
            className="mt-2 w-full bg-[#131929] border border-[#1e2a45] text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-[#00d4ff]/50"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </section>
      </div>

      {/* Run button */}
      <div className="p-4 border-t border-[#1e2a45]">
        <button
          onClick={handleScan}
          disabled={loading}
          className="w-full py-2.5 rounded font-semibold text-sm transition-all
            bg-[#00d4ff] text-[#0a0e1a] hover:bg-[#00bbee] active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Scanning…" : "Run Screen"}
        </button>
      </div>
    </aside>
  );
}
