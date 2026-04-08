"use client";
import type { ScanHistoryEntry } from "@/app/page";
import { History, ChevronRight } from "lucide-react";

interface Props {
  history: ScanHistoryEntry[];
  onLoad: (entry: ScanHistoryEntry) => void;
  scoreColor: (s: number) => string;
}

export default function HistoryTab({ history, onLoad, scoreColor }: Props) {
  if (history.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#4a5568] gap-3">
        <History size={32} className="opacity-20" />
        <p className="text-sm">No scan history yet</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto px-5 py-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[#dce6f0]">Research History</h2>
        <p className="text-xs text-[#4a5568] mt-0.5">{history.length} session{history.length !== 1 ? "s" : ""} recorded</p>
      </div>

      <div className="space-y-3">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="bg-[#0c1428] border border-[rgba(0,212,255,0.08)] rounded-xl p-4 hover:border-[rgba(0,212,255,0.2)] cursor-pointer transition-all group"
            onClick={() => onLoad(entry)}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-[#dce6f0]">{entry.scanDate.split("T")[0]}</p>
                <p className="text-xs text-[#4a5568] mt-0.5">
                  {entry.universeSize} screened · {entry.ideas.length} results
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  {entry.topScore != null && (
                    <div className="text-lg font-bold" style={{ color: scoreColor(entry.topScore) }}>{entry.topScore.toFixed(0)}</div>
                  )}
                  <div className="text-[10px] text-[#4a5568]">top score</div>
                </div>
                <div className="text-right">
                  {entry.avgRet12m != null && (
                    <div className="text-sm font-semibold" style={{ color: entry.avgRet12m >= 0 ? "#10b981" : "#ef4444" }}>
                      {entry.avgRet12m >= 0 ? "+" : ""}{(entry.avgRet12m * 100).toFixed(1)}%
                    </div>
                  )}
                  <div className="text-[10px] text-[#4a5568]">avg 12M</div>
                </div>
                <ChevronRight size={14} className="text-[#4a5568] group-hover:text-[#00d4ff] transition-colors" />
              </div>
            </div>

            {/* Ideas preview */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[rgba(0,212,255,0.06)]">
                    {["Ticker", "Score", "Momentum", "Quality", "Valuation", "Trend", "12M Return"].map((h) => (
                      <th key={h} className="pr-4 pb-1 text-left text-[9px] text-[#4a5568] uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entry.ideas.slice(0, 8).map((idea) => (
                    <tr key={idea.ticker} className="border-b border-[rgba(0,212,255,0.03)]">
                      <td className="pr-4 py-1 font-mono text-[#00d4ff]">{idea.ticker}</td>
                      <td className="pr-4 py-1 font-semibold" style={{ color: scoreColor(idea.score) }}>{idea.score.toFixed(0)}</td>
                      <td className="pr-4 py-1 text-[#8899b0]">{idea.momentumScore.toFixed(0)}</td>
                      <td className="pr-4 py-1 text-[#8899b0]">{idea.qualityScore.toFixed(0)}</td>
                      <td className="pr-4 py-1 text-[#8899b0]">{idea.valuationScore.toFixed(0)}</td>
                      <td className="pr-4 py-1 text-[#8899b0]">{idea.trendScore.toFixed(0)}</td>
                      <td className="pr-4 py-1 font-mono" style={{ color: idea.ret12m != null ? (idea.ret12m >= 0 ? "#10b981" : "#ef4444") : "#4a5568" }}>
                        {idea.ret12m != null ? (idea.ret12m >= 0 ? "+" : "") + (idea.ret12m * 100).toFixed(1) + "%" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
