import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtPct(v: number | null, decimals = 1): string {
  if (v === null || v === undefined) return "—";
  return `${(v * 100).toFixed(decimals)}%`;
}

export function fmtPrice(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtMarketCap(v: number | null): string {
  if (v === null || v === undefined) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toFixed(0)}`;
}

export function scoreColor(score: number): string {
  if (score >= 65) return "text-accent-green";
  if (score >= 45) return "text-accent-amber";
  return "text-accent-red";
}

export function scoreBg(score: number): string {
  if (score >= 65) return "bg-accent-green/10 border-accent-green/30";
  if (score >= 45) return "bg-accent-amber/10 border-accent-amber/30";
  return "bg-accent-red/10 border-accent-red/30";
}
