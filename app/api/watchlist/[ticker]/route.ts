import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase();
  await prisma.watchlist.updateMany({
    where: { ticker },
    data: { active: 0 },
  });
  return NextResponse.json({ ok: true });
}
