import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LiveDrawScreen } from "@/components/admin/raffles/LiveDrawScreen";
import { getRecentWinnerPlayerIds } from "@/app/actions/raffles";

export default async function RaffleLivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const raffle = await db.raffle.findUnique({
    where: { id },
    include: {
      prizes: {
        orderBy: { order: "asc" },
      },
      entries: {
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
    notFound();
  }

  const winnerIds = Array.from(
    new Set(
      [raffle.winnerId, ...(raffle.prizes?.map((p) => p.winnerId) || [])].filter(Boolean) as string[]
    )
  );

  const winnerPlayers =
    winnerIds.length > 0
      ? await db.player.findMany({
          where: { id: { in: winnerIds } },
          select: { id: true, name: true, alias: true },
        })
      : [];
  const winnerMap = new Map(winnerPlayers.map((p) => [p.id, p]));

  const rw = raffle.winnerId ? winnerMap.get(raffle.winnerId) : null;
  const resolvedRaffleWinner = rw?.name?.trim() || rw?.alias || raffle.winnerAlias;

  const prizes = raffle.prizes && raffle.prizes.length > 0
    ? raffle.prizes.map((p) => {
        const pw = p.winnerId ? winnerMap.get(p.winnerId) : null;
        return {
          ...p,
          winnerAlias: pw?.name?.trim() || pw?.alias || p.winnerAlias,
        };
      })
    : [
        {
          id: "legacy",
          title: raffle.prize,
          description: null,
          image: raffle.prizeImage,
          order: 1,
          winnerId: raffle.winnerId,
          winnerAlias: resolvedRaffleWinner,
          winnerImage: raffle.winnerImage,
        },
      ];

  const participants = raffle.entries.map((e) => ({
    id: e.player.id,
    alias: e.player.name?.trim() || e.player.alias || "Jugador",
    name: e.player.name?.trim() || null,
    image: e.player.image,
  }));

  const recentBlockedIds = await getRecentWinnerPlayerIds();

  return (
    <div className="w-full min-h-[92vh]">
      <LiveDrawScreen
        raffle={{
          id: raffle.id,
          title: raffle.title,
          prize: raffle.prize,
          prizeImage: raffle.prizeImage,
          status: raffle.status,
          winnerId: raffle.winnerId,
          winnerAlias: resolvedRaffleWinner,
          winnerImage: raffle.winnerImage,
          prizes: prizes as any,
        }}
        participants={participants}
        cooldownPlayerIds={recentBlockedIds}
      />
    </div>
  );
}
