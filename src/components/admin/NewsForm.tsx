"use client";

import { useActionState, startTransition } from "react";
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
    url?: string | null;
    published: boolean;
    date: Date;
  } | null;
}

export function NewsForm({ initialData }: NewsFormProps) {
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [customFilename, setCustomFilename] = useState("");
  const updateAction = initialData ? updateNews.bind(null, initialData.id) : createNews;

  // Define the state type explicitly to avoid TS errors
  const [state, formAction] = useActionState(updateAction as any, { message: "", errors: {}, payload: null });
  const router = useRouter();

  // Sync state payload with local state if error occurred and we have a payload
  const payload = (state as any)?.payload;
  if (payload?.imageUrl && payload.imageUrl !== imageUrl && !imageUrl && !pendingFile) {
    setImageUrl(payload.imageUrl);
  }

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    setImageUrl(URL.createObjectURL(file));
    // Default custom name from original filename (without extension)
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setCustomFilename(nameWithoutExt);
  };

  const handleSubmit = async (formData: FormData) => {
    // Client-side validation
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    if (!title || title.trim().length === 0) {
      toast.error("El título es obligatorio");
      return;
    }

    if (!content || content.trim().length < 10) {
      toast.error("El contenido debe tener al menos 10 caracteres");
      return;
    }

    if (pendingFile) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", pendingFile);
      if (customFilename) {
        uploadFormData.append("customName", `novedades-${customFilename}`);
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
        <Label htmlFor="url" className="text-white">URL Externa (Opcional)</Label>
        <Input
          id="url"
          name="url"
          defaultValue={payload?.url as string || initialData?.url || ""}
          placeholder="https://ejemplo.com/noticia"
          className="bg-gray-800 border-gray-700 text-white"
        />
        <p className="text-xs text-gray-500">Si se completa, la noticia redirigirá a este enlace.</p>
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
                <span className="text-xs text-gray-500">novedades-</span>
                <Input
                  id="customFilename"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder="nombre-del-archivo"
                  className="h-8 text-xs bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <p className="text-[10px] text-gray-500">Se guardará como: novedades-{customFilename || "..."}-{Date.now()}.ext</p>
            </div>
          )}

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
