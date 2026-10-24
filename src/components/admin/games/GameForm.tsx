"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { createGame, updateGame } from "@/app/actions/games";
import { CATEGORIES } from "@/lib/mmr";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";
import { X, ChevronDown, Loader2, Image as ImageIcon, Shield, Info } from "lucide-react";

const CATEGORY_DETAILS: Record<string, { label: string; desc: string }> = {
  SHOOTER: { label: "Disparos / Shooter", desc: "FPS, Battle Royale y puntería" },
  RACING: { label: "Carreras / Racing", desc: "Simuladores, arcade y conducción" },
  KOMBAT: { label: "Combate / Kombat", desc: "Peleas 1v1 y lucha" },
  SPORTS: { label: "Deportes / Sports", desc: "Fútbol, básquet y disciplinas deportivas" },
  BOARD_GAME: { label: "Juegos de Mesa", desc: "Cartas, estrategia y tablero" },
};

const GameSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  categoryId: z.string().min(1, "Categoría requerida"),
});

interface GameFormProps {
  game?: any;
}

export default function GameForm({ game }: GameFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse existing images JSON
  const existingImages = (() => {
    if (game?.images) {
      try {
        const parsed = JSON.parse(game.images);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })();

  const [imageUrl, setImageUrl] = useState<string>(existingImages[0] || "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof GameSchema>>({
    resolver: zodResolver(GameSchema),
    defaultValues: {
      name: game?.name || "",
      categoryId: game?.categoryId || "SHOOTER",
    },
  });

  async function onSubmit(data: z.infer<typeof GameSchema>) {
    setIsSubmitting(true);

    try {
      let finalImageUrl = imageUrl;

      // 1. Upload new image if file was selected
      if (pendingFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", pendingFile);
        uploadFormData.append("folder", "juegos");

        const toastId = toast.loading("Subiendo imagen...");
        const response = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });
        const uploadResult = await response.json();

        if (response.ok && uploadResult.success) {
          finalImageUrl = uploadResult.url;
          toast.dismiss(toastId);
        } else {
          toast.dismiss(toastId);
          toast.error("Error al subir la imagen");
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Wrap image in JSON array to match DB schema design
      const imagesJson = finalImageUrl ? JSON.stringify([finalImageUrl]) : "[]";

      // 3. Save Game
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("categoryId", data.categoryId);
      formData.append("images", imagesJson);

      const result = game
        ? await updateGame(game.id, null, formData)
        : await createGame(null, formData);

      if (result?.success) {
        toast.success(result.message);
        router.push("/admin/games");
        router.refresh();
      } else {
        toast.error(result?.message || "Error al guardar el juego");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Datos del Juego y Acciones (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                <Shield className="w-4 h-4 text-primary" />
                Información del Juego
              </h2>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200 text-sm font-semibold">
                      Nombre del Juego
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-black/50 border-gray-700 text-white h-11 px-3.5 focus:border-primary/60 focus:ring-1 focus:ring-primary/40 rounded-xl transition-all placeholder:text-gray-600"
                        placeholder="Ej: Dragon Ball Sparking Zero"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => {
                  const currentCat = CATEGORY_DETAILS[field.value];
                  return (
                    <FormItem>
                      <FormLabel className="text-gray-200 text-sm font-semibold">
                        Categoría Deportiva / Tipo
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <select
                            {...field}
                            className="w-full bg-black/50 border border-gray-700 text-white h-11 px-3.5 pr-10 rounded-xl focus:border-primary/60 focus:ring-1 focus:ring-primary/40 focus:outline-none transition-all appearance-none text-sm cursor-pointer"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat} className="bg-gray-900 text-white">
                                {CATEGORY_DETAILS[cat]?.label || cat}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </FormControl>
                      {currentCat && (
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span>{currentCat.desc}</span>
                        </p>
                      )}
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Tarjeta de Acciones */}
            <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-black hover:bg-yellow-400 font-bold h-11 text-sm disabled:opacity-50 transition-all rounded-xl shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando cambios...
                  </>
                ) : (
                  game ? "Guardar Cambios" : "Crear Juego"
                )}
              </Button>

              <button
                type="button"
                onClick={() => router.push("/admin/games")}
                disabled={isSubmitting}
                className="w-full h-11 px-6 text-sm font-bold rounded-xl bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                Cancelar
              </button>
            </div>
          </div>

          {/* Columna Derecha: Portada e Imagen Principal (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Portada del Juego
                </h2>
                <span className="text-xs text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded-full border border-gray-700">
                  Formato 16:9 recomendado
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {imageUrl || pendingFile ? (
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-gray-700/80 group bg-black shadow-2xl">
                    <img
                      src={pendingFile ? URL.createObjectURL(pendingFile) : imageUrl}
                      alt="Game preview"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                      <span className="text-xs text-gray-300 font-medium truncate max-w-[200px]">
                        {pendingFile ? pendingFile.name : "Imagen cargada"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl("");
                          setPendingFile(null);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Quitar Imagen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-gray-700/60 bg-black/40 p-4">
                    <LocalImageUpload
                      onFileSelect={(file) => setPendingFile(file)}
                      onUrlSelect={(url) => {
                        setImageUrl(url);
                        setPendingFile(null);
                      }}
                      defaultFolder="juegos"
                    />
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 leading-relaxed pt-2 border-t border-gray-800/60">
                Las nuevas imágenes subidas se guardarán automáticamente en la carpeta{" "}
                <span className="text-yellow-400 font-semibold">"Juegos"</span> de tu biblioteca multimedia para ser reutilizadas en torneos.
              </p>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
