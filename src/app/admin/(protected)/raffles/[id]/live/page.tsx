import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LiveDrawScreen } from "@/components/admin/raffles/LiveDrawScreen";

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

  const prizes = raffle.prizes && raffle.prizes.length > 0
    ? raffle.prizes
    : [
        {
          id: "legacy",
          title: raffle.prize,
          description: null,
          image: raffle.prizeImage,
          order: 1,
          winnerId: raffle.winnerId,
          winnerAlias: raffle.winnerAlias,
          winnerImage: raffle.winnerImage,
        },
      ];

  const participants = raffle.entries.map((e) => ({
    id: e.player.id,
    alias: e.player.alias || e.player.name || "Jugador",
    name: e.player.name,
    image: e.player.image,
  }));

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
          winnerAlias: raffle.winnerAlias,
          winnerImage: raffle.winnerImage,
          prizes: prizes as any,
        }}
        participants={participants}
      />
    </div>
  );
}
