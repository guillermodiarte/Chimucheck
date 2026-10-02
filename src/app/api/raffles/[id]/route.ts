import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/raffles/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const playerId = session?.user?.id;

  const raffle = await db.raffle.findUnique({
    where: { id },
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

  if (!raffle) {
    return NextResponse.json({ error: "Sorteo no encontrado" }, { status: 404 });
  }

  const isEntered = playerId ? (raffle.entries && raffle.entries.length > 0) : false;
  const myEntryDate = playerId && raffle.entries?.[0]?.enteredAt ? raffle.entries[0].enteredAt : null;

  return NextResponse.json({
    raffle: {
      ...raffle,
      entries: undefined, // Protect full participant list from being exposed
      isEntered,
      myEntryDate,
    },
  });
}
