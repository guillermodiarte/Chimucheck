import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ChallengeLiveScoreTable } from "@/components/admin/ChallengeLiveScoreTable";
import type { ChallengeLivePlayer } from "@/components/admin/ChallengeLiveScoreTable";

export default async function AdminLiveChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [challenge, allPlayers] = await Promise.all([
    db.challenge.findUnique({
      where: { id },
      include: {
        registrations: {
          include: { player: true },
          orderBy: { registeredAt: "asc" },
        },
      },
    }),
    db.player.findMany({
      select: { id: true, name: true, alias: true, image: true },
      orderBy: { alias: "asc" },
    }),
  ]);

  if (!challenge) return notFound();

  const registeredPlayerIds = new Set(challenge.registrations.map((r: any) => r.playerId));
  const availablePlayers = allPlayers.filter((p) => !registeredPlayerIds.has(p.id));

  const initialPlayers: ChallengeLivePlayer[] = challenge.registrations.map((r: any) => ({
    id: r.playerId,
    name: r.player?.name || "",
    alias: r.player?.alias || r.player?.name || "Sin Nombre",
    image: r.player?.image || "",
    score: Number(r.score) || 0,
    timesPlayed: Number(r.timesPlayed) || 0,
    lastPlayedAt: r.lastPlayedAt ? new Date(r.lastPlayedAt).toISOString() : null,
    registeredAt: r.registeredAt ? new Date(r.registeredAt).toISOString() : new Date().toISOString(),
    isAbsent: Boolean(r.isAbsent),
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          Panel de Desafío: <span className="text-primary">{challenge.name}</span>
        </h1>
        <p className="text-gray-400">
          Gestiona las partidas en tiempo real. Al ajustar los puntos de un jugador se incrementa automáticamente su cantidad de jugadas y rota al final de la cola según el criterio de turnos.
        </p>
      </div>

      <ChallengeLiveScoreTable
        challengeId={challenge.id}
        challengeName={challenge.name}
        initialStatus={challenge.status}
        initialPlayers={initialPlayers}
        prizePool={challenge.prizePool || undefined}
        availablePlayers={availablePlayers}
      />
    </div>
  );
}

