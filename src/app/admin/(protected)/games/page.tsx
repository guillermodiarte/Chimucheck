import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGames } from "@/app/actions/games";
import GamesTable from "@/components/admin/games/GamesTable";

export default async function GamesPage() {
  const result = await getGames();
  const games = (result.success && result.games) ? result.games : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Juegos</h1>
          <p className="text-gray-400">Catálogo de juegos disponibles para torneos.</p>
        </div>
        <Link href="/admin/games/create">
          <Button className="bg-primary text-black hover:bg-yellow-400 font-bold transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)]">
            <Plus className="mr-2 h-5 w-5" /> Nuevo Juego
          </Button>
        </Link>
      </div>

      <GamesTable games={games} />
    </div>
  );
}
