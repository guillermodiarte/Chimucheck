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
import { X } from "lucide-react";

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

  // We only support one main image for now for simplicity, though schema is JSON array
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
        uploadFormData.append("folder", "juegos"); // Force upload to 'juegos'

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

      // 2. Wrap image in JSON array to match DB schema design (future proofing for galleries)
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
    <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        {game ? "Editar Juego" : "Crear Nuevo Juego"}
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Nombre del Juego</FormLabel>
                <FormControl>
                  <Input {...field} className="bg-gray-800 border-gray-700" placeholder="Ej: Valorant" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Categoría Deportiva / Tipo</FormLabel>
                <FormControl>
                  <select
                    {...field}
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

          <div className="space-y-3">
            <FormLabel className="text-gray-300 block">Imagen Principal (Opcional)</FormLabel>

            {imageUrl || pendingFile ? (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-gray-700 group bg-black">
                <img
                  src={pendingFile ? URL.createObjectURL(pendingFile) : imageUrl}
                  alt="Game preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("");
                    setPendingFile(null);
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <LocalImageUpload
                onFileSelect={(file) => setPendingFile(file)}
                onUrlSelect={(url) => {
                  setImageUrl(url);
                  setPendingFile(null);
                }}
                defaultFolder="juegos"
              />
            )}
            <p className="text-xs text-gray-500">
              Las nuevas imágenes subidas se guardarán automáticamente en la carpeta "Juegos" de tu biblioteca.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-black hover:bg-yellow-400 font-bold disabled:opacity-50 mt-4"
          >
            {isSubmitting ? "Guardando..." : game ? "Guardar Cambios" : "Crear Juego"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
