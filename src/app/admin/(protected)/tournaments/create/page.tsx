import TournamentForm from "@/components/admin/TournamentForm";
import { getGames } from "@/app/actions/games";

export default async function CreateTournamentPage() {
  const result = await getGames();
  const gamesList = result.success ? result.games : [];

  return (
    <div className="space-y-6">
      <TournamentForm gamesCatalog={gamesList} />
    </div>
  );
}
