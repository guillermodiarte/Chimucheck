"use client";

import { useState } from "react";
import { updateSectionContent } from "@/app/actions/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X } from "lucide-react";
import { MediaSelectorModal } from "@/components/admin/MediaSelectorModal";
import { toast } from "sonner";
import Image from "next/image";

export function FooterForm({ initialContent }: { initialContent: any }) {
  const [content, setContent] = useState(initialContent || { logoUrl: "", title: "", subtitle: "" });
  const [loading, setLoading] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await updateSectionContent("footer_section", content);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const handleMediaSelect = (url: string) => {
    setContent({ ...content, logoUrl: url });
    setShowMediaModal(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800 max-w-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Pie de Página (Footer)</h3>
        </div>
        <p className="text-sm text-gray-400">
          Personaliza el logo, título y subtítulo que aparecen en la parte inferior de la página web.
        </p>

        <div className="space-y-4">
          {/* Logo */}
          <div className="space-y-2">
            <Label className="text-gray-300">Logo del Footer</Label>
            <div className="flex gap-4 items-start">
              <div
                className="relative w-32 h-32 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 hover:bg-gray-750 transition-colors"
                onClick={() => setShowMediaModal(true)}
              >
                {content.logoUrl ? (
                  <>
                    <Image src={content.logoUrl} alt="Logo" fill className="object-contain p-2" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContent({ ...content, logoUrl: "" });
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </>
                ) : (
                  <>
                    <ImagePlus size={24} className="text-gray-500 mb-2" />
                    <span className="text-xs text-center text-gray-500 px-2">Seleccionar<br />Imagen</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Logo que se mostrará junto al título en el footer.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Título / Nombre de la Marca</Label>
            <Input
              placeholder="Ej: ChimuCheck"
              className="bg-gray-800 border-gray-700 text-white"
              value={content.title || ""}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Subtítulo / Copyright</Label>
            <Textarea
              placeholder="Ej: © 2024 Todos los derechos reservados."
              className="bg-gray-800 border-gray-700 text-white h-24"
              value={content.subtitle || ""}
              onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-secondary text-black hover:bg-yellow-400">
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>

      <MediaSelectorModal
        open={showMediaModal}
        onOpenChange={setShowMediaModal}
        onSelect={handleMediaSelect}
      />
    </>
  );
}
