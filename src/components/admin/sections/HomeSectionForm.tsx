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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateSectionContent("home_section", content);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Editar "Inicio" (Configuración General)</h3>
      </div>

      <div className="space-y-2">
        <Label className="text-white">Logo de la Página (Navbar)</Label>
        <div className="flex items-center gap-4">
          {content.logoUrl ? (
            <div className="relative group">
              <img src={content.logoUrl} alt="Preview" className="h-12 object-contain bg-black/50 p-1 rounded border border-gray-700" />
              <button
                type="button"
                onClick={() => setContent({ ...content, logoUrl: "" })}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Eliminar imagen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic">Sin logo seleccionado</div>
          )}
          <LocalImageUpload
            onUploadComplete={(url) => {
              setContent({ ...content, logoUrl: url });
            }}
            onUploadError={(error) => {
              toast.error(`Error al subir: ${error}`);
            }}
          />
        </div>
        <div className="pt-2">
          <Input
            placeholder="https://ejemplo.com/logo.png"
            className="bg-gray-800 border-gray-700 text-white mt-1 text-sm"
            value={content.logoUrl || ""}
            onChange={(e) => setContent({ ...content, logoUrl: e.target.value })}
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-secondary text-black hover:bg-yellow-400">
        {loading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
}
