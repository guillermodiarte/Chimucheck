"use client";

import { useState } from "react";
import { updateSectionContent } from "@/app/actions/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";
import { Save, Loader2, Gamepad2, Link as LinkIcon, Image as ImageIcon } from "lucide-react";

interface GamingSectionContent {
  title: string;
  description: string;
  card1: {
    title: string;
    description?: string;
    link: string;
    imageUrl: string;
    // tag removed
  };
  card2: {
    title: string;
    description?: string;
    link: string;
    imageUrl: string;
    // tag removed
  };
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
    description: "",
    card1: {
      title: "CS2 Competitivo",
      description: "",
      link: "/torneos/cs2",
      imageUrl: "/images/chimucoin/game-1.jpg",
    },
    card2: {
      title: "Valorant Cups",
      description: "",
      link: "/torneos/valorant",
      imageUrl: "/images/chimucoin/game-2.jpg",
    },
    ctaButton: {
      text: "INSCRIBIRSE AL TORNEO",
      link: "/registro",
      enabled: true
    }
  };

  const [content, setContent] = useState<GamingSectionContent>(initialContent || defaultContent);
  const [loading, setLoading] = useState(false);

  // Helper to fallback to default images if missing
  const getCardImage = (cardKey: "card1" | "card2") => {
    const current = content[cardKey].imageUrl;
    // If current is empty string or null, fallback
    if (!current || current === "") return defaultContent[cardKey].imageUrl;
    return current;
  };

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

  const updateCard = (cardKey: "card1" | "card2", field: string, value: string) => {
    setContent({
      ...content,
      [cardKey]: {
        ...content[cardKey],
        [field]: value
      }
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
          <p className="text-gray-400 text-sm">Edita directamente sobre el diseño.</p>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="bg-secondary text-black hover:bg-yellow-400 font-bold">
          {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />}
          Guardar Cambios
        </Button>
      </div>

      {/* Visual Editor Container */}
      <div className="relative overflow-hidden rounded-b-lg shadow-2xl border border-gray-800 bg-black">
        <div className="absolute top-0 right-0 p-4 z-50">
          <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded border border-red-500/30">MODO EDICIÓN</span>
        </div>

        {/* The Section Component Recreated */}
        <section className="py-20 bg-black relative">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gray-900/50 p-8 md:p-12">

              {/* Container Background (Optional / From Reference) */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
                style={{ backgroundImage: `url('${getCardImage("card1")}')` }}
              />

              <div className="relative z-10 text-center max-w-4xl mx-auto">

                {/* Header Form */}
                <Input
                  value={content.title}
                  onChange={(e) => setContent({ ...content, title: e.target.value })}
                  className="text-4xl md:text-6xl font-black text-white mb-8 uppercase text-center bg-transparent border-none p-0 h-auto focus:ring-0 placeholder:text-gray-700 w-full"
                  placeholder="TÍTULO SECCIÓN"
                />
                {/* Hidden Description */}
                <div className="hidden">
                  <Textarea
                    value={content.description}
                    onChange={(e) => setContent({ ...content, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

                  {/* Card 1 */}
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_20px_rgba(0,240,255,0.1)] group">
                    {/* Background Image Logic */}
                    <div className="absolute inset-0 z-0">
                      <img
                        src={getCardImage("card1")}
                        alt="Background"
                        className="w-full h-full object-cover transition-transform duration-700"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                      {/* Upload Overlay (always interactive in admin) */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <div className="p-4 bg-black/80 rounded-lg border border-white/20">
                          <div className="mb-2 text-white font-bold text-sm text-center">Cambiar Imagen</div>
                          <LocalImageUpload
                            onFileSelect={() => { }}
                            onUrlSelect={(url) => updateCard("card1", "imageUrl", url)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex items-end p-6 pointer-events-none z-30">
                      <div className="w-full pointer-events-auto">
                        <Input
                          value={content.card1.title}
                          onChange={(e) => updateCard("card1", "title", e.target.value)}
                          className="text-2xl font-bold text-white text-left bg-transparent border-none p-0 h-auto focus:ring-0 placeholder:text-white/50 w-full mb-1 shadow-black/50 drop-shadow-md"
                          placeholder="TÍTULO CARD 1"
                        />

                        {/* Link Edit */}
                        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-2 rounded backdrop-blur-sm w-fit">
                          <LinkIcon className="w-3 h-3 text-white" />
                          <Input
                            value={content.card1.link}
                            onChange={(e) => updateCard("card1", "link", e.target.value)}
                            className="bg-transparent border-none p-0 h-auto focus:ring-0 text-xs text-white w-full min-w-[150px]"
                            placeholder="/ruta-destino"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-secondary/30 shadow-[0_0_20px_rgba(255,215,0,0.1)] group">
                    {/* Background Image Logic */}
                    <div className="absolute inset-0 z-0">
                      <img
                        src={getCardImage("card2")}
                        alt="Background"
                        className="w-full h-full object-cover transition-transform duration-700"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                      {/* Upload Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <div className="p-4 bg-black/80 rounded-lg border border-white/20">
                          <div className="mb-2 text-white font-bold text-sm text-center">Cambiar Imagen</div>
                          <LocalImageUpload
                            onFileSelect={() => { }}
                            onUrlSelect={(url) => updateCard("card2", "imageUrl", url)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex items-end p-6 pointer-events-none z-30">
                      <div className="w-full pointer-events-auto">
                        <Input
                          value={content.card2.title}
                          onChange={(e) => updateCard("card2", "title", e.target.value)}
                          className="text-2xl font-bold text-white text-left bg-transparent border-none p-0 h-auto focus:ring-0 placeholder:text-white/50 w-full mb-1 shadow-black/50 drop-shadow-md"
                          placeholder="TÍTULO CARD 2"
                        />

                        {/* Link Edit */}
                        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-2 rounded backdrop-blur-sm w-fit">
                          <LinkIcon className="w-3 h-3 text-white" />
                          <Input
                            value={content.card2.link}
                            onChange={(e) => updateCard("card2", "link", e.target.value)}
                            className="bg-transparent border-none p-0 h-auto focus:ring-0 text-xs text-white w-full min-w-[150px]"
                            placeholder="/ruta-destino"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button Editor */}
                <div className="relative group inline-block">
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
                      <div className="bg-black/80 p-2 rounded flex items-center gap-2">
                        <LinkIcon className="w-3 h-3 text-gray-500" />
                        <Input
                          value={content.ctaButton.link}
                          onChange={(e) => setContent({ ...content, ctaButton: { ...content.ctaButton, link: e.target.value } })}
                          className="bg-transparent border border-gray-700/50 rounded px-2 py-1 h-auto focus:ring-0 text-gray-400 text-xs text-center w-[150px]"
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
