import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/raffles - open raffles for player view
export async function GET() {
  const session = await auth();
  const playerId = session?.user?.id;

  const raffles = await db.raffle.findMany({
    where: {
      status: { in: ["ACTIVE", "DRAWING", "FINISHED"] },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { entries: true } },
      ...(playerId
        ? {
            entries: {
              where: { playerId },
              select: { id: true, enteredAt: true },
            },
          }
        : {}),
    },
  });

  const result = raffles.map((r: any) => ({
    ...r,
    isEntered: playerId ? (r.entries && r.entries.length > 0) : false,
    myEntryDate: playerId && r.entries?.[0]?.enteredAt ? r.entries[0].enteredAt : null,
    entries: undefined, // don't expose all entries to players
  }));

  return NextResponse.json({ raffles: result });
}
