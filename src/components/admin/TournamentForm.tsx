
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

const TournamentSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Fecha inválida",
  }),
  game: z.string().optional(),
  format: z.string().optional(),
  maxPlayers: z.coerce.number().min(2, "Mínimo 2 jugadores"),
  prizePool: z.string().optional(),
  image: z.string().optional(),
  active: z.boolean().default(true),
});

interface TournamentFormProps {
  tournament?: any; // Replace with proper type from Prisma
}

export default function TournamentForm({ tournament }: TournamentFormProps) {
  const router = useRouter();
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof TournamentSchema>>({
    resolver: zodResolver(TournamentSchema) as any,
    defaultValues: {
      name: tournament?.name || "",
      description: tournament?.description || "",
      date: tournament?.date ? new Date(tournament.date).toISOString().slice(0, 16) : "",
      game: tournament?.game || "",
      format: tournament?.format || "",
      maxPlayers: tournament?.maxPlayers || 16,
      prizePool: tournament?.prizePool || "",
      image: tournament?.image || "",
      active: tournament?.active ?? true,
    },
  });

  async function onSubmit(data: z.infer<typeof TournamentSchema>) {
    let imageUrl = data.image;

    // Handle Image Upload if there is a pending file
    if (pendingFile) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", pendingFile);

      try {
        const toastId = toast.loading("Subiendo imagen...");
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
          toast.error(uploadResult.message || "Error al subir imagen");
          return;
        }
      } catch (error) {
        toast.dismiss();
        toast.error("Error de red al subir imagen");
        return;
      }
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      // If we have a new image URL (uploaded or from library), use it.
      // Otherwise use the value from the form (which might be the blob URL if not handled correctly, but we overwrite it here)
      if (key === "image") {
        formData.append(key, imageUrl || "");
      } else {
        formData.append(key, String(value));
      }
    });

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
  }

  return (
    <div className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        {tournament ? "Editar Torneo" : "Crear Nuevo Torneo"}
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="game"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Juego</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-gray-800 border-gray-700" placeholder="Ej: CS2" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formato</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-gray-800 border-gray-700" placeholder="Ej: 5v5" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imagen del Torneo</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {field.value && (
                      <div className="relative aspect-video w-full max-w-sm rounded-lg overflow-hidden border border-gray-700 group">
                        <img src={field.value} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange("");
                            setPendingFile(null);
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <LocalImageUpload
                        onFileSelect={(file) => {
                          setPendingFile(file);
                          const previewUrl = URL.createObjectURL(file);
                          field.onChange(previewUrl);
                        }}
                        className="w-auto"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-blue-600 text-white hover:bg-blue-700 border-none"
                        onClick={() => setIsMediaModalOpen(true)}
                      >
                        🖼️ Biblioteca
                      </Button>
                    </div>
                    <Input type="hidden" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <MediaSelectorModal
            open={isMediaModalOpen}
            onOpenChange={setIsMediaModalOpen}
            onSelect={(url) => {
              form.setValue("image", url);
              setPendingFile(null);
              setIsMediaModalOpen(false);
            }}
          />

          <Button type="submit" className="w-full bg-primary text-black hover:bg-yellow-400 font-bold">
            {tournament ? "Guardar Cambios" : "Crear Torneo"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
