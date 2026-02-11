"use client";

import { useActionState } from "react";
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
  } | null;
}

import { updateEvent } from "@/app/actions/events";

export function EventForm({ initialData }: EventFormProps) {
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const updateAction = initialData ? updateEvent.bind(null, initialData.id) : createEvent;
  const [state, formAction] = useActionState(updateAction as any, { message: "", errors: {}, payload: null });

  // Sync state payload with local state
  if (state?.payload?.imageUrl && state.payload.imageUrl !== imageUrl && !imageUrl) {
    setImageUrl(state.payload.imageUrl);
  }

  // Helper to format date for input (YYYY-MM-DDTHH:mm)
  const formatDate = (date: Date | string) => {
    if (!date) return "";
    const d = new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  return (
    <form action={formAction} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800">
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
        <div className="flex items-center gap-4">
          {imageUrl ? (
            <div className="relative group">
              <img src={imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded border border-gray-700" />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Eliminar imagen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic">Sin imagen seleccionada</div>
          )}
          <LocalImageUpload
            onUploadComplete={(url) => {
              setImageUrl(url);
            }}
            onUploadError={(error) => {
              toast.error(`Error al subir: ${error}`);
            }}
          />
          <input type="hidden" name="imageUrl" value={imageUrl} />
        </div>

        <div className="pt-2">
          <Label htmlFor="manualUrl" className="text-xs text-gray-500 uppercase tracking-wider">O usa una URL externa</Label>
          <Input
            id="manualUrl"
            placeholder="https://ejemplo.com/imagen.jpg"
            className="bg-gray-800 border-gray-700 text-white mt-1 text-sm"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        {!imageUrl && <p className="text-yellow-500 text-xs mt-1">Se recomienda subir una imagen para el evento.</p>}
      </div>

      {(state as any)?.message && <p className="text-red-500">{(state as any).message}</p>}

      <Button type="submit" className="w-full bg-secondary text-black hover:bg-yellow-400">
        {initialData ? "Guardar Cambios" : "Crear Evento"}
      </Button>
    </form>
  );
}
