import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// GET /api/voting – list all public contests (active + finished)
export async function GET() {
  const now = new Date();

  // Auto-sync status based on dates
  // Mark DRAFT contests whose startDate has passed as ACTIVE
  await db.votingContest.updateMany({
    where: { status: "DRAFT", startDate: { lte: now } },
    data: { status: "ACTIVE" },
  });

  // Mark ACTIVE contests whose endDate has passed as FINISHED
  await db.votingContest.updateMany({
    where: { status: "ACTIVE", endDate: { lte: now } },
    data: { status: "FINISHED" },
  });

  const contests = await db.votingContest.findMany({
    where: { status: { in: ["ACTIVE", "FINISHED"] } },
    orderBy: { startDate: "desc" },
    include: {
      _count: { select: { entries: true } },
      entries: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { imageUrl: true },
      },
    },
  });

  return NextResponse.json({ contests });
}
