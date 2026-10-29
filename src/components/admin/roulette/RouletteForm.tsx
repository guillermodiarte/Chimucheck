"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Gamepad2,
  Check,
  Search,
  Sparkles,
  Timer,
  Info,
  ArrowLeft,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRoulette, updateRoulette } from "@/app/actions/roulette";

interface GameOption {
  id: string;
  name: string;
  categoryId: string;
  images?: string | null;
}

interface RouletteFormProps {
  initialData?: {
    id?: string;
    title: string;
    description?: string | null;
    spinDuration: number;
    gameIds: string[];
  };
  allGames: GameOption[];
  isEditing?: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; color: string; border: string }> = {
  SHOOTER: { label: "Shooter", color: "bg-red-500/20 text-red-400", border: "border-red-500/30" },
  RACING: { label: "Racing", color: "bg-sky-500/20 text-sky-400", border: "border-sky-500/30" },
  KOMBAT: { label: "Kombat", color: "bg-amber-500/20 text-amber-400", border: "border-amber-500/30" },
  SPORTS: { label: "Sports", color: "bg-purple-500/20 text-purple-400", border: "border-purple-500/30" },
  BOARD_GAME: { label: "Juegos de Mesa", color: "bg-emerald-500/20 text-emerald-400", border: "border-emerald-500/30" },
  ARENA_MULTIGAMES: { label: "⚔️ Arena Multigames", color: "bg-yellow-500/20 text-yellow-400", border: "border-yellow-500/30" },
};

function getGameImage(imagesField?: string | null): string | null {
  if (!imagesField) return null;
  try {
    const parsed = JSON.parse(imagesField);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    if (typeof parsed === "string") return parsed;
  } catch {
    if (imagesField.startsWith("http") || imagesField.startsWith("/")) return imagesField;
  }
  return null;
}

export function RouletteForm({ initialData, allGames, isEditing = false }: RouletteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [spinDuration, setSpinDuration] = useState<number>(initialData?.spinDuration || 8);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>(initialData?.gameIds || []);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Toggle selection
  const toggleGame = (id: string) => {
    setSelectedGameIds((prev) =>
      prev.includes(id) ? prev.filter((gId) => gId !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = (ids: string[]) => {
    setSelectedGameIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const deselectAllFiltered = (ids: string[]) => {
    setSelectedGameIds((prev) => prev.filter((id) => !ids.includes(id)));
  };

  // Filter games
  const filteredGames = allGames.filter((game) => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || game.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredIds = filteredGames.map((g) => g.id);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Por favor ingresa un título para la ruleta.");
      return;
    }

    if (selectedGameIds.length < 2) {
      setErrorMessage("Debes seleccionar al menos 2 juegos para poder armar la ruleta.");
      return;
    }

    startTransition(async () => {
      if (isEditing && initialData?.id) {
        const res = await updateRoulette(initialData.id, {
          title,
          description,
          spinDuration,
          gameIds: selectedGameIds,
        });
        if (res.success) {
          router.push(`/admin/roulette/${initialData.id}`);
          router.refresh();
        } else {
          setErrorMessage(res.message || "Error al actualizar la ruleta");
        }
      } else {
        const res = await createRoulette({
          title,
          description,
          spinDuration,
          gameIds: selectedGameIds,
        });
        if (res.success && res.id) {
          router.push(`/admin/roulette/${res.id}`);
          router.refresh();
        } else {
          setErrorMessage(res.message || "Error al crear la ruleta");
        }
      }
    });
  };

  // Quick lookup for selected games in order
  const gamesMap = new Map(allGames.map((g) => [g.id, g]));
  const selectedGamesList = selectedGameIds
    .map((id) => gamesMap.get(id))
    .filter(Boolean) as GameOption[];

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <Link
            href="/admin/roulette"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Ruletas
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 shadow-lg shadow-purple-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </span>
            {isEditing ? "Editar Ruleta de Juegos" : "Nueva Ruleta de Juegos"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Configura los juegos seleccionados y la animación para mostrar en vivo en el evento.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/admin/roulette" className="w-full sm:w-auto">
            <Button
              type="button"
              className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 font-bold"
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending || selectedGameIds.length < 2 || !title.trim()}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 hover:from-purple-500 to-pink-600 hover:to-pink-500 text-white font-extrabold shadow-lg shadow-purple-500/25 px-6"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : isEditing ? (
              "Guardar Cambios"
            ) : (
              "Crear y Probar Ruleta"
            )}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-center gap-3">
          <Info className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Form Left, Selected Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: General Configuration (1 Col) */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Timer className="w-5 h-5 text-purple-400" />
              Configuración General
            </h2>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white font-semibold">
                Título de la Ruleta <span className="text-pink-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Ruleta Torneo Principal 2026"
                className="bg-gray-950/70 border-white/15 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/30"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white font-semibold">
                Descripción (Opcional)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Ruleta para el sorteo de juegos de los octavos de final..."
                rows={3}
                className="bg-gray-950/70 border-white/15 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/30 resize-none"
              />
            </div>

            {/* Spin Duration */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <Label htmlFor="spinDuration" className="text-white font-semibold flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-pink-400" />
                  Tiempo de Giro Automático
                </Label>
                <span className="px-2.5 py-1 rounded-lg bg-pink-500/20 border border-pink-500/40 text-pink-300 font-extrabold text-sm">
                  {spinDuration} seg
                </span>
              </div>
              <input
                id="spinDuration"
                type="range"
                min="3"
                max="25"
                step="1"
                value={spinDuration}
                onChange={(e) => setSpinDuration(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer h-2 bg-gray-800 rounded-lg"
              />
              <p className="text-xs text-gray-400 leading-relaxed">
                Duración del giro cuando se presiona el botón "Girar". En el evento también puedes agarrar la ruleta y lanzarla con tu propio impulso manual.
              </p>
            </div>
          </div>

          {/* Selected games summary list */}
          <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-pink-400" />
                Juegos en la Ruleta
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  selectedGameIds.length >= 2
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}
              >
                {selectedGameIds.length} {selectedGameIds.length === 1 ? "juego" : "juegos"}
              </span>
            </div>

            {selectedGamesList.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No hay juegos seleccionados aún. Marca al menos 2 juegos del catálogo a la derecha.
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {selectedGamesList.map((game, idx) => {
                  const img = getGameImage(game.images);
                  const cat = CATEGORY_MAP[game.categoryId];
                  return (
                    <div
                      key={game.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl bg-gray-950/60 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 text-center text-xs font-extrabold text-gray-400">
                          {idx + 1}
                        </span>
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10">
                          {img ? (
                            <Image
                              src={img}
                              alt={game.name}
                              fill
                              className="object-cover"
                              sizes="36px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Gamepad2 className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{game.name}</p>
                          <p className="text-[11px] text-gray-400">{cat?.label || game.categoryId}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleGame(game.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Quitar de la ruleta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Game Selector (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6 text-purple-400" />
                  Seleccionar Juegos del Catálogo
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Haz clic sobre las tarjetas para agregar o quitar juegos de la ruleta.
                </p>
              </div>

              {/* Quick Select / Deselect */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectAllFiltered(filteredIds)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-white border-white/10"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Seleccionar filtrados
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => deselectAllFiltered(filteredIds)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-white border-white/10"
                >
                  Deseleccionar
                </Button>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar juego por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-gray-950/70 border-white/15 text-white placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === "ALL"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "bg-gray-800/80 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Todos ({allGames.length})
                </button>
                {Object.entries(CATEGORY_MAP).map(([catKey, catVal]) => {
                  const count = allGames.filter((g) => g.categoryId === catKey).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setSelectedCategory(catKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        selectedCategory === catKey
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                          : "bg-gray-800/80 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {catVal.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Games Grid */}
            {filteredGames.length === 0 ? (
              <div className="text-center py-16 bg-gray-950/40 rounded-2xl border border-white/5">
                <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-300 font-bold">No se encontraron juegos</p>
                <p className="text-xs text-gray-500 mt-1">
                  Prueba cambiando la búsqueda o el filtro de categoría.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[640px] overflow-y-auto pr-1">
                {filteredGames.map((game) => {
                  const isSelected = selectedGameIds.includes(game.id);
                  const img = getGameImage(game.images);
                  const cat = CATEGORY_MAP[game.categoryId];

                  return (
                    <div
                      key={game.id}
                      onClick={() => toggleGame(game.id)}
                      className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 border text-left select-none ${
                        isSelected
                          ? "bg-gradient-to-b from-purple-950/70 to-gray-900 border-purple-500 shadow-lg shadow-purple-500/20 scale-[1.02]"
                          : "bg-gray-950/60 border-white/10 hover:border-white/30 hover:bg-gray-900/60"
                      }`}
                    >
                      {/* Cover Image */}
                      <div className="relative aspect-[4/3] w-full bg-gray-800 overflow-hidden">
                        {img ? (
                          <Image
                            src={img}
                            alt={game.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-gray-500">
                            <Gamepad2 className="w-8 h-8" />
                          </div>
                        )}

                        {/* Top Gradient Shadow */}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-black/60 pointer-events-none" />

                        {/* Selection Checkmark Badge */}
                        <div
                          className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                            isSelected
                              ? "bg-purple-600 text-white border-2 border-white"
                              : "bg-black/60 text-transparent border border-white/30 group-hover:border-white"
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                        </div>

                        {/* Category Tag */}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide border shadow-md bg-black/85 backdrop-blur-sm ${
                              cat ? cat.color : "text-gray-300"
                            } ${cat ? cat.border : "border-white/20"}`}
                          >
                            {cat?.label || game.categoryId}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3 flex flex-col justify-between flex-1">
                        <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors">
                          {game.name}
                        </h3>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span
                            className={
                              isSelected ? "text-purple-400 font-bold" : "text-gray-400"
                            }
                          >
                            {isSelected ? "Seleccionado" : "Click para agregar"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
