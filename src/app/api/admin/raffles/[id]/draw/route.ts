import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { randomInt } from "crypto";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session) return false;
  return true;
}

// POST /api/admin/raffles/[id]/draw
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: raffleId } = await params;

  const raffle = await db.raffle.findUnique({
    where: { id: raffleId },
    include: {
      entries: {
        include: {
          player: {
            select: {
              id: true,
              alias: true,
              name: true,
              image: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!raffle) {
    return NextResponse.json({ error: "Sorteo no encontrado" }, { status: 404 });
  }

  if (raffle.entries.length === 0) {
    return NextResponse.json(
      { error: "No hay participantes en este sorteo" },
      { status: 400 }
    );
  }

  const winningIndex = randomInt(0, raffle.entries.length);
  const winningEntry = raffle.entries[winningIndex];
  const winnerPlayer = winningEntry.player;
  const winnerAlias = winnerPlayer.alias || winnerPlayer.name || "Jugador";
  const winnerImage = winnerPlayer.image || null;

  const updatedRaffle = await db.raffle.update({
    where: { id: raffleId },
    data: {
      winnerId: winnerPlayer.id,
      winnerAlias,
      winnerImage,
      status: "FINISHED",
    },
  });

  // Notification for winner
  try {
    await db.notification.create({
      data: {
        type: "RAFFLE_WINNER",
        title: "🎉 ¡Felicidades! Eres el ganador del sorteo",
        message: `¡Ganaste el premio "${raffle.prize}" en el sorteo "${raffle.title}"!`,
        data: JSON.stringify({
          raffleId: raffle.id,
          raffleTitle: raffle.title,
          prize: raffle.prize,
          playerId: winnerPlayer.id,
          alias: winnerAlias,
        }),
      },
    });
  } catch {}

  return NextResponse.json({
    success: true,
    winner: {
      id: winnerPlayer.id,
      alias: winnerAlias,
      name: winnerPlayer.name,
      image: winnerImage,
      email: winnerPlayer.email,
      winningIndex,
    },
    raffle: updatedRaffle,
  });
}
