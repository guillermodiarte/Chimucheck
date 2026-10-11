import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { Calendar, Heart, ImageIcon, ArrowLeft, Instagram, Clock } from "lucide-react";
import Link from "next/link";
import { VotingGallery } from "@/components/voting/VotingGallery";
import { VotingPodium } from "@/components/voting/VotingPodium";
import { LoginCTABanner, GalleryLoginHint } from "@/components/voting/LoginCTA";

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

  const enrichedEntries = entries.map((e) => ({
    id: e.id,
    imageUrl: e.imageUrl,
    instagramAccount: e.instagramAccount,
    authorName: e.authorName,
    voteCount: e._count.votes,
    hasVoted: playerId ? ((e as any).votes?.length > 0) : false,
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

  const data = await getContest(id, playerId);
  if (!data) notFound();

  const { contest, entries, totalVotes } = data;
  const isActive = contest.status === "ACTIVE";
  const isFinished = contest.status === "FINISHED";

  // Top 3 sorted by vote count (for podium)
  const top3 = [...entries]
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, 3);

  // Remaining entries (rank 4+) for finished contests
  const restEntries = isFinished
    ? [...entries].sort((a, b) => b.voteCount - a.voteCount).slice(3)
    : entries;

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

        {/* ── FINISHED: Podium + Full ranking ── */}
        {isFinished && top3.length > 0 && (
          <div className="space-y-14">
            <VotingPodium top3={top3} />

            {/* Full ranking table */}
            {restEntries.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-300 uppercase tracking-wider">
                  Ranking completo
                </h3>
                <div className="space-y-3">
                  {restEntries.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 bg-zinc-900/60 border border-white/10 rounded-xl p-3"
                    >
                      <span className="text-gray-500 font-mono font-bold w-8 text-center">
                        {idx + 4}°
                      </span>
                      <img
                        src={entry.imageUrl}
                        alt={entry.authorName || "Imagen"}
                        className="w-12 h-12 object-cover rounded-lg border border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        {entry.instagramAccount && (
                          <p className="text-pink-400 text-xs font-bold flex items-center gap-1">
                            <Instagram className="w-3 h-3" />
                            {entry.instagramAccount}
                          </p>
                        )}
                        {entry.authorName && (
                          <p className="text-gray-300 text-sm">{entry.authorName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-red-400 font-bold">
                        <Heart className="w-4 h-4 fill-red-400" />
                        <span>{entry.voteCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery with static vote counts */}
            <div className="space-y-6 pt-4 border-t border-white/10">
              <h3 className="text-xl font-bold text-gray-300 uppercase tracking-wider">
                Todas las imágenes
              </h3>
              <VotingGallery
                contestId={contest.id}
                entries={entries}
                isLoggedIn={!!playerId}
                isActive={false}
              />
            </div>
          </div>
        )}

        {/* ── ACTIVE: Gallery with vote buttons ── */}
        {isActive && (
          <div className="space-y-6">
            {!playerId && <GalleryLoginHint />}
            <VotingGallery
              contestId={contest.id}
              entries={entries}
              isLoggedIn={!!playerId}
              isActive={true}
            />
          </div>
        )}

        {/* Empty state */}
        {entries.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <div className="text-5xl">📷</div>
            <p className="text-xl font-bold text-white">Próximamente</p>
            <p className="text-gray-400">
              Estamos cargando las imágenes de la comunidad. ¡Volvé pronto!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


