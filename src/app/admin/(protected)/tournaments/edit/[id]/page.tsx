import { notFound } from "next/navigation";
import { getTournamentById } from "@/app/actions/tournaments";
import { getGames } from "@/app/actions/games";
import TournamentForm from "@/components/admin/TournamentForm";

export default async function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await getTournamentById(id);

  if (!tournament) {
    notFound();
  }

  const gamesResult = await getGames();
  const gamesList = gamesResult.success ? gamesResult.games : [];

  return (
    <div className="space-y-6">
      <TournamentForm tournament={tournament} gamesCatalog={gamesList} />
    </div>
  );
}
