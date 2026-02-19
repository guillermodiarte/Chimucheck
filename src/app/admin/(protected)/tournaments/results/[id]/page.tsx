import { db } from "@/lib/prisma";
import { ScoreRow } from "@/components/admin/ScoreRow";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TournamentResultsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TournamentResultsPage({ params }: TournamentResultsPageProps) {
  const resolvedParams = await params;
  const tournament = await db.tournament.findUnique({
    where: { id: resolvedParams.id },
    include: {
      registrations: {
        include: {
          player: true,
        },
        orderBy: {
          score: 'desc' // Order by score descending ideally, or maybe name? Let's do score.
        }
      },
    },
  });

  if (!tournament) return notFound();

  // Re-sort registrations by score desc to ensure leaderboard effect
  const sortedRegistrations = [...tournament.registrations].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/tournaments">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Resultados: {tournament.name}</h1>
          <p className="text-gray-400">Gestiona los puntajes en tiempo real. Los cambios se reflejarán en la pantalla pública.</p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Link href={`/live/${tournament.id}`} target="_blank">
          <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 gap-2">
            <ExternalLink className="w-4 h-4" />
            Ver Pantalla en Vivo
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {sortedRegistrations.length === 0 ? (
          <div className="p-12 text-center border border-white/10 rounded-lg bg-zinc-900/50">
            <p className="text-gray-500">No hay jugadores inscritos en este torneo.</p>
          </div>
        ) : (
          sortedRegistrations.map((reg) => (
            <ScoreRow
              key={`${reg.playerId}-${reg.score}`} // Key by score to force re-render on external update
              registration={reg}
              tournamentId={tournament.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
