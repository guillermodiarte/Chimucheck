import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ResultsEditor } from "@/components/admin/ResultsEditor";
import { AdminTeamBuilder } from "@/components/admin/tournaments/AdminTeamBuilder";

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
          score: 'desc'
        }
      },
      teams: {
        include: {
          players: true
        }
      }
    },
  });

  if (!tournament) return notFound();

  // Re-sort registrations by score desc
  const sortedRegistrations = [...tournament.registrations].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/tournaments">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Creacion de Equipos: {tournament.name}</h1>
          <p className="text-gray-400">Gestiona los equipos de los jugadores.</p>
        </div>
      </div>

      {tournament.isTeamBased && (
        <AdminTeamBuilder
          tournamentId={tournament.id}
          teamSize={tournament.teamSize || 2}
          teams={JSON.parse(JSON.stringify(tournament.teams))}
          registrations={JSON.parse(JSON.stringify(tournament.registrations))}
        />
      )}

      {(!tournament.isTeamBased || tournament.status === "FINALIZADO") && (
        <ResultsEditor
          tournament={JSON.parse(JSON.stringify(tournament))}
          sortedRegistrations={JSON.parse(JSON.stringify(sortedRegistrations))}
        />
      )}
    </div>
  );
}
