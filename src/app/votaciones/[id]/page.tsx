import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { Calendar, Heart, ImageIcon, ArrowLeft, Instagram, Clock } from "lucide-react";
import Link from "next/link";
import { VotingContestClient } from "@/components/voting/VotingContestClient";
import { LoginCTABanner } from "@/components/voting/LoginCTA";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ entry?: string }>;
}

async function getContest(id: string, playerId?: string) {
  const now = new Date();

  const [contest, homeSection] = await Promise.all([
    db.votingContest.findUnique({ where: { id } }),
    db.siteSection.findUnique({ where: { key: "home_section" } }),
  ]);
  if (!contest) return null;

  const defaultLogoUrl =
    (homeSection?.content as any)?.logoUrl ||
    "/uploads/imagenes/logo-trasparente-1771101621599-1771772834629.webp";

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
    defaultLogoUrl,
  };
}

export default async function VotacionDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { entry } = (await searchParams) || {};
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

  const { contest, entries, defaultLogoUrl } = data;
  const isActive = contest.status === "ACTIVE";
  const isFinished = contest.status === "FINISHED";

  return (
    <div className="relative min-h-screen pt-28 md:pt-36 lg:pt-44 pb-20 px-4 md:px-8">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-0 w-[500px] h-[500px] bg-yellow-500/8 rounded-full blur-[180px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Back button */}
        <Link
          href="/votaciones"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a Votaciones
        </Link>

        {/* Interactive Contest Body (2-column hero: text on left, cover/podium on right + gallery) */}
        <VotingContestClient
          contest={contest}
          initialEntries={entries}
          initialSelectedEntryId={entry || null}
          isLoggedIn={!!playerId}
          isActive={isActive}
          isFinished={isFinished}
          currentUser={currentUser}
          defaultLogoUrl={defaultLogoUrl}
        />
      </div>
    </div>
  );
}


