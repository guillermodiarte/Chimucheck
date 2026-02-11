"use client";

import { useActionState } from "react";
import { createBanner } from "@/app/actions/banners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadButton } from "@/lib/uploadthing";
import { useState } from "react";
import { toast } from "sonner";

export function BannerForm() {
  const [imageUrl, setImageUrl] = useState("");
  const [state, formAction] = useActionState(createBanner, null);

  return (
    <form action={formAction} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-white">Título</Label>
        <Input id="title" name="title" placeholder="Título del banner" className="bg-gray-800 border-gray-700 text-white" />
        {state?.errors?.title && <p className="text-red-500 text-sm">{state.errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle" className="text-white">Subtítulo (Opcional)</Label>
        <Input id="subtitle" name="subtitle" placeholder="Texto descriptivo" className="bg-gray-800 border-gray-700 text-white" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="link" className="text-white">Enlace (Opcional)</Label>
        <Input id="link" name="link" placeholder="/novedades/mi-noticia" className="bg-gray-800 border-gray-700 text-white" />
      </div>

      <div className="space-y-2">
        <Label className="text-white">Imagen de Fondo</Label>
        <div className="flex items-center gap-4">
          {imageUrl ? (
            <div className="relative group">
              <img src={imageUrl} alt="Preview" className="w-32 h-16 object-cover rounded border border-gray-700" />
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
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              if (res && res[0]) {
                setImageUrl(res[0].url);
                toast.success("Imagen subida correctamente");
              }
            }}
            onUploadError={(error: Error) => {
              toast.error(`Error al subir: ${error.message}`);
            }}
            appearance={{
              button: "bg-secondary text-black hover:bg-yellow-400 after:bg-yellow-500",
              allowedContent: "text-gray-400"
            }}
          />
          <input type="hidden" name="imageUrl" value={imageUrl} />
        </div>
        {!imageUrl && <p className="text-yellow-500 text-xs mt-1">Debes subir una imagen antes de crear el banner.</p>}
        {state?.errors?.imageUrl && <p className="text-red-500 text-sm">{state.errors.imageUrl}</p>}
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="active" name="active" defaultChecked className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-secondary focus:ring-secondary" />
          <Label htmlFor="active" className="text-white cursor-pointer">Activo</Label>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="order" className="text-white">Orden:</Label>
          <Input type="number" id="order" name="order" defaultValue="0" className="w-20 bg-gray-800 border-gray-700 text-white" />
        </div>
      </div>

      {state?.message && <p className="text-red-500">{state.message}</p>}

      <Button
        type="submit"
        disabled={!imageUrl || imageUrl.length === 0}
        className="w-full bg-secondary text-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Crear Banner
      </Button>
    </form>
  );
}
