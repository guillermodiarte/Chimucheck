"use client";

import { useState } from "react";
import { updateSectionContent } from "@/app/actions/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";

// Normalizer: ensure imageUrl is populated if image exists
export function AboutSectionForm({ initialContent }: { initialContent: any }) {
  const [content, setContent] = useState(() => {
    const base = initialContent || { title: "", bio: "", instagram: "" };
    return {
      ...base,
      imageUrl: base.imageUrl || base.image || "",
    };
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateSectionContent("about_us", content);
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
        <h3 className="text-xl font-semibold text-white">Editar "Historia / Acerca de"</h3>
      </div>

      <div className="space-y-2">
        <Label className="text-white">Título</Label>
        <Input
          value={content.title || ""}
          onChange={(e) => setContent({ ...content, title: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">Biografía / Historia</Label>
        <Textarea
          value={content.bio || ""}
          onChange={(e) => setContent({ ...content, bio: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white h-48"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">Imagen de Perfil / Historia</Label>
        <div className="flex items-center gap-4">
          {content.imageUrl ? (
            <div className="relative group">
              <img src={content.imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded border border-gray-700" />
              <button
                type="button"
                onClick={() => setContent({ ...content, imageUrl: "" })}
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
              setContent({ ...content, imageUrl: url });
            }}
            onUploadError={(error) => {
              toast.error(`Error al subir: ${error}`);
            }}
          />
        </div>
        <div className="pt-2">
          <Input
            placeholder="https://ejemplo.com/imagen.jpg"
            className="bg-gray-800 border-gray-700 text-white mt-1 text-sm"
            value={content.imageUrl || ""}
            onChange={(e) => setContent({ ...content, imageUrl: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white">Instagram (Usuario)</Label>
        <Input
          value={content.instagram || ""}
          onChange={(e) => setContent({ ...content, instagram: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-secondary text-black hover:bg-yellow-400">
        {loading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
}
