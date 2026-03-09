"use client";

import { useState } from "react";
import { updateSectionContent } from "@/app/actions/sections";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";

export function PlayerProfileBannerForm({ initialContent }: { initialContent: any }) {
  const [content, setContent] = useState(initialContent || { imageUrl: "", backgroundUrl: "" });
  const [loading, setLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFileBackground, setPendingFileBackground] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let finalContent = { ...content };

    if (pendingFile) {
      const formData = new FormData();
      formData.append("file", pendingFile);
      formData.append("folder", "fondos");

      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await uploadRes.json();

        if (uploadRes.ok && data.success) {
          finalContent.imageUrl = data.url;
        } else {
          toast.error("Error al subir la imagen del banner");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al subir imagen del banner");
        setLoading(false);
        return;
      }
    }

    if (pendingFileBackground) {
      const formDataBg = new FormData();
      formDataBg.append("file", pendingFileBackground);
      formDataBg.append("folder", "fondos");

      try {
        const uploadBgRes = await fetch("/api/upload", {
          method: "POST",
          body: formDataBg,
        });
        const dataBg = await uploadBgRes.json();

        if (uploadBgRes.ok && dataBg.success) {
          finalContent.backgroundUrl = dataBg.url;
        } else {
          toast.error("Error al subir la imagen de fondo");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al subir imagen de fondo");
        setLoading(false);
        return;
      }
    }

    const res = await updateSectionContent("player_profile_banner", finalContent);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      setPendingFile(null);
      setPendingFileBackground(null);
      if (pendingFile || pendingFileBackground) setContent(finalContent);
    } else {
      toast.error(res.message);
    }
  };

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    const url = URL.createObjectURL(file);
    setContent({ ...content, imageUrl: url });
  };

  const handleBackgroundFileSelect = (file: File) => {
    setPendingFileBackground(file);
    const url = URL.createObjectURL(file);
    setContent({ ...content, backgroundUrl: url });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-gray-900 p-6 rounded-lg border border-gray-800 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Perfil Jugador</h3>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-4 flex flex-col h-full">
          <Label className="text-white">Imagen del Banner</Label>
          <div className="flex flex-col items-center justify-between gap-6 bg-black/30 p-6 rounded-xl border border-gray-800 flex-1">

            <div className="relative group w-full h-40 flex items-center justify-center bg-black/50 rounded-lg border border-gray-700 overflow-hidden">
              {content.imageUrl ? (
                <>
                  <img src={content.imageUrl} alt="Preview" className="w-full h-full object-cover transition-opacity group-hover:opacity-50" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm">
                    <LocalImageUpload
                      onFileSelect={handleFileSelect}
                      onUrlSelect={(url) => {
                        setContent({ ...content, imageUrl: url });
                        setPendingFile(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContent({ ...content, imageUrl: "" });
                        setPendingFile(null);
                      }}
                      className="mt-2 text-red-400 hover:text-red-300 text-xs flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded border border-red-900/50 hover:bg-red-900/40 transition-colors"
                      title="Eliminar imagen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                      Eliminar
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full p-4">
                  <LocalImageUpload
                    onFileSelect={handleFileSelect}
                    onUrlSelect={(url) => {
                      setContent({ ...content, imageUrl: url });
                      setPendingFile(null);
                    }}
                  />
                  <span className="text-gray-500 text-xs mt-2">Subir Banner</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 text-center">Recomendamos usar un formato JPG/WEBP panorámico ancho (Ej. 1920x400).</p>
          </div>
        </div>

        <div className="space-y-4 flex flex-col h-full">
          <Label className="text-white">Fondo de Pantalla</Label>
          <div className="flex flex-col items-center justify-between gap-6 bg-black/30 p-6 rounded-xl border border-gray-800 flex-1">

            <div className="relative group w-full h-40 flex items-center justify-center bg-black/50 rounded-lg border border-gray-700 overflow-hidden">
              {content.backgroundUrl ? (
                <>
                  <img src={content.backgroundUrl} alt="Preview Fondo" className="w-full h-full object-cover transition-opacity group-hover:opacity-50" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm">
                    <LocalImageUpload
                      onFileSelect={handleBackgroundFileSelect}
                      onUrlSelect={(url) => {
                        setContent({ ...content, backgroundUrl: url });
                        setPendingFileBackground(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContent({ ...content, backgroundUrl: "" });
                        setPendingFileBackground(null);
                      }}
                      className="mt-2 text-red-400 hover:text-red-300 text-xs flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded border border-red-900/50 hover:bg-red-900/40 transition-colors"
                      title="Eliminar fondo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                      Eliminar
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full p-4">
                  <LocalImageUpload
                    onFileSelect={handleBackgroundFileSelect}
                    onUrlSelect={(url) => {
                      setContent({ ...content, backgroundUrl: url });
                      setPendingFileBackground(null);
                    }}
                  />
                  <span className="text-gray-500 text-xs mt-2">Subir Fondo Tenue</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 text-center">Recomendamos usar un fondo muy oscuro de 1920x1080 (Ej. Wallpaper).</p>

          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-secondary text-black hover:bg-yellow-400">
        {loading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
}
