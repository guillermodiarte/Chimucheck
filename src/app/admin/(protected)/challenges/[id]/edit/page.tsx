import { notFound } from "next/navigation";
import { getChallengeById } from "@/app/actions/challenges";
import { getGames } from "@/app/actions/games";
import ChallengeForm from "@/components/admin/ChallengeForm";

export default async function EditChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const challenge = await getChallengeById(id);

  if (!challenge) {
    notFound();
  }

  const gamesResult = await getGames();
  const gamesList = gamesResult.success ? gamesResult.games : [];

  return (
    <div className="space-y-6">
      <ChallengeForm challenge={challenge} gamesCatalog={gamesList} />
    </div>
  );
}

