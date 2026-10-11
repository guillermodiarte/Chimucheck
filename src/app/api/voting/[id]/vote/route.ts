import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@/auth";

type Params = { params: Promise<{ id: string }> };

// POST /api/voting/[id]/vote – toggle vote on an entry, strictly enforcing 1 vote per contest
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debés iniciar sesión para votar" },
      { status: 401 }
    );
  }

  const { id: contestId } = await params;
  const body = await req.json();
  const { entryId } = body;

  if (!entryId) {
    return NextResponse.json({ error: "entryId es requerido" }, { status: 400 });
  }

  // Verify contest is ACTIVE
  const contest = await db.votingContest.findUnique({ where: { id: contestId } });
  if (!contest)
    return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });

  const now = new Date();
  if (contest.status !== "ACTIVE" || contest.startDate > now || contest.endDate < now) {
    return NextResponse.json(
      { error: "La votación no está activa en este momento" },
      { status: 403 }
    );
  }

  // Verify entry belongs to this contest
  const entry = await db.votingEntry.findFirst({
    where: { id: entryId, contestId },
  });
  if (!entry)
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });

  const playerId = session.user.id;

  // Check if player has an existing vote in this contest
  const existingVote = await db.vote.findFirst({
    where: {
      playerId,
      entry: { contestId },
    },
    include: {
      entry: true,
    },
  });

  if (existingVote) {
    if (existingVote.entryId === entryId) {
      // Toggle off: removing vote on the same entry
      await db.vote.delete({ where: { id: existingVote.id } });
      return NextResponse.json({ voted: false, unvotedEntryId: entryId });
    } else {
      // Switch vote: remove old vote and assign to new entry atomically
      await db.$transaction([
        db.vote.delete({ where: { id: existingVote.id } }),
        db.vote.create({ data: { entryId, playerId } }),
      ]);
      return NextResponse.json({
        voted: true,
        switched: true,
        previousEntryId: existingVote.entryId,
        newEntryId: entryId,
      });
    }
  } else {
    // Brand new vote in this contest
    await db.vote.create({ data: { entryId, playerId } });
    return NextResponse.json({ voted: true, newEntryId: entryId });
  }
}
