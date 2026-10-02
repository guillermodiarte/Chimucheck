import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import { RaffleDetailPlayerView } from "@/components/player/raffles/RaffleDetailPlayerView";

export default async function PlayerRaffleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/player/login");
  }

  const { id } = await params;
  const playerId = session.user.id;

  const raffle = await db.raffle.findUnique({
    where: { id },
    include: {
      _count: {
        select: { entries: true },
      },
      prizes: {
        orderBy: { order: "asc" },
      },
      entries: playerId
        ? {
            where: { playerId },
            select: { id: true, enteredAt: true },
          }
        : false,
    },
  });

  if (!raffle || raffle.status === "DRAFT") {
    notFound();
  }

  const isEntered = playerId ? !!(raffle.entries && raffle.entries.length > 0) : false;
  const myEntryDate = playerId && raffle.entries?.[0]?.enteredAt ? raffle.entries[0].enteredAt : null;

  return (
    <div className="relative min-h-[calc(100vh-80px)] pt-6 pb-20 px-4 md:px-8">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yellow-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <div className="relative z-10">
        <RaffleDetailPlayerView
          raffle={{
            ...raffle,
            isEntered,
            myEntryDate,
          } as any}
          isLoggedIn={true}
        />
      </div>
    </div>
  );
}
