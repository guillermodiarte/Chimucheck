"use client";

import { useActionState, startTransition } from "react";
import { createEvent } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";
import { useState } from "react";
import { toast } from "sonner";

interface EventFormProps {
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    date: Date;
    location: string | null;
    imageUrl: string | null;
    active: boolean;
  } | null;
}

import { updateEvent } from "@/app/actions/events";

export function EventForm({ initialData }: EventFormProps) {
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [customFilename, setCustomFilename] = useState("");
  const updateAction = initialData ? updateEvent.bind(null, initialData.id) : createEvent;
  const [state, formAction] = useActionState(updateAction as any, { message: "", errors: {}, payload: null });

  // Sync state payload with local state
  const payload = (state as any)?.payload;
  if (payload?.imageUrl && payload.imageUrl !== imageUrl && !imageUrl && !pendingFile) {
    setImageUrl(payload.imageUrl);
  }

  // Helper to format date for input (YYYY-MM-DDTHH:mm)
  const formatDate = (date: Date | string) => {
    if (!date) return "";
    const d = new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    setImageUrl(URL.createObjectURL(file));
    // Default custom name from original filename (without extension)
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setCustomFilename(nameWithoutExt);
  };

  const handleSubmit = async (formData: FormData) => {
    // Client-side validation
    const name = formData.get("name") as string;
    const date = formData.get("date") as string;

    if (!name || name.trim().length === 0) {
      toast.error("El nombre del evento es obligatorio");
      return;
    }

    if (!date) {
      toast.error("La fecha y hora del evento son obligatorias");
      return;
    }

    if (pendingFile) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", pendingFile);
      if (customFilename) {
        uploadFormData.append("customName", `evento-${customFilename}`);
      }

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        const data = await response.json();

        if (response.ok && data.success) {
          formData.set("imageUrl", data.url);
        } else {
          toast.error(data.message || "Error al subir la imagen");
          return; // Stop submission
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Error al subir la imagen");
        return; // Stop submission
      }
    }

    startTransition(() => {
      // @ts-ignore
      formAction(formData);
    });
  };

  return (
    <form action={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">Nombre del Evento</Label>
        <Input
          id="name"
          name="name"
          defaultValue={(payload?.name as string) || initialData?.name}
          placeholder="Ej: Torneo de Catan"
          className="bg-gray-800 border-gray-700 text-white"
        />
        {(state as any)?.errors?.name && <p className="text-red-500 text-sm">{(state as any).errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-white">Fecha y Hora</Label>
          <Input
            type="datetime-local"
            id="date"
            name="date"
            defaultValue={(payload?.date as string) || (initialData?.date ? formatDate(initialData.date) : "")}
            className="bg-gray-800 border-gray-700 text-white block"
          />
          {(state as any)?.errors?.date && <p className="text-red-500 text-sm">{(state as any).errors.date}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="location" className="text-white">Ubicación</Label>
          <Input
            id="location"
            name="location"
            defaultValue={(payload?.location as string) || initialData?.location || ""}
            placeholder="Ej: Salón Principal"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-white">Descripción (Opcional)</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={(payload?.description as string) || initialData?.description || ""}
          placeholder="Detalles del evento..."
          className="bg-gray-800 border-gray-700 text-white h-24"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">Imagen del Evento</Label>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <div className="flex items-center gap-4">
            {imageUrl ? (
              <div className="relative group shrink-0">
                <img src={imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded border border-gray-700" />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("");
                    setPendingFile(null);
                    setCustomFilename("");
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar imagen"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </div>
            ) : (
              <div className="text-gray-500 text-sm italic shrink-0 w-24">Sin imagen</div>
            )}
            <LocalImageUpload
              onFileSelect={handleFileSelect}
              onUrlSelect={(url) => {
                setImageUrl(url);
                setPendingFile(null);
                setCustomFilename("");
              }}
            />
          </div>

          {pendingFile && (
            <div className="space-y-1">
              <Label htmlFor="customFilename" className="text-xs text-gray-400">Nombre del archivo (opcional)</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">evento-</span>
                <Input
                  id="customFilename"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder="nombre-del-archivo"
                  className="h-8 text-xs bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <p className="text-[10px] text-gray-500">Se guardará como: evento-{customFilename || "..."}-{Date.now()}.ext</p>
            </div>
          )}

          <input type="hidden" name="imageUrl" value={imageUrl} />
        </div>

        {!imageUrl && <p className="text-yellow-500 text-xs mt-1">Se recomienda subir una imagen para el evento.</p>}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="active"
          name="active"
          defaultChecked={payload?.active !== undefined ? payload.active : (initialData?.active ?? true)}
          className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-secondary focus:ring-secondary"
        />
        <Label htmlFor="active" className="text-white cursor-pointer">Evento Activo</Label>
      </div>

      {(state as any)?.message && <p className="text-red-500">{(state as any).message}</p>}

      <Button type="submit" className="w-full bg-secondary text-black hover:bg-yellow-400">
        {initialData ? "Guardar Cambios" : "Crear Evento"}
      </Button>
    </form>
  );
}
