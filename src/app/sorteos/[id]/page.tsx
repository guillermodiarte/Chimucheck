import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import { RaffleDetailPlayerView } from "@/components/player/raffles/RaffleDetailPlayerView";

export default async function PublicRaffleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (session?.user) {
    redirect(`/player/dashboard/raffles/${id}`);
  }

  const raffle = await db.raffle.findUnique({
    where: { id },
    include: {
      _count: {
        select: { entries: true },
      },
      prizes: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!raffle || raffle.status === "DRAFT") {
    notFound();
  }

  return (
    <div className="relative min-h-screen pt-44 pb-20 px-4 md:px-8">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yellow-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <RaffleDetailPlayerView
          raffle={{
            ...raffle,
            isEntered: false,
            myEntryDate: null,
          } as any}
          isLoggedIn={false}
        />
      </div>
    </div>
  );
}
