import ChallengeForm from "@/components/admin/ChallengeForm";
import { getGames } from "@/app/actions/games";

export default async function CreateChallengePage() {
  const result = await getGames();
  const gamesList = result.success ? result.games : [];

  return (
    <div className="space-y-6">
      <ChallengeForm gamesCatalog={gamesList} />
    </div>
  );
}

