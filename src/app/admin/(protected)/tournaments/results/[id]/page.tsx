import { getTournamentById } from "@/app/actions/tournaments";
import { notFound } from "next/navigation";
import TournamentResultsForm from "@/components/admin/TournamentResultsForm";

export default async function TournamentResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await getTournamentById(id);

  if (!tournament) return notFound();

  // Parse existing data
  let winners: any[] = [];
  let photos: string[] = [];
  try {
    winners = typeof tournament.winners === "string" ? JSON.parse(tournament.winners) : (tournament.winners || []);
    if (!Array.isArray(winners)) winners = [];
  } catch { winners = []; }
  try {
    photos = typeof tournament.photos === "string" ? JSON.parse(tournament.photos) : (tournament.photos || []);
    if (!Array.isArray(photos)) photos = [];
  } catch { photos = []; }

  // Get registered players for winner selection
  const players = tournament.registrations.map((r: any) => ({
    id: r.player.id,
    alias: r.player.alias || r.player.name || r.player.email,
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Resultados del Torneo</h2>
        <p className="text-gray-400 mt-1">{tournament.name} — {new Date(tournament.date).toLocaleDateString()}</p>
      </div>

      <TournamentResultsForm
        tournamentId={tournament.id}
        players={players}
        initialWinners={winners}
        initialPhotos={photos}
      />
    </div>
  );
}
