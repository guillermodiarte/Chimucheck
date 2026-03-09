import { notFound } from "next/navigation";
import { getGameById } from "@/app/actions/games";
import GameForm from "@/components/admin/games/GameForm";

export default async function EditGamePage({ params }: { params: { id: string } }) {
  const result = await getGameById(params.id);

  if (!result.success || !result.game) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Editar Juego</h1>
        <p className="text-gray-400">Modifica los detalles del juego de tu catálogo.</p>
      </div>

      <GameForm game={result.game} />
    </div>
  );
}
