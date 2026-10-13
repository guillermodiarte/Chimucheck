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
      prizes: { orderBy: { order: "asc" } },
      entries: {
        orderBy: { enteredAt: "asc" },
        include: {
          player: {
            select: {
              id: true,
              alias: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!raffle) {
    return NextResponse.json({ error: "Sorteo no encontrado" }, { status: 404 });
  }

  const isEntered = playerId ? raffle.entries.some((e) => e.playerId === playerId) : false;
  const myEntry = playerId ? raffle.entries.find((e) => e.playerId === playerId) : null;
  const myEntryDate = myEntry?.enteredAt || null;

  return NextResponse.json({
    raffle: {
      ...raffle,
      isEntered,
      myEntryDate,
    },
  });
}
