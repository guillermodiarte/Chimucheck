import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/voting/[id] – full contest detail with entries and vote counts
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  const playerId = session?.user?.id;

  const now = new Date();

  // Auto-sync status
  const contest = await db.votingContest.findUnique({ where: { id } });
  if (!contest)
    return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });

  // Determine effective status
  let effectiveStatus = contest.status;
  if (effectiveStatus === "DRAFT" && contest.startDate <= now) {
    effectiveStatus = "ACTIVE";
    await db.votingContest.update({ where: { id }, data: { status: "ACTIVE" } });
  }
  if (effectiveStatus === "ACTIVE" && contest.endDate <= now) {
    effectiveStatus = "FINISHED";
    await db.votingContest.update({ where: { id }, data: { status: "FINISHED" } });
  }

  const entries = await db.votingEntry.findMany({
    where: { contestId: id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { votes: true } },
      ...(playerId
        ? {
            votes: {
              where: { playerId },
              select: { id: true },
            },
          }
        : {}),
    },
  });

  // Total votes across all entries
  const totalVotes = entries.reduce((acc, e) => acc + e._count.votes, 0);

  const enrichedEntries = entries.map((e) => ({
    id: e.id,
    imageUrl: e.imageUrl,
    instagramAccount: e.instagramAccount,
    authorName: e.authorName,
    createdAt: e.createdAt,
    voteCount: e._count.votes,
    hasVoted: playerId ? ((e as any).votes?.length > 0) : false,
  }));

  return NextResponse.json({
    contest: {
      ...contest,
      status: effectiveStatus,
    },
    entries: enrichedEntries,
    totalVotes,
    isLoggedIn: !!playerId,
  });
}
