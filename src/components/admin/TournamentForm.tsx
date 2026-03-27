
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { createTournament, updateTournament, unregisterPlayer } from "@/app/actions/tournaments";
import { CATEGORIES, RANK_TIERS } from "@/lib/mmr";
import { LocalImageUpload } from "./LocalImageUpload";
import { MediaSelectorModal } from "./MediaSelectorModal";
import { Plus, X, Gamepad2, Users, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- Types ---
type GameEntry = {
  name: string;
  image: string;
  format: string;
  gameId?: string;
  pendingFile?: File | null;
};

// --- Zod Schema (without games, handled separately) ---
const TournamentSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Fecha inválida",
  }),
  maxPlayers: z.coerce.number().min(2, "Mínimo 2 jugadores"),
  active: z.boolean().default(true),
  isRestricted: z.boolean().default(false),
  category: z.string().default("SHOOTER"),
  requiredRank: z.string().default("AMATEUR"),
  isTeamBased: z.boolean().default(false),
  teamSize: z.coerce.number().optional().nullable(),
});

interface TournamentFormProps {
  tournament?: any;
  gamesCatalog?: any[];
}

export default function TournamentForm({ tournament, gamesCatalog = [] }: TournamentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryWarning, setShowCategoryWarning] = useState(false);
  const [pendingCategory, setPendingCategory] = useState("");
  const [playerToDelete, setPlayerToDelete] = useState<{ id: string; name: string } | null>(null);

  // --- Games state ---
  const existingGames: GameEntry[] = (() => {
    if (tournament?.games) {
      const parsed = typeof tournament.games === "string"
        ? JSON.parse(tournament.games)
        : tournament.games;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((g: any) => ({ name: g.name || "", image: g.image || "", format: g.format || "" }));
      }
    }
    // Fallback: if old single-game data exists
    if (tournament?.game) {
      return [{ name: tournament.game, image: tournament.image || "", format: tournament.format || "" }];
    }
    return [];
  })();

  const [games, setGames] = useState<GameEntry[]>(existingGames);
  const [selectedGameToAdd, setSelectedGameToAdd] = useState<string>("");

  // --- Prizes state ---
  const existingPrizes = (() => {
    if (tournament?.prizePool) {
      try {
        const parsed = JSON.parse(tournament.prizePool);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          return { first: parsed.first || "", second: parsed.second || "", third: parsed.third || "" };
        }
      } catch {
        // Legacy string value — treat as first place prize
        return { first: tournament.prizePool, second: "", third: "" };
      }
    }
    return { first: "", second: "", third: "" };
  })();
  const [prizes, setPrizes] = useState(existingPrizes);

  const form = useForm<z.infer<typeof TournamentSchema>>({
    resolver: zodResolver(TournamentSchema) as any,
    defaultValues: {
      name: tournament?.name || "",
      description: tournament?.description || "",
      date: tournament?.date ? (() => {
        const d = new Date(tournament.date);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      })() : "",
      maxPlayers: tournament?.maxPlayers || 16,
      active: tournament?.active ?? true,
      isRestricted: tournament?.isRestricted ?? false,
      category: tournament?.category || "SHOOTER",
      requiredRank: tournament?.requiredRank || "AMATEUR",
      isTeamBased: tournament?.isTeamBased ?? false,
      teamSize: tournament?.teamSize || null,
    },
  });

  const categoryWatch = form.watch("category");
  const filteredCatalog = gamesCatalog.filter((g) => {
    if (g.categoryId !== categoryWatch) return false;
    const isAlreadySelected = games.some(selected => selected.gameId === g.id || selected.name === g.name);
    return !isAlreadySelected;
  });

  // --- Game entry helpers ---
  function handleAddGameFromCatalog() {
    if (!selectedGameToAdd) return;
    const gameObj = gamesCatalog.find(g => g.id === selectedGameToAdd);
    if (!gameObj) return;

    let parsedImages = [];
    try { parsedImages = JSON.parse(gameObj.images); } catch { }
    const coverImage = Array.isArray(parsedImages) && parsedImages.length > 0 ? parsedImages[0] : "";

    setGames((prev) => [...prev, { name: gameObj.name, image: coverImage, format: "1vs1", gameId: gameObj.id }]);
    setSelectedGameToAdd("");
  }

  function removeGame(index: number) {
    setGames((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGameName(index: number, name: string) {
    setGames((prev) => prev.map((g, i) => (i === index ? { ...g, name } : g)));
  }

  function updateGameImage(index: number, image: string, pendingFile?: File | null) {
    setGames((prev) =>
      prev.map((g, i) =>
        i === index ? { ...g, image, pendingFile: pendingFile ?? g.pendingFile } : g
      )
    );
  }

  function updateGameFormat(index: number, format: string) {
    setGames((prev) => prev.map((g, i) => (i === index ? { ...g, format } : g)));
  }

  // --- Players helpers ---
  async function confirmRemovePlayer() {
    if (!playerToDelete) return;

    const toastId = toast.loading("Eliminando inscripción...");
    const result = await unregisterPlayer(tournament.id, playerToDelete.id);
    
    if (result.success) {
      toast.success(result.message, { id: toastId });
      router.refresh();
    } else {
      toast.error(result.message || "Error al eliminar jugador", { id: toastId });
    }
    setPlayerToDelete(null);
  }

  // --- Submit ---
  async function onSubmit(data: z.infer<typeof TournamentSchema>) {
    setIsSubmitting(true);

    try {
      // Upload pending images for each game
      const uploadedGames: { name: string; image: string; format: string }[] = [];

      for (const game of games) {
        if (!game.name.trim()) continue; // Skip empty entries

        let imageUrl = game.image;

        if (game.pendingFile) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", game.pendingFile);

          const toastId = toast.loading(`Subiendo imagen de ${game.name}...`);
          const response = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          });
          const uploadResult = await response.json();

          if (response.ok && uploadResult.success) {
            imageUrl = uploadResult.url;
            toast.dismiss(toastId);
          } else {
            toast.dismiss(toastId);
            toast.error(`Error al subir imagen de ${game.name}`);
            setIsSubmitting(false);
            return;
          }
        }

        uploadedGames.push({ name: game.name.trim(), image: imageUrl, format: game.format || "" });
      }

      // Build FormData
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("date", data.date);
      formData.append("maxPlayers", String(data.maxPlayers));
      // Build prizes JSON
      const prizesJson = JSON.stringify({
        first: prizes.first.trim(),
        second: prizes.second.trim(),
        third: prizes.third.trim(),
      });
      formData.append("prizePool", prizesJson);
      formData.append("active", String(data.active));
      formData.append("isRestricted", String(data.isRestricted));
      formData.append("category", data.category);
      formData.append("requiredRank", data.requiredRank);
      formData.append("isTeamBased", String(data.isTeamBased));
      if (data.isTeamBased && data.teamSize) {
        formData.append("teamSize", String(data.teamSize));
      }
      formData.append("games", JSON.stringify(uploadedGames));

      const result = tournament
        ? await updateTournament(tournament.id, null, formData)
        : await createTournament(null, formData);

      if (result?.success) {
        toast.success(result.message);
        router.push("/admin/tournaments");
        router.refresh();
      } else {
        toast.error(result?.message || "Error al guardar torneo");
      }
    } catch (error) {
      toast.error("Error inesperado al guardar");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        {tournament ? "Editar Torneo" : "Crear Nuevo Torneo"}
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Two-column layout: Info (left) + Games (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ===== LEFT COLUMN: Tournament Info ===== */}
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-2">Datos del Torneo</h3>

              {/* Tournament Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Torneo</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-gray-800 border-gray-700" placeholder="Ej: Copa ChimuCheck" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date + Max Players */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha y Hora</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" className="bg-gray-800 border-gray-700" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxPlayers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cupo Máximo</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" className="bg-gray-800 border-gray-700" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Teams & Team Size */}
              <div className="grid grid-cols-2 gap-4 bg-gray-800/30 p-3 rounded-lg border border-gray-700 items-center">
                <FormField
                  control={form.control}
                  name="isTeamBased"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </FormControl>
                      <FormLabel className="font-bold text-white cursor-pointer">
                        ¿Es torneo por equipos?
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {form.watch("isTeamBased") && (
                  <FormField
                    control={form.control}
                    name="teamSize"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel className="whitespace-nowrap text-xs text-gray-300">Jugadores por equ.</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min={2}
                              value={field.value || ""}
                              onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                              className="bg-gray-900 border-gray-600 h-8 w-16"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Category + Rank */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <FormControl>
                        <select
                          value={field.value}
                          onChange={(e) => {
                            if (games.length > 0) {
                              setPendingCategory(e.target.value);
                              setShowCategoryWarning(true);
                            } else {
                              field.onChange(e);
                            }
                          }}
                          className="w-full bg-gray-800 border border-gray-700 text-white h-10 px-3 rounded-md focus:border-white/20 transition-all appearance-none"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requiredRank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel Competitivo</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full bg-gray-800 border border-gray-700 text-white h-10 px-3 rounded-md focus:border-white/20 transition-all appearance-none"
                        >
                          <option value={RANK_TIERS.AMATEUR} className="bg-gray-900">Amateur</option>
                          <option value={RANK_TIERS.SEMI_PRO} className="bg-gray-900">Semi-Pro</option>
                          <option value={RANK_TIERS.PRO} className="bg-gray-900">Pro</option>
                          <option value={RANK_TIERS.ALL_VS_ALL} className="bg-gray-900">Todos vs Todos</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Prizes */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white">Premios</label>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    {prizes.second ? "🥇 Primer Puesto" : "🏆 Premio del Evento"}
                  </label>
                  <Input
                    value={prizes.first}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrizes((p) => ({
                        first: val,
                        second: val ? p.second : "",
                        third: val && p.second ? p.third : "",
                      }));
                    }}
                    className="bg-gray-800 border-gray-700"
                    placeholder="Ej: $100.000 + Skins"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">🥈 Segundo Puesto (opcional)</label>
                  <Input
                    value={prizes.second}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrizes((p) => ({ ...p, second: val, third: val ? p.third : "" }));
                    }}
                    disabled={!prizes.first}
                    className="bg-gray-800 border-gray-700 disabled:opacity-40"
                    placeholder={prizes.first ? "Ej: $50.000" : "Completá Primer Puesto primero"}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">🥉 Tercer Puesto (opcional)</label>
                  <Input
                    value={prizes.third}
                    onChange={(e) => setPrizes((p) => ({ ...p, third: e.target.value }))}
                    disabled={!prizes.first || !prizes.second}
                    className="bg-gray-800 border-gray-700 disabled:opacity-40"
                    placeholder={!prizes.first || !prizes.second ? "Completá Primer y Segundo Puesto" : "Ej: $25.000"}
                  />
                </div>
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="bg-gray-800 border-gray-700 min-h-[120px]" placeholder="Detalles del torneo..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ===== RIGHT COLUMN: Games ===== */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                  Juegos del Torneo
                </h3>
              </div>

              {/* Game Selector */}
              <div className="flex gap-2 items-center bg-gray-800/40 p-3 rounded-lg border border-gray-700">
                <select
                  value={selectedGameToAdd}
                  onChange={(e) => setSelectedGameToAdd(e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-700 text-white h-10 px-3 rounded-md focus:border-primary/50 transition-all"
                >
                  <option value="">Seleccionar del catálogo ({categoryWatch})...</option>
                  {filteredCatalog.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <Button
                  type="button"
                  onClick={handleAddGameFromCatalog}
                  disabled={!selectedGameToAdd}
                  className="bg-primary text-black hover:bg-yellow-400 font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Añadir
                </Button>
              </div>

              {games.length === 0 && (
                <div className="text-center py-8 bg-gray-800/50 rounded-lg border border-dashed border-gray-700">
                  <Gamepad2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No hay juegos agregados. Selecciona uno del catálogo.</p>
                </div>
              )}

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {games.map((game, index) => (
                  <div
                    key={index}
                    className="relative bg-gray-800/60 border border-gray-700 rounded-lg p-3 flex gap-4 items-center"
                  >
                    {/* Game image preview */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-700 bg-black flex-shrink-0">
                      {game.image ? (
                        <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600"><Gamepad2 size={24} /></div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-white text-lg leading-none">{game.name}</p>
                        <button
                          type="button"
                          onClick={() => removeGame(index)}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                          title="Eliminar juego"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Formato (ej. 1vs1, 5vs5, Solos)</label>
                        <Input
                          value={game.format}
                          onChange={(e) => updateGameFormat(index, e.target.value)}
                          className="bg-gray-900 border-gray-600 h-8 text-sm w-full max-w-[200px]"
                          placeholder="Formato"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== FULL-WIDTH BOTTOM ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active checkbox */}
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-800 p-4 h-full">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Torneo Activo
                    </FormLabel>
                    <p className="text-sm text-gray-400">
                      Si está desactivado, no aparecerá en la lista pública.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* isRestricted checkbox */}
            <FormField
              control={form.control}
              name="isRestricted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-800 p-4 bg-yellow-900/10 border-yellow-900/30 h-full">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-yellow-500 font-bold">
                      Torneo Restrictivo (Requiere Aprobación)
                    </FormLabel>
                    <p className="text-sm text-yellow-600/80">
                      Si se activa, los jugadores quedarán "Pendientes" y un Admin deberá aprobarlos manualmente desde el menú "Solicitudes".
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Registered Players List (Edit Mode Only) */}
          {tournament && tournament.registrations && tournament.registrations.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Jugadores Inscriptos ({tournament.registrations.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {tournament.registrations.map((reg: any) => (
                  <div key={reg.playerId} className="flex items-center justify-between bg-gray-800/40 border border-gray-700 p-3 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-black shrink-0 relative">
                         {reg.player?.image ? (
                           <img src={reg.player.image} alt={reg.player.alias || "Avatar"} className="object-cover w-full h-full" />
                         ) : (
                           <Users className="w-4 h-4 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                         )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{reg.player?.alias || reg.player?.name || "Sin nombre"}</p>
                      </div>
                    </div>
                    <Button 
                       type="button" 
                       variant="ghost" 
                       size="icon" 
                       onClick={() => setPlayerToDelete({ id: reg.playerId, name: reg.player?.alias || reg.player?.name || "Sin nombre" })}
                       className="text-gray-500 hover:text-red-400 shrink-0 h-8 w-8"
                       title="Eliminar inscripción"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-black hover:bg-yellow-400 font-bold disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : tournament ? "Guardar Cambios" : "Crear Torneo"}
          </Button>
        </form>
      </Form>

      <AlertDialog open={!!playerToDelete} onOpenChange={(open) => !open && setPlayerToDelete(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Inscripción?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              ¿Estás seguro de que deseas eliminar la inscripción de <strong className="text-white">{playerToDelete?.name}</strong>? Esta acción no se puede deshacer y el jugador será removido de su equipo (si lo tuviera).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-700 hover:bg-gray-800 text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={confirmRemovePlayer}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCategoryWarning} onOpenChange={setShowCategoryWarning}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desea cambiar la categoría?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Al cambiar de categoría se eliminarán los juegos que ya has añadido al torneo. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-700 hover:bg-gray-800 text-white">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                setGames([]);
                form.setValue("category", pendingCategory, { shouldValidate: true });
                setShowCategoryWarning(false);
              }}
            >
              Continuar y Eliminar Juegos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
