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

interface ChimuCoinContent {
  badge?: string;
  title?: string;
  titleHighlight?: string;
  description?: string;
  card1Title?: string;
  card1Subtitle?: string;
  card2Title?: string;
  card2Subtitle?: string;
  imageUrl?: string;
}

const DEFAULTS: ChimuCoinContent = {
  badge: "Moneda Oficial",
  title: "DESCUBRE LAS",
  titleHighlight: "CHIMUCOINS",
  description:
    "La moneda que mueve nuestra economía. Participa en la comunidad, gana torneos y canjea tus monedas por premios reales. No es crypto, es pura diversión.",
  card1Title: "Gana Jugando",
  card1Subtitle: "Torneos semanales",
  card2Title: "Gana Viendo",
  card2Subtitle: "Drops en streams",
  imageUrl: "/images/chimucoin/main.jpg",
};

export function ChimuCoinSectionForm({ initialContent }: { initialContent: any }) {
  const [content, setContent] = useState<ChimuCoinContent>({
    ...DEFAULTS,
    ...(initialContent || {}),
  });
  const [loading, setLoading] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateSectionContent("chimucoin_section", content);
    setLoading(false);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
  };

  const set = (key: keyof ChimuCoinContent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setContent((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800 max-w-2xl">
        <div>
          <h3 className="text-xl font-semibold text-white">Sección ChimuCoins</h3>
          <p className="text-sm text-gray-400 mt-1">
            Edita los textos, tarjetas informativas e imagen de la sección ChimuCoins en la página principal.
          </p>
        </div>

        <div className="space-y-4">
          {/* Badge */}
          <div className="space-y-2">
            <Label className="text-gray-300">Etiqueta (badge)</Label>
            <Input
              placeholder="Ej: Moneda Oficial"
              className="bg-gray-800 border-gray-700 text-white"
              value={content.badge || ""}
              onChange={set("badge")}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-gray-300">Título (primera línea)</Label>
            <Input
              placeholder="Ej: DESCUBRE LAS"
              className="bg-gray-800 border-gray-700 text-white"
              value={content.title || ""}
              onChange={set("title")}
            />
          </div>

          {/* Title Highlight */}
          <div className="space-y-2">
            <Label className="text-gray-300">Título resaltado (segunda línea, en dorado)</Label>
            <Input
              placeholder="Ej: CHIMUCOINS"
              className="bg-gray-800 border-gray-700 text-white"
              value={content.titleHighlight || ""}
              onChange={set("titleHighlight")}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-gray-300">Descripción</Label>
            <Textarea
              placeholder="La moneda que mueve nuestra economía..."
              className="bg-gray-800 border-gray-700 text-white h-28"
              value={content.description || ""}
              onChange={set("description")}
            />
          </div>

          {/* Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3 border border-gray-700 p-3 rounded-lg">
              <Label className="text-gray-300 text-xs uppercase tracking-wider">Tarjeta 1</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Título"
                  className="bg-gray-800 border-gray-700 text-white text-sm"
                  value={content.card1Title || ""}
                  onChange={set("card1Title")}
                />
                <Input
                  placeholder="Subtítulo"
                  className="bg-gray-800 border-gray-700 text-white text-sm"
                  value={content.card1Subtitle || ""}
                  onChange={set("card1Subtitle")}
                />
              </div>
            </div>
            <div className="space-y-3 border border-gray-700 p-3 rounded-lg">
              <Label className="text-gray-300 text-xs uppercase tracking-wider">Tarjeta 2</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Título"
                  className="bg-gray-800 border-gray-700 text-white text-sm"
                  value={content.card2Title || ""}
                  onChange={set("card2Title")}
                />
                <Input
                  placeholder="Subtítulo"
                  className="bg-gray-800 border-gray-700 text-white text-sm"
                  value={content.card2Subtitle || ""}
                  onChange={set("card2Subtitle")}
                />
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label className="text-gray-300">Imagen de la moneda</Label>
            <div
              className="relative w-40 h-40 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
              onClick={() => setShowMediaModal(true)}
            >
              {content.imageUrl ? (
                <>
                  <Image src={content.imageUrl} alt="ChimuCoin" fill className="object-contain p-2" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setContent((prev) => ({ ...prev, imageUrl: "" }));
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </>
              ) : (
                <>
                  <ImagePlus size={24} className="text-gray-500 mb-2" />
                  <span className="text-xs text-center text-gray-500 px-2">Seleccionar Imagen</span>
                </>
              )}
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-secondary text-black hover:bg-yellow-400">
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>

      <MediaSelectorModal
        open={showMediaModal}
        onOpenChange={setShowMediaModal}
        onSelect={(url) => {
          setContent((prev) => ({ ...prev, imageUrl: url }));
          setShowMediaModal(false);
        }}
      />
    </>
  );
}
