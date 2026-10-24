
import { getPlayers } from "@/app/actions/players";
import { PlayerActions } from "@/components/admin/PlayerActions";
import { PlayersTableClient } from "@/components/admin/PlayersTableClient";

export default async function AdminPlayersPage() {
  const players = await getPlayers();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Jugadores</h2>
          <p className="text-gray-400">Gestión de usuarios registrados en la plataforma.</p>
        </div>
        <div>
          <PlayerActions />
        </div>
      </div>

      {/* @ts-ignore */}
      <PlayersTableClient players={players as any} />
    </div>
  );
}
