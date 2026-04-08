export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fetchUniverse } from "@/lib/yahoo-finance";
import { scoreUniverse } from "@/lib/scoring";
import { applyFilters, sortResults, DEFAULT_UNIVERSE } from "@/lib/screening";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const tickers: string[] = (body.tickers ?? DEFAULT_UNIVERSE).map((t: string) =>
    t.trim().toUpperCase()
  ).filter(Boolean);

  const filters = {
    minMarketCapB: body.minMarketCapB ?? 0,
    maxVolPct: body.maxVolPct ?? 100,
    minScore: body.minScore ?? 0,
    sectors: body.sectors ?? [],
  };
  const sortKey = body.sortKey ?? "score";

  if (tickers.length === 0)
    return NextResponse.json({ error: "No tickers provided" }, { status: 400 });
  if (tickers.length > 50)
    return NextResponse.json({ error: "Max 50 tickers per scan" }, { status: 400 });

  // Fetch market data — returns partial results, never throws
  let raw: Awaited<ReturnType<typeof fetchUniverse>> = [];
  try {
    raw = await fetchUniverse(tickers);
  } catch (err) {
    console.error("fetchUniverse error:", err);
  }

  if (raw.length === 0) {
    return NextResponse.json(
      { error: "Unable to fetch market data. Yahoo Finance may be temporarily unavailable — please try again in a moment." },
      { status: 503 }
    );
  }

  const scored = scoreUniverse(raw);
  const filtered = applyFilters(scored, filters);
  const sorted = sortResults(filtered, sortKey);

  const now = new Date().toISOString();
  const topScore = sorted[0]?.score ?? null;
  const avgRet12m = sorted.length > 0
    ? sorted.reduce((s, t) => s + (t.ret12m ?? 0), 0) / sorted.length
    : null;

  // Save to DB non-blocking — don't let a DB timeout kill the scan response
  prisma.scan.create({
    data: {
      scanDate: now,
      universeSize: tickers.length,
      topScore,
      avgRet12m,
      createdAt: now,
      ideas: {
        create: sorted.map((t) => ({
          ticker: t.ticker,
          name: t.name,
          sector: t.sector,
          score: t.score,
          momentumScore: t.momentumScore,
          qualityScore: t.qualityScore,
          valuationScore: t.valuationScore,
          trendScore: t.trendScore,
          price: t.price,
          marketCap: t.marketCap,
          ret1m: t.ret1m,
          ret3m: t.ret3m,
          ret12m: t.ret12m,
          realizedVol: t.realizedVol,
          peRatio: t.trailingPE ?? t.forwardPE,
          rationale: t.rationale,
          riskSummary: t.riskFlags.join(", "),
          createdAt: now,
        })),
      },
    },
    include: { ideas: true },
  }).catch((err) => console.error("DB save error (non-fatal):", err));

  return NextResponse.json({
    scanDate: now,
    results: sorted,
    meta: {
      universeSize: tickers.length,
      fetchedCount: raw.length,
      filteredCount: sorted.length,
      topScore,
      avgRet12m,
    },
  });
}
