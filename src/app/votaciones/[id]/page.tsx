import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { Calendar, Heart, ImageIcon, ArrowLeft, Instagram, Clock } from "lucide-react";
import Link from "next/link";
import { VotingContestClient } from "@/components/voting/VotingContestClient";
import { LoginCTABanner } from "@/components/voting/LoginCTA";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getContest(id: string, playerId?: string) {
  const now = new Date();

  const contest = await db.votingContest.findUnique({ where: { id } });
  if (!contest) return null;

  // Auto-sync status
  let status = contest.status;
  if (status === "DRAFT" && contest.startDate <= now) {
    status = "ACTIVE";
    await db.votingContest.update({ where: { id }, data: { status: "ACTIVE" } });
  }
  if (status === "ACTIVE" && contest.endDate <= now) {
    status = "FINISHED";
    await db.votingContest.update({ where: { id }, data: { status: "FINISHED" } });
  }

  const entries = await db.votingEntry.findMany({
    where: { contestId: id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { votes: true } },
      votes: {
        select: {
          id: true,
          playerId: true,
          createdAt: true,
          player: {
            select: {
              id: true,
              alias: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const enrichedEntries = entries.map((e) => ({
    id: e.id,
    imageUrl: e.imageUrl,
    instagramAccount: e.instagramAccount,
    authorName: e.authorName,
    voteCount: e._count.votes,
    hasVoted: playerId ? e.votes.some((v) => v.playerId === playerId) : false,
    voters: e.votes.map((v) => ({
      id: v.id,
      playerId: v.playerId,
      alias: v.player?.alias || null,
      name: v.player?.name || null,
      image: v.player?.image || null,
      createdAt: v.createdAt.toISOString(),
    })),
  }));

  return {
    contest: { ...contest, status },
    entries: enrichedEntries,
    totalVotes: enrichedEntries.reduce((acc, e) => acc + e.voteCount, 0),
  };
}

function formatDate(date: Date) {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCountdown(endDate: Date) {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  if (diff <= 0) return "Finalizado";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h restantes`;
  if (hours > 0) return `${hours}h ${minutes}m restantes`;
  return `${minutes}m restantes`;
}

export default async function VotacionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const playerId = session?.user?.id;

  const currentUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name || null,
        alias: (session.user as any).alias || null,
        image: (session.user as any).image || session.user.image || null,
      }
    : null;

  const data = await getContest(id, playerId);
  if (!data) notFound();

  const { contest, entries, totalVotes } = data;
  const isActive = contest.status === "ACTIVE";
  const isFinished = contest.status === "FINISHED";

  return (
    <div className="relative min-h-screen pt-44 pb-20 px-4 md:px-8">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-0 w-[500px] h-[500px] bg-yellow-500/8 rounded-full blur-[180px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-500">
        {/* Back button */}
        <Link
          href="/votaciones"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a Votaciones
        </Link>

        {/* Contest header */}
        <div className="space-y-4">
          {/* Status badge */}
          <div className="flex items-center gap-3 flex-wrap">
            {isActive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Votación Abierta
              </span>
            )}
            {isFinished && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                🏆 Finalizado
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {contest.title}
          </h1>

          {contest.description && (
            <p className="text-gray-300 text-base md:text-lg max-w-3xl leading-relaxed">
              {contest.description}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-6 flex-wrap text-sm text-gray-400 pt-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>Inició: {formatDate(contest.startDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              {isActive ? (
                <span className="text-yellow-400 font-semibold">
                  ⏱ {formatCountdown(contest.endDate)}
                </span>
              ) : (
                <span>Cerró: {formatDate(contest.endDate)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gray-500" />
              <span>{entries.length} imágenes</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
              <span className="text-red-400 font-bold">{totalVotes} votos en total</span>
            </div>
          </div>
        </div>

        {/* Login CTA for non-logged users during active contest */}
        {isActive && !playerId && <LoginCTABanner />}

        {/* Interactive Contest Body (Podium, Ranking, Gallery and Detail Modal) */}
        <VotingContestClient
          contest={contest}
          initialEntries={entries}
          isLoggedIn={!!playerId}
          isActive={isActive}
          isFinished={isFinished}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}


