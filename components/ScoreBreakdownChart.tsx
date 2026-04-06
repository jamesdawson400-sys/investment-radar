"use client";

import { scoreColor } from "@/lib/utils";

interface Props {
  momentum: number;
  quality: number;
  valuation: number;
  trend: number;
}

const DIMS = [
  { key: "momentum" as const, label: "Momentum", weight: "35%" },
  { key: "quality" as const, label: "Quality", weight: "25%" },
  { key: "valuation" as const, label: "Valuation", weight: "20%" },
  { key: "trend" as const, label: "Trend", weight: "20%" },
];

export default function ScoreBreakdownChart({ momentum, quality, valuation, trend }: Props) {
  const values = { momentum, quality, valuation, trend };

  return (
    <div className="space-y-2.5">
      {DIMS.map((d) => {
        const v = values[d.key];
        const color = v >= 65 ? "#10b981" : v >= 45 ? "#f59e0b" : "#ef4444";
        return (
          <div key={d.key}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400">
                {d.label} <span className="text-slate-600">({d.weight})</span>
              </span>
              <span className={`text-xs font-semibold ${scoreColor(v)}`}>{Math.round(v)}</span>
            </div>
            <div className="h-1.5 bg-[#1e2a45] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${v}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
