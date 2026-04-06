import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.watchlist.findMany({
    where: { active: 1 },
    orderBy: { addedDate: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ticker, name, score } = body;
  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  const now = new Date().toISOString();
  const item = await prisma.watchlist.upsert({
    where: { ticker: ticker.toUpperCase() },
    update: { active: 1, addedScore: score ?? 0, addedDate: now },
    create: {
      ticker: ticker.toUpperCase(),
      name: name ?? ticker,
      addedDate: now,
      addedScore: score ?? 0,
      createdAt: now,
    },
  });
  return NextResponse.json(item);
}
