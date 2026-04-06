"use client";

import { Trash2 } from "lucide-react";
import { scoreColor, scoreBg } from "@/lib/utils";

interface WatchItem {
  id: number;
  ticker: string;
  name: string;
  addedDate: string;
  addedScore: number;
}

interface Props {
  items: WatchItem[];
  onRemove: (ticker: string) => void;
}

export default function WatchlistPanel({ items, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 p-8">
        <span className="text-3xl">⭐</span>
        <p className="text-sm text-center">No items in watchlist yet. Add ideas from scan results.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#1e2a45]">
      {items.map((item) => (
        <div key={item.ticker} className="flex items-center gap-3 px-4 py-3 hover:bg-[#131929] transition-colors">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-100">{item.ticker}</p>
            <p className="text-xs text-slate-500 truncate">{item.name}</p>
            <p className="text-xs text-slate-600 mt-0.5">Added {item.addedDate.split("T")[0]}</p>
          </div>
          <div className={`w-9 h-9 rounded flex items-center justify-center border text-xs font-bold ${scoreBg(item.addedScore)} ${scoreColor(item.addedScore)}`}>
            {Math.round(item.addedScore)}
          </div>
          <button
            onClick={() => onRemove(item.ticker)}
            className="p-1.5 rounded text-slate-500 hover:text-accent-red hover:bg-accent-red/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
