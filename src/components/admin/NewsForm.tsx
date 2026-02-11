"use client";

import { useActionState } from "react";
import { createNews } from "@/app/actions/news";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/lib/uploadthing";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; // Added router for explicit redirect if needed

export function NewsForm() {
  const [imageUrl, setImageUrl] = useState("");
  const [state, formAction] = useActionState(createNews, null);
  const router = useRouter();

  return (
    <form action={formAction} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-white">Título</Label>
        <Input id="title" name="title" placeholder="Título de la noticia" className="bg-gray-800 border-gray-700 text-white" />
        {state?.errors?.title && <p className="text-red-500 text-sm">{state.errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content" className="text-white">Contenido</Label>
        <Textarea id="content" name="content" placeholder="Escribe el contenido aquí..." className="bg-gray-800 border-gray-700 text-white h-32" />
        {state?.errors?.content && <p className="text-red-500 text-sm">{state.errors.content}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-white">Imagen Destacada</Label>
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

        {!imageUrl && <p className="text-yellow-500 text-xs mt-1">Se recomienda añadir una imagen para destacar la noticia.</p>}
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="published" name="published" className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-secondary focus:ring-secondary" />
        <Label htmlFor="published" className="text-white cursor-pointer">Publicar inmediatamente</Label>
      </div>

      {state?.message && <p className="text-red-500">{state.message}</p>}

      <Button type="submit" className="w-full bg-secondary text-black hover:bg-yellow-400">
        Guardar Noticia
      </Button>
    </form>
  );
}
