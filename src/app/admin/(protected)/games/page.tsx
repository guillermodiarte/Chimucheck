import Link from "next/link";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGames, deleteGame } from "@/app/actions/games";
import { Badge } from "@/components/ui/badge";
import DeleteGameButton from "@/components/admin/games/DeleteGameButton";

export default async function GamesPage() {
  const result = await getGames();
  const games = result.success ? result.games : [];

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

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-black/40 text-gray-400 text-sm">
                <th className="p-4 font-medium">Juego</th>
                <th className="p-4 font-medium">Categoría</th>
                <th className="p-4 font-medium text-center">Imágenes</th>
                <th className="p-4 font-medium text-center">Torneos Asoc.</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {games && games.length > 0 ? (
                games.map((game: any) => {
                  let imagesCount = 0;
                  try {
                    const parsed = JSON.parse(game.images || "[]");
                    imagesCount = Array.isArray(parsed) ? parsed.length : 0;
                  } catch (e) {
                    // ignore format errors
                  }

                  return (
                    <tr key={game.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold text-white">{game.name}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-700">
                          {game.categoryId}
                        </Badge>
                      </td>
                      <td className="p-4 text-center text-gray-400">{imagesCount}</td>
                      <td className="p-4 text-center text-gray-400">
                        {game._count?.tournaments || 0}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/games/${game.id}`}>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <DeleteGameButton id={game.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No hay juegos registrados. Haz clic en "Nuevo Juego" para comenzar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
