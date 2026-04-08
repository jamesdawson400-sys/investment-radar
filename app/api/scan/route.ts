export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds — requires Vercel Pro/Hobby allows up to 60s on edge
import { NextRequest, NextResponse } from "next/server";
import { fetchUniverse } from "@/lib/yahoo-finance";
import { scoreUniverse } from "@/lib/scoring";
import { applyFilters, sortResults, DEFAULT_UNIVERSE } from "@/lib/screening";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tickers: string[] = (body.tickers ?? DEFAULT_UNIVERSE).map((t: string) =>
      t.trim().toUpperCase()
    );
    const filters = {
      minMarketCapB: body.minMarketCapB ?? 0,
      maxVolPct: body.maxVolPct ?? 100,
      minScore: body.minScore ?? 0,
      sectors: body.sectors ?? [],
    };
    const sortKey = body.sortKey ?? "score";

    if (tickers.length === 0) {
      return NextResponse.json({ error: "No tickers provided" }, { status: 400 });
    }
    if (tickers.length > 50) {
      return NextResponse.json({ error: "Max 50 tickers per scan" }, { status: 400 });
    }

    // Fetch + score
    const raw = await fetchUniverse(tickers);
    const scored = scoreUniverse(raw);
    const filtered = applyFilters(scored, filters);
    const sorted = sortResults(filtered, sortKey);

    // Persist scan to DB
    const now = new Date().toISOString();
    const topScore = sorted[0]?.score ?? null;
    const avgRet12m =
      sorted.length > 0
        ? sorted.reduce((s, t) => s + (t.ret12m ?? 0), 0) / sorted.length
        : null;

    const scan = await prisma.scan.create({
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
    });

    return NextResponse.json({
      scanId: scan.id,
      scanDate: scan.scanDate,
      results: sorted.map((t) => ({
        ...t,
        priceHistory: t.priceHistory, // include full history for charts
      })),
      meta: {
        universeSize: tickers.length,
        filteredCount: sorted.length,
        topScore,
        avgRet12m,
      },
    });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
