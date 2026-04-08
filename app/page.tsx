"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import ControlPanel, { type ScanParams } from "@/components/ControlPanel";
const UniverseTab = dynamic(() => import("@/components/UniverseTab"), { ssr: false });
const SecurityTab = dynamic(() => import("@/components/SecurityTab"), { ssr: false });
const ConvictionTab = dynamic(() => import("@/components/ConvictionTab"), { ssr: false });
const WatchlistTab = dynamic(() => import("@/components/WatchlistTab"), { ssr: false });
const HistoryTab = dynamic(() => import("@/components/HistoryTab"), { ssr: false });
import type { ScoredTicker } from "@/lib/scoring";
import { Activity, BarChart2, Star, Bookmark, History, Zap } from "lucide-react";

type Tab = "universe" | "security" | "conviction" | "watchlist" | "history";

export interface WatchItem {
  id: number;
  ticker: string;
  name: string;
  addedDate: string;
  addedScore: number;
}

export interface ScanHistoryEntry {
  id: number;
  scanDate: string;
  universeSize: number;
  topScore: number | null;
  avgRet12m: number | null;
  ideas: {
    ticker: string;
    score: number;
    ret12m: number | null;
    momentumScore: number;
    qualityScore: number;
    valuationScore: number;
    trendScore: number;
    rationale: string;
    riskSummary: string;
  }[];
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "universe", label: "Universe Overview", icon: <BarChart2 size={13} /> },
  { id: "security", label: "Security Analysis", icon: <Activity size={13} /> },
  { id: "conviction", label: "Conviction Names", icon: <Zap size={13} /> },
  { id: "watchlist", label: "Watchlist", icon: <Star size={13} /> },
  { id: "history", label: "Research History", icon: <History size={13} /> },
];

function scoreColor(s: number) {
  if (s >= 65) return "#10b981";
  if (s >= 45) return "#f59e0b";
  return "#ef4444";
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScoredTicker[]>([]);
  const [selected, setSelected] = useState<ScoredTicker | null>(null);
  const [tab, setTab] = useState<Tab>("universe");
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [lastScanMeta, setLastScanMeta] = useState<{
    universeSize: number;
    filteredCount: number;
    scanDate: string;
  } | null>(null);

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
      setLastScanMeta({
        universeSize: data.meta.universeSize,
        filteredCount: data.meta.filteredCount,
        scanDate: data.scanDate,
      });
      setTab("universe");
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

  function handleExportJSON() {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `idea_radar_${new Date().toISOString().slice(0, 16).replace(/[-T:]/g, "")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadHistoryScan(entry: ScanHistoryEntry) {
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
      momentumScore: idea.momentumScore,
      qualityScore: idea.qualityScore,
      valuationScore: idea.valuationScore,
      trendScore: idea.trendScore,
      rationale: idea.rationale,
      riskFlags: idea.riskSummary ? idea.riskSummary.split(", ").filter(Boolean) : [],
      volAdjReturn: null,
    })) as ScoredTicker[];
    setResults(partial);
    setLastScanMeta({
      universeSize: entry.universeSize,
      filteredCount: entry.ideas.length,
      scanDate: entry.scanDate,
    });
    setTab("universe");
  }

  const watchedTickers = watchlist.map((w) => w.ticker);

  return (
    <div className="flex h-screen overflow-hidden bg-[#050b16] text-[#dce6f0]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Left: control panel */}
      <ControlPanel onScan={handleScan} loading={loading} />

      {/* Right: main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <div className="shrink-0 px-6 py-3 border-b border-[rgba(0,212,255,0.1)] bg-[#0c1428]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium pb-2 border-b-2 transition-colors whitespace-nowrap ${
                    tab === t.id
                      ? "border-[#00d4ff] text-[#00d4ff]"
                      : "border-transparent text-[#8899b0] hover:text-[#dce6f0]"
                  }`}
                >
                  {t.icon}
                  {t.label}
                  {t.id === "watchlist" && watchlist.length > 0 && (
                    <span className="ml-1 text-[10px] bg-[#1e2a45] text-[#8899b0] px-1.5 py-0.5 rounded-full">
                      {watchlist.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {lastScanMeta && (
              <span className="text-[11px] text-[#4a5568] shrink-0">
                {lastScanMeta.filteredCount} / {lastScanMeta.universeSize} names · {lastScanMeta.scanDate.split("T")[0]}
              </span>
            )}
          </div>
        </div>

        {/* Loading bar */}
        {loading && (
          <div className="h-0.5 bg-[#1e2a45] shrink-0">
            <div className="h-full bg-[#00d4ff] animate-pulse w-full" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-5 mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs shrink-0">
            {error}
          </div>
        )}

        {/* No scan yet */}
        {results.length === 0 && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10 text-[#8899b0]">
            <Bookmark size={48} className="opacity-10" />
            <div className="text-center">
              <p className="text-sm font-semibold text-[#dce6f0]">Investment Idea Radar</p>
              <p className="text-xs mt-1 text-[#8899b0]">Configure your universe and run the screen to get started</p>
            </div>
            <div className="grid grid-cols-3 gap-4 w-full max-w-sm mt-2">
              {["1. Define Universe", "2. Apply Filters", "3. View Ideas"].map((s) => (
                <div key={s} className="bg-[#0c1428] border border-[rgba(0,212,255,0.1)] rounded-lg p-3 text-center">
                  <div className="text-[#00d4ff] text-xs font-semibold">{s.split(".")[0]}.</div>
                  <div className="text-[10px] text-[#8899b0] mt-1">{s.split(". ")[1]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab content */}
        {results.length > 0 && !loading && (
          <div className="flex-1 overflow-hidden">
            {tab === "universe" && (
              <UniverseTab
                results={results}
                watchlist={watchedTickers}
                onSelect={(t) => { setSelected(t); setTab("security"); }}
                onWatch={handleWatch}
                onExport={handleExportJSON}
                meta={lastScanMeta}
                scoreColor={scoreColor}
              />
            )}
            {tab === "security" && (
              <SecurityTab
                results={results}
                selected={selected}
                onSelect={setSelected}
                onWatch={handleWatch}
                watchlist={watchedTickers}
                scoreColor={scoreColor}
              />
            )}
            {tab === "conviction" && (
              <ConvictionTab
                results={results}
                onSelect={(t) => { setSelected(t); setTab("security"); }}
                onWatch={handleWatch}
                watchlist={watchedTickers}
                scoreColor={scoreColor}
              />
            )}
            {tab === "watchlist" && (
              <WatchlistTab
                items={watchlist}
                results={results}
                onRemove={async (ticker) => {
                  await fetch(`/api/watchlist/${ticker}`, { method: "DELETE" });
                  loadWatchlist();
                }}
                scoreColor={scoreColor}
              />
            )}
            {tab === "history" && (
              <HistoryTab
                history={history}
                onLoad={loadHistoryScan}
                scoreColor={scoreColor}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
