import { notFound } from "next/navigation";
import { getChallengeById } from "@/app/actions/challenges";
import { getGames } from "@/app/actions/games";
import { db } from "@/lib/prisma";
import ChallengeForm from "@/components/admin/ChallengeForm";

export default async function EditChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const challenge = await getChallengeById(id);

  if (!challenge) {
    notFound();
  }

  const [gamesResult, allPlayers] = await Promise.all([
    getGames(),
    db.player.findMany({
      select: { id: true, name: true, alias: true, image: true },
      orderBy: { alias: "asc" },
    }),
  ]);
  const gamesList = gamesResult.success ? gamesResult.games : [];

  return (
    <div className="space-y-6">
      <ChallengeForm
        challenge={challenge}
        gamesCatalog={gamesList}
        allPlayers={allPlayers}
      />
    </div>
  );
}

