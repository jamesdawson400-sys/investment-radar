"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

interface Props {
  history: { date: string; close: number }[];
  ma50: number | null;
}

export default function PriceChart({ history, ma50 }: Props) {
  const data = useMemo(() => {
    if (!history || history.length === 0) return [];
    const ma50Window = 50;
    return history.map((d, i) => {
      const window = history.slice(Math.max(0, i - ma50Window + 1), i + 1);
      const avg = window.reduce((s, w) => s + w.close, 0) / window.length;
      return {
        date: d.date.slice(5), // MM-DD
        close: d.close,
        ma50: window.length >= 20 ? Math.round(avg * 100) / 100 : null,
      };
    });
  }, [history]);

  if (data.length === 0) return <div className="h-48 flex items-center justify-center text-slate-500 text-xs">No price data</div>;

  const min = Math.min(...data.map((d) => d.close));
  const max = Math.max(...data.map((d) => d.close));
  const pad = (max - min) * 0.05;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false}
          interval={Math.floor(data.length / 5)} />
        <YAxis domain={[min - pad, max + pad]} tick={{ fontSize: 9, fill: "#64748b" }}
          tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} width={45} />
        <Tooltip
          contentStyle={{ background: "#131929", border: "1px solid #1e2a45", borderRadius: 6, fontSize: 11 }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, ""]}
        />
        <Area type="monotone" dataKey="close" stroke="#00d4ff" strokeWidth={1.5}
          fill="url(#priceGrad)" dot={false} activeDot={{ r: 3, fill: "#00d4ff" }} />
        {ma50 && (
          <ReferenceLine y={ma50} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1}
            label={{ value: "50MA", position: "insideTopRight", fontSize: 9, fill: "#f59e0b" }} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
