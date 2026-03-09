import GameForm from "@/components/admin/games/GameForm";

export default function CreateGamePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Agregar Nuevo Juego</h1>
        <p className="text-gray-400">
          Añade un juego al catálogo para poder seleccionarlo al crear un torneo.
        </p>
      </div>

      <GameForm />
    </div>
  );
}
