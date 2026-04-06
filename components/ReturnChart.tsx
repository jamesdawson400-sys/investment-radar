"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import type { ScoredTicker } from "@/lib/scoring";

interface Props {
  results: ScoredTicker[];
}

export default function ReturnChart({ results }: Props) {
  const top10 = results.slice(0, 10);
  const data = top10.map((t) => ({
    ticker: t.ticker,
    "1M": t.ret1m !== null ? Math.round(t.ret1m * 1000) / 10 : null,
    "3M": t.ret3m !== null ? Math.round(t.ret3m * 1000) / 10 : null,
    "12M": t.ret12m !== null ? Math.round(t.ret12m * 1000) / 10 : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={2} barCategoryGap="20%">
        <XAxis dataKey="ticker" tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false}
          tickFormatter={(v) => `${v}%`} width={35} />
        <Tooltip
          contentStyle={{ background: "#131929", border: "1px solid #1e2a45", borderRadius: 6, fontSize: 11 }}
          formatter={(v: number, name: string) => [`${v?.toFixed(1)}%`, name]}
        />
        <ReferenceLine y={0} stroke="#1e2a45" />
        <Bar dataKey="1M" fill="#00d4ff" opacity={0.6} radius={[2, 2, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={(d["1M"] ?? 0) >= 0 ? "#00d4ff" : "#ef4444"} opacity={0.6} />
          ))}
        </Bar>
        <Bar dataKey="3M" fill="#10b981" opacity={0.7} radius={[2, 2, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={(d["3M"] ?? 0) >= 0 ? "#10b981" : "#ef4444"} opacity={0.7} />
          ))}
        </Bar>
        <Bar dataKey="12M" fill="#f59e0b" opacity={0.8} radius={[2, 2, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={(d["12M"] ?? 0) >= 0 ? "#f59e0b" : "#ef4444"} opacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
