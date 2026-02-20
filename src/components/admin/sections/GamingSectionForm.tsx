"use client";

import { useState } from "react";
import { updateSectionContent } from "@/app/actions/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";
import { Save, Loader2, Gamepad2, Link as LinkIcon, Plus, Trash2 } from "lucide-react";

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
  // Defaults - ChimuCoin Design (CS2/Valorant)
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
      if (initialContent.card1) cards.push({ ...initialContent.card1, id: crypto.randomUUID() });
      if (initialContent.card2) cards.push({ ...initialContent.card2, id: crypto.randomUUID() });
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

  const addCard = () => {
    if (content.cards.length >= 5) {
      toast.error("Máximo 5 tarjetas permitidas");
      return;
    }
    setContent({
      ...content,
      cards: [
        ...content.cards,
        {
          id: crypto.randomUUID(),
          title: "Nuevo Torneo",
          link: "/torneos",
          imageUrl: "/images/tournament-placeholder.jpg"
        }
      ]
    });
  };

  const removeCard = (id: string) => {
    if (content.cards.length <= 1) {
      toast.error("Debe haber al menos 1 tarjeta");
      return;
    }
    setContent({
      ...content,
      cards: content.cards.filter((c) => c.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header / Controls */}
      <div className="flex items-center justify-between bg-gray-900 p-4 rounded-t-lg border border-gray-800 border-b-0">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="text-primary" />
            Editor Visual: Zona Gaming
          </h3>
          <p className="text-gray-400 text-sm">Edita dinámicamente hasta 5 elementos.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={addCard}
            disabled={content.cards.length >= 5}
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/20"
          >
            <Plus className="mr-2 w-4 h-4" />
            Agregar ({content.cards.length}/5)
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-secondary text-black hover:bg-yellow-400 font-bold">
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Visual Editor Container */}
      <div className="relative overflow-hidden rounded-b-lg shadow-2xl border border-gray-800 bg-black">
        <div className="absolute top-0 right-0 p-4 z-50">
          <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded border border-red-500/30">MODO EDICIÓN</span>
        </div>

        <section className="py-20 bg-black relative">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gray-900/50 p-8 md:p-12">

              {/* Background Map - Fallback to first image */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
                style={{ backgroundImage: `url('${content.cards[0]?.imageUrl || ""}')` }}
              />

              <div className="relative z-10 text-center max-w-[1200px] mx-auto">
                {/* Header Edit */}
                <Input
                  value={content.title}
                  onChange={(e) => setContent({ ...content, title: e.target.value })}
                  className="text-4xl md:text-6xl font-black text-white mb-8 uppercase text-center bg-transparent border-none p-0 h-auto focus:ring-0 placeholder:text-gray-700 w-full"
                  placeholder="TÍTULO SECCIÓN"
                />

                {/* Cards Grid dynamically mapped */}
                <div className={`grid gap-6 mb-12 ${content.cards.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
                    content.cards.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                      content.cards.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                        content.cards.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
                          'grid-cols-1 md:grid-cols-3 lg:grid-cols-5'
                  }`}>
                  {content.cards.map((card) => (
                    <div key={card.id} className="relative aspect-video rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_20px_rgba(0,240,255,0.1)] group">

                      {/* Delete Button */}
                      <div className="absolute top-2 right-2 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => removeCard(card.id)}
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 bg-red-600/80 hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Image Logic */}
                      <div className="absolute inset-0 z-0">
                        <img
                          src={card.imageUrl}
                          alt="Background"
                          className="w-full h-full object-cover transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                        {/* Upload Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <div className="p-4 bg-black/80 rounded-lg border border-white/20">
                            <div className="mb-2 text-white font-bold text-xs text-center">Cambiar Imagen</div>
                            <LocalImageUpload
                              onFileSelect={() => { }}
                              onUrlSelect={(url) => updateCard(card.id, "imageUrl", url)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Content Overlay */}
                      <div className="absolute inset-0 flex items-end p-4 pointer-events-none z-30">
                        <div className="w-full pointer-events-auto">
                          <Input
                            value={card.title}
                            onChange={(e) => updateCard(card.id, "title", e.target.value)}
                            className="text-xl md:text-2xl font-bold text-white text-left bg-transparent border-none p-0 h-auto focus:ring-0 placeholder:text-white/50 w-full mb-1 shadow-black/50 drop-shadow-md"
                            placeholder="TÍTULO CARD"
                          />
                          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-2 rounded backdrop-blur-sm w-fit">
                            <LinkIcon className="w-3 h-3 text-white shrink-0" />
                            <Input
                              value={card.link}
                              onChange={(e) => updateCard(card.id, "link", e.target.value)}
                              className="bg-transparent border-none p-0 h-auto focus:ring-0 text-xs text-white w-full min-w-[120px]"
                              placeholder="/ruta-destino"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA Button Editor */}
                <div className="relative group inline-block mt-8">
                  <div className="flex items-center gap-2 mb-2 bg-black/50 p-2 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 left-1/2 -translate-x-1/2 w-max">
                    <input
                      type="checkbox"
                      id="ctaEnabled"
                      checked={content.ctaButton.enabled}
                      onChange={(e) => setContent({ ...content, ctaButton: { ...content.ctaButton, enabled: e.target.checked } })}
                      className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-secondary focus:ring-secondary"
                    />
                    <label htmlFor="ctaEnabled" className="text-gray-300 text-sm cursor-pointer select-none">Mostrar Botón</label>
                  </div>

                  <div className={`transition-opacity duration-300 ${content.ctaButton.enabled ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                    <div className="inline-block px-12 py-4 bg-white text-black font-black text-xl rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                      <Input
                        value={content.ctaButton.text}
                        onChange={(e) => setContent({ ...content, ctaButton: { ...content.ctaButton, text: e.target.value } })}
                        className="bg-transparent border-none p-0 h-auto focus:ring-0 text-black font-black text-xl text-center min-w-[200px]"
                        placeholder="TEXTO DEL BOTÓN"
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity absolute top-full left-0 right-0 pt-2">
                      <div className="bg-black/80 p-2 rounded flex items-center gap-2 z-50">
                        <LinkIcon className="w-3 h-3 text-gray-500" />
                        <Input
                          value={content.ctaButton.link}
                          onChange={(e) => setContent({ ...content, ctaButton: { ...content.ctaButton, link: e.target.value } })}
                          className="bg-transparent border border-gray-700/50 rounded px-2 py-1 h-auto focus:ring-0 text-white min-w-[200px] text-xs text-center relative z-50 pointer-events-auto"
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
    </div>
  );
}
