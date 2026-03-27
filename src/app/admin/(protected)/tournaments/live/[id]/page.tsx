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
      },
      // @ts-ignore
      teams: {
        include: { players: true },
      }
    }
  });

  if (!tournament) return notFound();

  let initialData: any[] = [];

  // @ts-ignore
  if (tournament.isTeamBased && tournament.teams) {
    // Generate scores map to read existing scores
    const playerScores: Record<string, number> = {};
    // @ts-ignore
    tournament.registrations.forEach((r: any) => {
      playerScores[r.playerId] = Number((r as any).score) || 0;
    });

    // @ts-ignore
    initialData = tournament.teams.map((team: any) => {
      // Calculate team score (we assume all members have the same score, or we take the max)
      const teamScore = team.players.length > 0 
        ? Math.max(...team.players.map((p: any) => playerScores[p.id] || 0))
        : 0;

      return {
        id: team.id,
        alias: team.name, // Team Name
        image: team.image || team.avatar || "", // Team image rather than player image
        score: teamScore,
        isTeam: true,
        teamPlayers: team.players.map((p: any) => ({
          id: p.id,
          alias: p.alias || p.name
        }))
      };
    });
  } else {
    // Individual mode
    // @ts-ignore
    initialData = tournament.registrations.map((r: any) => ({
      id: r.playerId,
      alias: r.player.alias || r.player.name || "Sin Nombre",
      image: r.player.image || "",
      score: Number((r as any).score) || 0,
      isTeam: false
    }));
  }

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

      <LiveScoreTable tournamentId={tournament.id} tournamentName={tournament.name} initialStatus={tournament.status} initialData={initialData} />
    </div>
  );
}
