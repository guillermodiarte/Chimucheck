"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Search, ChevronDown, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DeleteGameButton from "@/components/admin/games/DeleteGameButton";
import { CATEGORIES } from "@/lib/mmr";

const CATEGORY_STYLES: Record<string, { label: string; dot: string; border: string }> = {
  SHOOTER: { label: "Shooter", dot: "#ef4444", border: "border-red-500/40" },
  RACING: { label: "Racing", dot: "#38bdf8", border: "border-sky-500/40" },
  KOMBAT: { label: "Kombat", dot: "#f97316", border: "border-orange-500/40" },
  SPORTS: { label: "Sports", dot: "#c084fc", border: "border-purple-500/40" },
  BOARD_GAME: { label: "Juegos de Mesa", dot: "#34d399", border: "border-emerald-500/40" },
};

export default function GamesTable({ games }: { games: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || game.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search and Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <Input
            placeholder="Buscar juego por nombre..."
            className="pl-10 bg-gray-900/90 border-gray-800 text-white h-11 rounded-xl focus:border-primary/50 text-sm placeholder:text-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative sm:w-64 shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-gray-900/90 border border-gray-800 text-white h-11 px-3.5 pr-10 rounded-xl focus:border-primary/50 focus:outline-none transition-all appearance-none text-sm cursor-pointer"
          >
            <option value="ALL">Todas las Categorías</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-gray-900 text-white">
                {CATEGORY_STYLES[cat]?.label || cat}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Counter */}
        <div className="text-xs text-gray-400 px-1 shrink-0 self-center">
          {filteredGames.length === games.length
            ? `${games.length} juegos`
            : `${filteredGames.length} de ${games.length} juegos`}
        </div>
      </div>

      {/* Grid of Game Cards */}
      {filteredGames && filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
          {filteredGames.map((game: any) => {
            // Extract cover image
            let coverImage: string | null = null;
            if (game.images) {
              try {
                const parsed = JSON.parse(game.images);
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
                  coverImage = parsed[0];
                }
              } catch {
                // ignore format errors
              }
            }

            const catInfo = CATEGORY_STYLES[game.categoryId] || {
              label: game.categoryId,
              dot: "#eab308",
              border: "border-gray-700",
            };

            return (
              <div
                key={game.id}
                className="bg-gray-900/80 border border-gray-800 hover:border-gray-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group backdrop-blur-sm"
              >
                {/* Game Image Banner */}
                <div className="relative aspect-video w-full bg-black overflow-hidden">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={game.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-950 to-black flex flex-col items-center justify-center text-gray-600 gap-2 p-4">
                      <Gamepad2 className="w-10 h-10 opacity-30 text-primary" />
                      <span className="text-xs text-gray-500 font-medium">Sin portada</span>
                    </div>
                  )}

                  {/* Category Badge: High contrast solid black background with glowing indicator and pure white text */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/90 border border-white/20 text-white font-extrabold text-xs shadow-2xl tracking-wide backdrop-blur-md">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: catInfo.dot, boxShadow: `0 0 6px ${catInfo.dot}` }}
                      />
                      {catInfo.label}
                    </span>
                  </div>
                </div>

                {/* Card Content & Actions */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-gradient-to-b from-transparent to-black/30">
                  <div className="space-y-1">
                    <Link
                      href={`/admin/games/${game.id}`}
                      className="font-bold text-white text-base hover:text-primary transition-colors block truncate"
                      title={game.name}
                    >
                      {game.name}
                    </Link>

                    {/* Secondary category text */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: catInfo.dot }}
                      />
                      <span className="text-gray-300 font-medium">{catInfo.label}</span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-gray-800/80">
                    <Link href={`/admin/games/${game.id}`} className="flex-1 mr-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full justify-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800/80 h-8 rounded-lg border border-gray-800"
                      >
                        <Pencil className="w-3.5 h-3.5 text-primary" />
                        Editar
                      </Button>
                    </Link>

                    <DeleteGameButton id={game.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center space-y-3">
          <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto opacity-40" />
          <h3 className="text-base font-semibold text-white">No se encontraron juegos</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== "ALL"
              ? "No hay juegos que coincidan con los filtros aplicados. Probá modificando el término de búsqueda o la categoría."
              : "Todavía no cargaste ningún juego en el catálogo. ¡Creá el primero!"}
          </p>
          {(searchTerm || selectedCategory !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("ALL");
              }}
              className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 mt-2 text-xs"
            >
              Restablecer filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
