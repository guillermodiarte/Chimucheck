import Link from "next/link";
import { Plus, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGames } from "@/app/actions/games";
import GamesTable from "@/components/admin/games/GamesTable";

export default async function GamesPage() {
  const result = await getGames();
  const games = (result.success && result.games) ? result.games : [];

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Gamepad2 className="w-8 h-8 text-primary" />
            Juegos
            <span className="text-xs font-mono font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-0.5 rounded-full ml-1">
              {games.length}
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Catálogo de juegos y portadas configurados para torneos.
          </p>
        </div>
        <Link href="/admin/games/create">
          <Button className="bg-primary text-black hover:bg-yellow-400 font-bold transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)] h-10 px-4 rounded-xl flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nuevo Juego
          </Button>
        </Link>
      </div>

      <GamesTable games={games} />
    </div>
  );
}
