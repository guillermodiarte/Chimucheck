"use client";

import { useState } from "react";
import { updateSectionContent } from "@/app/actions/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";

export function HomeSectionForm({ initialContent }: { initialContent: any }) {
  const [content, setContent] = useState(initialContent || { logoUrl: "" });
  const [loading, setLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let finalContent = { ...content };

    if (pendingFile) {
      const formData = new FormData();
      formData.append("file", pendingFile);

      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await uploadRes.json();

        if (uploadRes.ok && data.success) {
          finalContent.logoUrl = data.url;
        } else {
          toast.error("Error al subir la imagen");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al subir imagen");
        setLoading(false);
        return;
      }
    }

    const res = await updateSectionContent("home_section", finalContent);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      setPendingFile(null);
      if (pendingFile) setContent(finalContent);
    } else {
      toast.error(res.message);
    }
  };

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    const url = URL.createObjectURL(file);
    setContent({ ...content, logoUrl: url });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Editar "Inicio" (Configuración General)</h3>
      </div>

      <div className="space-y-4">
        <Label className="text-white">Logo y Texto del Navbar</Label>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-black/30 p-4 rounded-xl border border-gray-800">

          {/* Logo Image */}
          <div className="flex flex-col items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Imagen</span>
            <div className="relative group w-full md:w-48 h-32 flex items-center justify-center bg-black/50 rounded-lg border border-gray-700 overflow-hidden">
              {content.logoUrl ? (
                <>
                  <img src={content.logoUrl} alt="Preview" className="w-full h-full object-contain p-4 transition-opacity group-hover:opacity-50" />

                  {/* Overlay for upload */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm">
                    <LocalImageUpload
                      onFileSelect={handleFileSelect}
                      onUrlSelect={(url) => {
                        setContent({ ...content, logoUrl: url });
                        setPendingFile(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContent({ ...content, logoUrl: "" });
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
                      setContent({ ...content, logoUrl: url });
                      setPendingFile(null);
                    }}
                  />
                  <span className="text-gray-500 text-xs mt-2">Subir Logo</span>
                </div>
              )}
            </div>
          </div>

          {/* Logo Text */}
          <div className="flex-1 space-y-2 w-full">
            <Label className="text-gray-400 text-xs uppercase font-bold tracking-wider">Texto del Logo (Opcional)</Label>
            <Input
              placeholder="Ej: CHIMUCHECK"
              className="bg-gray-800 border-gray-700 text-white h-12 text-lg font-bold w-full"
              value={content.logoText || ""}
              onChange={(e) => setContent({ ...content, logoText: e.target.value })}
            />
            <p className="text-xs text-gray-500">Este texto aparecerá a la derecha del logo en la barra de navegación.</p>
          </div>

        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-secondary text-black hover:bg-yellow-400">
        {loading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
}
