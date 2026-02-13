"use client";

import { useActionState, startTransition } from "react";
import { createBanner, updateBanner } from "@/app/actions/banners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";
import { useState } from "react";
import { toast } from "sonner";

interface BannerFormProps {
  initialData?: {
    id: string;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    link: string | null;
    active: boolean;
    order: number;
  } | null;
  defaultOrder?: number;
}

export function BannerForm({ initialData, defaultOrder = 0 }: BannerFormProps) {
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [customFilename, setCustomFilename] = useState("");
  const updateAction = initialData ? updateBanner.bind(null, initialData.id) : createBanner;
  const [state, formAction] = useActionState(updateAction, null);

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
    if (!title || title.trim().length === 0) {
      toast.error("El título es obligatorio");
      return;
    }

    if (pendingFile) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", pendingFile);
      if (customFilename) {
        uploadFormData.append("customName", `banner-${customFilename}`);
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
          placeholder="Título del banner"
          className="bg-gray-800 border-gray-700 text-white"
        />
        {(state as any)?.errors?.title && <p className="text-red-500 text-sm">{(state as any).errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle" className="text-white">Subtítulo (Opcional)</Label>
        <Input
          id="subtitle"
          name="subtitle"
          defaultValue={payload?.subtitle as string || initialData?.subtitle || ""}
          placeholder="Texto descriptivo"
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="link" className="text-white">Enlace (Opcional)</Label>
        <Input
          id="link"
          name="link"
          defaultValue={payload?.link as string || initialData?.link || ""}
          placeholder="/novedades/mi-noticia"
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">Imagen de Fondo</Label>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <div className="flex items-center gap-4">
            {imageUrl ? (
              <div className="relative group shrink-0">
                {imageUrl.endsWith(".mp4") || imageUrl.endsWith(".webm") || (pendingFile && pendingFile.type.startsWith("video/")) ? (
                  <video src={imageUrl} className="w-32 h-16 object-cover rounded border border-gray-700" autoPlay muted loop />
                ) : (
                  <img src={imageUrl} alt="Preview" className="w-32 h-16 object-cover rounded border border-gray-700" />
                )}
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
              <div className="text-gray-500 text-sm italic shrink-0 w-32">Sin imagen</div>
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
                <span className="text-xs text-gray-500">banner-</span>
                <Input
                  id="customFilename"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder="nombre-del-archivo"
                  className="h-8 text-xs bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <p className="text-[10px] text-gray-500">Se guardará como: banner-{customFilename || "..."}-{Date.now()}.ext</p>
            </div>
          )}

          <input type="hidden" name="imageUrl" value={imageUrl} />
        </div>

        {!imageUrl && <p className="text-yellow-500 text-xs mt-1">Debes subir una imagen o video antes de crear el banner.</p>}
        {(state as any)?.errors?.imageUrl && <p className="text-red-500 text-sm">{(state as any).errors.imageUrl}</p>}
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            name="active"
            defaultChecked={payload?.active !== undefined ? payload.active : (initialData?.active ?? true)}
            className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-secondary focus:ring-secondary"
          />
          <Label htmlFor="active" className="text-white cursor-pointer">Activo</Label>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="order" className="text-white">Orden:</Label>
          <Input
            type="number"
            id="order"
            name="order"
            defaultValue={(payload?.order as string) || initialData?.order || defaultOrder}
            className="w-20 bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>

      {(state as any)?.message && <p className="text-red-500">{(state as any).message}</p>}

      <Button
        type="submit"
        disabled={!imageUrl || imageUrl.length === 0}
        className="w-full bg-secondary text-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {initialData ? "Guardar Cambios" : "Crear Banner"}
      </Button>
    </form>
  );
}
