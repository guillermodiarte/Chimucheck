import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LiveScoreTable } from "@/components/admin/LiveScoreTable";

export default async function AdminLiveTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await db.tournament.findUnique({
    where: { id },
    include: {
      registrations: {
        include: { player: true },
      }
    }
  });

  if (!tournament) return notFound();

  const initialData = tournament.registrations.map(r => ({
    playerId: r.playerId,
    alias: r.player.alias || r.player.name || "Sin Nombre",
    image: r.player.image || "",
    score: Number((r as any).score) || 0
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          Panel en Vivo: <span className="text-primary">{tournament.name}</span>
        </h1>
        <p className="text-gray-400">
          Modifica los puntajes de los jugadores en tiempo real. Presiona Enter o quita el foco del input para guardar.
        </p>
      </div>

      <LiveScoreTable tournamentId={tournament.id} initialData={initialData} />
    </div>
  );
}
