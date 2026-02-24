"use client";

import { useState } from "react";
import { updateSectionContent } from "@/app/actions/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";
import { Save, Loader2, Gamepad2, Link as LinkIcon, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface GamingCard {
  id: string;
  title: string;
  description?: string;
  link: string;
  imageUrl: string;
}

interface GamingSectionContent {
  title: string;
  description: string;
  cards: GamingCard[];
  ctaButton: {
    text: string;
    link: string;
    enabled: boolean;
  };
}

export function GamingSectionForm({ initialContent }: { initialContent: any }) {
  const defaultContent: GamingSectionContent = {
    title: "¿TIENES LO QUE SE NECESITA?",
    description: "Participa en nuestros torneos y demuestra tu habilidad.",
    cards: [
      {
        id: "1",
        title: "CS2 Competitivo",
        description: "",
        link: "/torneos/cs2",
        imageUrl: "/images/chimucoin/game-1.jpg",
      },
      {
        id: "2",
        title: "Valorant Cups",
        description: "",
        link: "/torneos/valorant",
        imageUrl: "/images/chimucoin/game-2.jpg",
      }
    ],
    ctaButton: {
      text: "INSCRIBIRSE AL TORNEO",
      link: "/registro",
      enabled: true
    }
  };

  const [content, setContent] = useState<GamingSectionContent>(() => {
    if (!initialContent) return defaultContent;

    // Migration from old card1/card2 format to dynamic cards array
    let cards = initialContent.cards || [];
    if (cards.length === 0) {
      if (initialContent.card1) cards.push({ ...initialContent.card1, id: uuidv4() });
      if (initialContent.card2) cards.push({ ...initialContent.card2, id: uuidv4() });
    }
    if (cards.length === 0) {
      cards = defaultContent.cards;
    }

    return {
      title: initialContent.title || defaultContent.title,
      description: initialContent.description || defaultContent.description,
      cards,
      ctaButton: initialContent.ctaButton || defaultContent.ctaButton
    };
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const res = await updateSectionContent("gaming_section", content);
    setLoading(false);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const updateCard = (id: string, field: keyof GamingCard, value: string) => {
    setContent({
      ...content,
      cards: content.cards.map((card) =>
        card.id === id ? { ...card, [field]: value } : card
      )
    });
  };

  const handleImageUpload = async (cardId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (response.ok && data.success) {
        updateCard(cardId, "imageUrl", data.url);
        toast.success("Imagen subida correctamente");
      } else {
        toast.error(data.message || "Error al subir la imagen");
      }
    } catch {
      toast.error("Error al procesar la imagen");
    }
  };

  const addCard = () => {
    if (content.cards.length >= 10) {
      toast.error("Máximo 10 tarjetas permitidas");
      return;
    }
    setContent({
      ...content,
      cards: [
        ...content.cards,
        {
          id: uuidv4(),
          title: "Nuevo Torneo",
          link: "/torneos",
          imageUrl: ""   // empty → shows "Sin Imagen" placeholder
        }
      ]
    });
  };

  const removeCard = (id: string) => {
    if (content.cards.length <= 1) {
      toast.error("Debe haber al menos 1 tarjeta");
      return;
    }
    setContent({ ...content, cards: content.cards.filter((c) => c.id !== id) });
  };

  const gridClass = "justify-center";

  return (
    <div className="space-y-4">

      {/* ── Header / Controls ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-900 p-4 rounded-t-lg border border-gray-800 border-b-0">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="text-primary" />
            Editor Visual: Zona Gaming
          </h3>
          <p className="text-gray-400 text-sm">Edita dinámicamente hasta 10 elementos.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={addCard}
            disabled={content.cards.length >= 10}
            className="bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 disabled:opacity-50"
          >
            <Plus className="mr-2 w-4 h-4" />
            Agregar ({content.cards.length}/10)
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-secondary text-black hover:bg-yellow-400 font-bold">
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* ── Visual Preview ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-b-lg shadow-2xl border border-gray-800 bg-black">
        <div className="absolute top-0 right-0 p-4 z-50">
          <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded border border-red-500/30">MODO EDICIÓN</span>
        </div>

        <section className="py-16 bg-black relative">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gray-900/50 p-8">

              {/* Background blur */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
                style={{ backgroundImage: content.cards[0]?.imageUrl ? `url('${content.cards[0].imageUrl}')` : "none" }}
              />

              <div className="relative z-10 text-center max-w-[1200px] mx-auto">
                {/* Editable Title */}
                <Input
                  value={content.title}
                  onChange={(e) => setContent({ ...content, title: e.target.value })}
                  className="text-3xl md:text-5xl font-black text-white mb-8 uppercase text-center bg-transparent border-none p-0 h-auto focus:ring-0 placeholder:text-gray-700 w-full"
                  placeholder="TÍTULO SECCIÓN"
                />

                <div className={`flex flex-wrap gap-4 mb-10 ${gridClass}`}>
                  {content.cards.map((card) => (
                    <div key={card.id} className="relative aspect-video rounded-xl overflow-hidden border border-primary/30" style={{ width: 'calc(20% - 0.8rem)', minWidth: '120px' }}>
                      {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center gap-2 text-gray-500">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-xs">Sin Imagen</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                        <p className="text-white font-bold text-sm leading-tight line-clamp-2">{card.title || "Sin título"}</p>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{card.link}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA Button preview + editor */}
                <div className="relative group inline-block">
                  <div className="flex items-center gap-2 mb-2 bg-black/50 p-2 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 left-1/2 -translate-x-1/2 w-max z-10">
                    <input
                      type="checkbox"
                      id="ctaEnabled"
                      checked={content.ctaButton.enabled}
                      onChange={(e) => setContent({ ...content, ctaButton: { ...content.ctaButton, enabled: e.target.checked } })}
                      className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-secondary"
                    />
                    <label htmlFor="ctaEnabled" className="text-gray-300 text-sm cursor-pointer select-none">Mostrar Botón</label>
                  </div>
                  <div className={`transition-opacity duration-300 ${content.ctaButton.enabled ? "opacity-100" : "opacity-40 grayscale"}`}>
                    <div className="inline-block px-12 py-4 bg-white text-black font-black text-xl rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                      <Input
                        value={content.ctaButton.text}
                        onChange={(e) => setContent({ ...content, ctaButton: { ...content.ctaButton, text: e.target.value } })}
                        className="bg-transparent border-none p-0 h-auto focus:ring-0 text-black font-black text-xl text-center min-w-[200px]"
                        placeholder="TEXTO DEL BOTÓN"
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-2 justify-center">
                      <div className="bg-black/80 p-2 rounded flex items-center gap-2">
                        <LinkIcon className="w-3 h-3 text-gray-500" />
                        <Input
                          value={content.ctaButton.link}
                          onChange={(e) => setContent({ ...content, ctaButton: { ...content.ctaButton, link: e.target.value } })}
                          className="bg-transparent border border-gray-700/50 rounded px-2 py-1 h-auto focus:ring-0 text-white min-w-[200px] text-xs text-center"
                          placeholder="/ruta-destino"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Card Editors (below the preview) ──────────────────── */}
      <div className="space-y-3">
        <p className="text-gray-400 text-sm px-1">Edita el contenido de cada tarjeta:</p>
        {content.cards.map((card, index) => (
          <div key={card.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">

            {/* Card Header */}
            <div className="flex items-center justify-between">
              <span className="text-primary font-bold text-sm">Tarjeta {index + 1}</span>
              <Button
                onClick={() => removeCard(card.id)}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Eliminar
              </Button>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Título</label>
                <Input
                  value={card.title}
                  onChange={(e) => updateCard(card.id, "title", e.target.value)}
                  placeholder="Nombre del juego / torneo"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">URL destino</label>
                <Input
                  value={card.link}
                  onChange={(e) => updateCard(card.id, "link", e.target.value)}
                  placeholder="/torneos"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">Imagen de Fondo</label>
              <div className="flex flex-wrap items-center gap-4">
                {/* Mini preview */}
                <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-800 border border-gray-700 shrink-0 flex items-center justify-center">
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <LocalImageUpload
                  onFileSelect={(file) => handleImageUpload(card.id, file)}
                  onUrlSelect={(url) => updateCard(card.id, "imageUrl", url)}
                />
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
