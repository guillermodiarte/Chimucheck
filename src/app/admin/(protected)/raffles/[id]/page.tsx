import { getRaffleWithParticipants } from "@/app/actions/raffles";
import { notFound } from "next/navigation";
import { RaffleDetailClient } from "@/components/admin/raffles/RaffleDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/prisma";

export default async function RaffleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raffle = await getRaffleWithParticipants(id);

  if (!raffle) {
    notFound();
  }

  // Get all approved & active players not in the raffle for the add-player panel
  const enrolledIds = raffle.entries.map((e) => e.playerId);
  const availablePlayers = await db.player.findMany({
    where: {
      id: { notIn: enrolledIds },
      registrationStatus: "APPROVED",
      active: true,
    },
    select: {
      id: true,
      alias: true,
      name: true,
      email: true,
      image: true,
    },
    orderBy: { alias: "asc" },
    take: 200,
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/raffles"
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Sorteos
        </Link>
      </div>

      <RaffleDetailClient
        raffle={raffle as any}
        availablePlayers={availablePlayers as any}
      />
    </div>
  );
}
