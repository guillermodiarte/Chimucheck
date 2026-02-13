"use client";

import { useActionState } from "react";
import { updateNews, createNews } from "@/app/actions/news";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NewsFormProps {
  initialData?: {
    id: string;
    title: string;
    content: string;
    imageUrl: string | null;
    published: boolean;
    date: Date;
  } | null;
}

export function NewsForm({ initialData }: NewsFormProps) {
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const updateAction = initialData ? updateNews.bind(null, initialData.id) : createNews;

  // Define the state type explicitly to avoid TS errors
  const [state, formAction] = useActionState(updateAction as any, { message: "", errors: {}, payload: null });
  const router = useRouter();

  // Sync state payload with local state if error occurred and we have a payload
  const payload = (state as any)?.payload;
  if (payload?.imageUrl && payload.imageUrl !== imageUrl && !imageUrl) {
    setImageUrl(payload.imageUrl);
  }

  return (
    <form action={formAction} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-white">Título</Label>
        <Input
          id="title"
          name="title"
          defaultValue={payload?.title as string || initialData?.title}
          placeholder="Título de la noticia"
          className="bg-gray-800 border-gray-700 text-white"
        />
        {(state as any)?.errors?.title && <p className="text-red-500 text-sm">{(state as any).errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content" className="text-white">Contenido</Label>
        <Textarea
          id="content"
          name="content"
          defaultValue={payload?.content as string || initialData?.content}
          placeholder="Escribe el contenido aquí..."
          className="bg-gray-800 border-gray-700 text-white h-32"
        />
        {(state as any)?.errors?.content && <p className="text-red-500 text-sm">{(state as any).errors.content}</p>}
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



        {!imageUrl && <p className="text-yellow-500 text-xs mt-1">Se recomienda añadir una imagen para destacar la noticia.</p>}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="published"
          name="published"
          defaultChecked={payload?.published !== undefined ? payload.published : (initialData?.published ?? false)}
          className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-secondary focus:ring-secondary"
        />
        <Label htmlFor="published" className="text-white cursor-pointer">Publicar inmediatamente</Label>
      </div>

      {(state as any)?.message && <p className="text-red-500">{(state as any).message}</p>}

      <Button type="submit" className="w-full bg-secondary text-black hover:bg-yellow-400">
        {initialData ? "Guardar Cambios" : "Guardar Noticia"}
      </Button>
    </form>
  );
}
