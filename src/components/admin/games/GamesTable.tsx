"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import DeleteGameButton from "@/components/admin/games/DeleteGameButton";
import { CATEGORIES } from "@/lib/mmr";

export default function GamesTable({ games }: { games: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || game.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nombre..."
            className="pl-10 bg-gray-900 border-gray-800 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-gray-900 border border-gray-800 text-white h-10 px-3 rounded-md w-full sm:w-64 focus:border-white/20 transition-all appearance-none"
        >
          <option value="ALL">Todas las Categorías</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
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
              {filteredGames && filteredGames.length > 0 ? (
                filteredGames.map((game: any) => {
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
                    No se encontraron juegos con esos filtros.
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
