
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
import { createTournament, updateTournament } from "@/app/actions/tournaments";
import { LocalImageUpload } from "./LocalImageUpload";
import { MediaSelectorModal } from "./MediaSelectorModal";
import { Plus, X, Gamepad2 } from "lucide-react";

// --- Types ---
type GameEntry = {
  name: string;
  image: string;
  format: string;
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
  prizePool: z.string().optional(),
  active: z.boolean().default(true),
});

interface TournamentFormProps {
  tournament?: any;
}

export default function TournamentForm({ tournament }: TournamentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    return [{ name: "", image: "", format: "" }];
  })();

  const [games, setGames] = useState<GameEntry[]>(existingGames);
  const [mediaModalIndex, setMediaModalIndex] = useState<number | null>(null);

  const form = useForm<z.infer<typeof TournamentSchema>>({
    resolver: zodResolver(TournamentSchema) as any,
    defaultValues: {
      name: tournament?.name || "",
      description: tournament?.description || "",
      date: tournament?.date ? new Date(tournament.date).toISOString().slice(0, 16) : "",
      maxPlayers: tournament?.maxPlayers || 16,
      prizePool: tournament?.prizePool || "",
      active: tournament?.active ?? true,
    },
  });

  // --- Game entry helpers ---
  function addGame() {
    setGames((prev) => [...prev, { name: "", image: "", format: "" }]);
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
      formData.append("prizePool", data.prizePool || "");
      formData.append("active", String(data.active));
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
    <div className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        {tournament ? "Editar Torneo" : "Crear Nuevo Torneo"}
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Prize Pool */}
          <FormField
            control={form.control}
            name="prizePool"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Premios (Prize Pool)</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-gray-800 border-gray-700" placeholder="Ej: $100.000 + Skins" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea {...field} className="bg-gray-800 border-gray-700 min-h-[100px]" placeholder="Detalles del torneo..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ===== GAMES SECTION ===== */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-primary" />
                Juegos del Torneo
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-primary/50 text-primary hover:bg-primary/10"
                onClick={addGame}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar Juego
              </Button>
            </div>

            {games.length === 0 && (
              <div className="text-center py-8 bg-gray-800/50 rounded-lg border border-dashed border-gray-700">
                <Gamepad2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No hay juegos agregados. Haz click en &quot;Agregar Juego&quot;.</p>
              </div>
            )}

            {games.map((game, index) => (
              <div
                key={index}
                className="relative bg-gray-800/60 border border-gray-700 rounded-lg p-4 space-y-3"
              >
                {/* Remove button */}
                {games.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGame(index)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-red-400 transition-colors"
                    title="Eliminar juego"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Game number label */}
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Juego {index + 1}
                </p>

                {/* Game name + format */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input
                      value={game.name}
                      onChange={(e) => updateGameName(index, e.target.value)}
                      className="bg-gray-900 border-gray-600"
                      placeholder="Nombre del juego (ej: Fortnite, CS2...)"
                    />
                  </div>
                  <Input
                    value={game.format}
                    onChange={(e) => updateGameFormat(index, e.target.value)}
                    className="bg-gray-900 border-gray-600"
                    placeholder="Formato (ej: 1vs1, 2vs2)"
                  />
                </div>

                {/* Game image preview */}
                {game.image && (
                  <div className="relative aspect-video w-full max-w-xs rounded-lg overflow-hidden border border-gray-700 group">
                    <img src={game.image} alt={game.name || "Preview"} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => updateGameImage(index, "", null)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Image upload buttons */}
                <div className="flex gap-2">
                  <LocalImageUpload
                    onFileSelect={(file) => {
                      const previewUrl = URL.createObjectURL(file);
                      updateGameImage(index, previewUrl, file);
                    }}
                    className="w-auto"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-blue-600 text-white hover:bg-blue-700 border-none text-sm"
                    onClick={() => setMediaModalIndex(index)}
                  >
                    🖼️ Biblioteca
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Active checkbox */}
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-800 p-4">
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

          {/* Media modal for game images */}
          <MediaSelectorModal
            open={mediaModalIndex !== null}
            onOpenChange={(open) => { if (!open) setMediaModalIndex(null); }}
            onSelect={(url) => {
              if (mediaModalIndex !== null) {
                updateGameImage(mediaModalIndex, url, null);
                setMediaModalIndex(null);
              }
            }}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-black hover:bg-yellow-400 font-bold disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : tournament ? "Guardar Cambios" : "Crear Torneo"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
