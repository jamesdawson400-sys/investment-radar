"use client";

import { useState, useEffect, useCallback } from "react";
import ControlPanel, { type ScanParams } from "@/components/ControlPanel";
import ResultsList from "@/components/ResultsList";
import DetailPanel from "@/components/DetailPanel";
import ReturnChart from "@/components/ReturnChart";
import WatchlistPanel from "@/components/WatchlistPanel";
import type { ScoredTicker } from "@/lib/scoring";
import { Activity, Star, History, BarChart2 } from "lucide-react";

type Tab = "results" | "watchlist" | "history";

interface WatchItem {
  id: number;
  ticker: string;
  name: string;
  addedDate: string;
  addedScore: number;
}

interface ScanHistoryEntry {
  id: number;
  scanDate: string;
  universeSize: number;
  topScore: number | null;
  avgRet12m: number | null;
  ideas: { ticker: string; score: number; ret12m: number | null }[];
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScoredTicker[]>([]);
  const [selected, setSelected] = useState<ScoredTicker | null>(null);
  const [tab, setTab] = useState<Tab>("results");
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [lastScanMeta, setLastScanMeta] = useState<{ universeSize: number; filteredCount: number } | null>(null);

  const loadWatchlist = useCallback(async () => {
    const res = await fetch("/api/watchlist");
    if (res.ok) setWatchlist(await res.json());
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/history");
    if (res.ok) setHistory(await res.json());
  }, []);

  useEffect(() => {
    loadWatchlist();
    loadHistory();
  }, [loadWatchlist, loadHistory]);

  async function handleScan(params: ScanParams) {
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Scan failed");
      }
      const data = await res.json();
      setResults(data.results);
      setLastScanMeta({ universeSize: data.meta.universeSize, filteredCount: data.meta.filteredCount });
      setTab("results");
      loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleWatch(t: ScoredTicker) {
    const isWatched = watchlist.some((w) => w.ticker === t.ticker);
    if (isWatched) {
      await fetch(`/api/watchlist/${t.ticker}`, { method: "DELETE" });
    } else {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: t.ticker, name: t.name, score: t.score }),
      });
    }
    loadWatchlist();
  }

  async function handleRemoveWatch(ticker: string) {
    await fetch(`/api/watchlist/${ticker}`, { method: "DELETE" });
    loadWatchlist();
  }

  function loadHistoryScan(entry: ScanHistoryEntry) {
    // Re-hydrate from history (no price history — summary only)
    const partial = entry.ideas.map((idea) => ({
      ticker: idea.ticker,
      name: idea.ticker,
      sector: "",
      industry: "",
      price: 0,
      marketCap: null,
      trailingPE: null,
      forwardPE: null,
      dividendYield: null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      beta: null,
      ret1m: null,
      ret3m: null,
      ret12m: idea.ret12m,
      realizedVol: null,
      maxDrawdown: null,
      distFrom52wHigh: null,
      priceHistory: [],
      ma50: null,
      score: idea.score,
      momentumScore: 0,
      qualityScore: 0,
      valuationScore: 0,
      trendScore: 0,
      rationale: "",
      riskFlags: [],
      volAdjReturn: null,
    })) as ScoredTicker[];
    setResults(partial);
    setLastScanMeta({ universeSize: entry.universeSize, filteredCount: entry.ideas.length });
    setTab("results");
  }

  const watchedTickers = watchlist.map((w) => w.ticker);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Left: control panel */}
      <ControlPanel onScan={handleScan} loading={loading} />

      {/* Right: main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2a45] bg-[#0f1629] shrink-0">
          <div className="flex items-center gap-4">
            {(["results", "watchlist", "history"] as Tab[]).map((t) => {
              const icons = { results: <Activity size={14} />, watchlist: <Star size={14} />, history: <History size={14} /> };
              const labels = { results: "Results", watchlist: `Watchlist (${watchlist.length})`, history: "History" };
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex items-center gap-1.5 text-sm pb-2 border-b-2 transition-colors ${
                    tab === t
                      ? "border-[#00d4ff] text-[#00d4ff]"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {icons[t]}
                  {labels[t]}
                </button>
              );
            })}
          </div>
          {lastScanMeta && (
            <span className="text-xs text-slate-500">
              Screened {lastScanMeta.universeSize} · Showing {lastScanMeta.filteredCount}
            </span>
          )}
        </div>

        {/* Loading bar */}
        {loading && (
          <div className="h-0.5 bg-[#1e2a45] overflow-hidden shrink-0">
            <div className="h-full bg-[#00d4ff] animate-pulse w-full" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 p-3 bg-accent-red/10 border border-accent-red/30 rounded text-accent-red text-sm shrink-0">
            {error}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-hidden flex">
          {tab === "results" && (
            <>
              {/* Results list + chart column */}
              <div className={`flex flex-col overflow-hidden transition-all ${selected ? "w-72 min-w-[260px]" : "flex-1"}`}>
                {results.length === 0 && !loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 p-8">
                    <BarChart2 size={48} className="opacity-20" />
                    <div className="text-center">
                      <p className="text-sm font-medium">No scan yet</p>
                      <p className="text-xs mt-1">Configure your universe and run the screen</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-sm">
                      {["Define Universe", "Apply Filters", "View Ideas"].map((s, i) => (
                        <div key={s} className="bg-[#0f1629] border border-[#1e2a45] rounded-lg p-3 text-center">
                          <div className="text-[#00d4ff] font-bold text-lg">{i + 1}</div>
                          <div className="text-xs text-slate-400 mt-1">{s}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto">
                      <ResultsList
                        results={results}
                        watchlist={watchedTickers}
                        selectedTicker={selected?.ticker ?? null}
                        onSelect={setSelected}
                        onWatch={handleWatch}
                      />
                    </div>
                    {results.length > 0 && !selected && (
                      <div className="border-t border-[#1e2a45] p-4 shrink-0">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">
                          Return Attribution (Top 10)
                        </p>
                        <ReturnChart results={results} />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Detail panel */}
              {selected && (
                <div className="flex-1 border-l border-[#1e2a45] overflow-hidden bg-[#0f1629]">
                  <DetailPanel ticker={selected} onClose={() => setSelected(null)} />
                </div>
              )}
            </>
          )}

          {tab === "watchlist" && (
            <div className="flex-1 overflow-y-auto">
              <WatchlistPanel items={watchlist} onRemove={handleRemoveWatch} />
            </div>
          )}

          {tab === "history" && (
            <div className="flex-1 overflow-y-auto divide-y divide-[#1e2a45]">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 p-8">
                  <History size={32} className="opacity-20" />
                  <p className="text-sm">No scan history yet</p>
                </div>
              ) : (
                history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-[#131929] cursor-pointer transition-colors"
                    onClick={() => loadHistoryScan(entry)}
                  >
                    <div>
                      <p className="text-sm text-slate-200">{entry.scanDate.split("T")[0]}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {entry.universeSize} screened · {entry.ideas.length} results
                      </p>
                    </div>
                    <div className="text-right">
                      {entry.topScore && (
                        <p className="text-sm font-semibold text-[#00d4ff]">{entry.topScore.toFixed(0)}</p>
                      )}
                      <p className="text-xs text-slate-500">top score</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
