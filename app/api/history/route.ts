export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const scans = await prisma.scan.findMany({
    orderBy: { id: "desc" },
    take: 20,
    include: {
      ideas: {
        orderBy: { score: "desc" },
      },
    },
  });
  return NextResponse.json(scans);
}
