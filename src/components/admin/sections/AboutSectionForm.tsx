"use client";

import { useState, useRef } from "react";
import { updateSectionContent } from "@/app/actions/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";
import { MapPin, User, Upload, Save, Loader2, Instagram } from "lucide-react";
import Image from "next/image";

export function AboutSectionForm({ initialContent }: { initialContent: any }) {
  const [content, setContent] = useState(() => {
    const base = initialContent || {};
    return {
      title: base.title || "DARIO RUIZ",
      bio: base.bio || "Desde el corazón de Argentina, ChimuCheck nació con una misión simple: conectar a los jugadores.",
      location: base.location || "CÓRDOBA, ARGENTINA",
      role: base.role || "Creador & Fundador",
      headlinePart1: base.headlinePart1 || "PASIÓN POR",
      headlinePart2: base.headlinePart2 || "EL GAMING",
      imageUrl: base.imageUrl || base.image || "/images/about/dario.jpg",
      instagram: base.instagram || "chimucheck",
      stats: {
        followers: base.stats?.followers || "10K+",
        followersLabel: base.stats?.followersLabel || "SEGUIDORES",
        tournaments: base.stats?.tournaments || "50+",
        tournamentsLabel: base.stats?.tournamentsLabel || "TORNEOS",
        uptime: base.stats?.uptime || "24/7",
        uptimeLabel: base.stats?.uptimeLabel || "DIVERSIÓN",
      }
    };
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    setLoading(true);
    const res = await updateSectionContent("about_us", content);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const handleChange = (field: string, value: any) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  const handleStatChange = (key: string, value: string) => {
    setContent(prev => ({
      ...prev,
      stats: { ...prev.stats, [key]: value }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gray-900 p-4 rounded-t-lg border border-gray-800 border-b-0">
        <div>
          <h3 className="text-xl font-bold text-white">Editor Visual: Historia</h3>
          <p className="text-gray-400 text-sm">Edita directamente sobre el diseño. Lo que ves es lo que obtienes.</p>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="bg-secondary text-black hover:bg-yellow-400 font-bold">
          {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-4 h-4" />}
          Guardar Cambios
        </Button>
      </div>

      <div className="relative overflow-hidden bg-black border border-gray-800 rounded-b-lg shadow-2xl">
        <div className="absolute top-0 right-0 p-4 z-50">
          <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded border border-red-500/30">MODO EDICIÓN</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

            {/* Image Side */}
            <div className="relative group">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <Image
                  src={content.imageUrl}
                  alt={content.title}
                  fill
                  className="object-cover transition-opacity group-hover:opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                {/* Upload Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm cursor-pointer">
                  <div className="text-center">
                    <LocalImageUpload
                      onUploadComplete={(url) => handleChange("imageUrl", url)}
                      onUploadError={(err) => toast.error(err)}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChange("imageUrl", "")
                      }}
                      className="mt-2 text-red-400 hover:text-red-300 text-xs flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded border border-red-900/50 hover:bg-red-900/40 transition-colors mx-auto"
                      title="Eliminar imagen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-8 left-8 right-8 pointer-events-none">
                  <Input
                    value={content.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="text-4xl font-black text-white mb-2 bg-transparent border-none p-0 h-auto focus:ring-0 placeholder:text-gray-600 pointer-events-auto uppercase"
                  />
                  <div className="flex items-center gap-2 text-primary pointer-events-auto">
                    <MapPin size={18} />
                    <Input
                      value={content.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      className="font-bold tracking-wider bg-transparent border-none p-0 h-auto focus:ring-0 w-full text-primary placeholder:text-primary/50 uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Text Side */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-gray-400 mb-8 border border-transparent hover:border-white/10 transition-colors">
                <User size={16} />
                <Input
                  value={content.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="text-sm font-bold uppercase tracking-wider bg-transparent border-none p-0 h-auto w-[200px] focus:ring-0 text-gray-400 text-center"
                />
              </div>

              <h2 className="text-5xl md:text-6xl font-black text-white mb-8 leading-tight flex flex-col gap-2">
                <Input
                  value={content.headlinePart1}
                  onChange={(e) => handleChange("headlinePart1", e.target.value)}
                  className="bg-transparent border-none p-0 h-auto focus:ring-0 text-white font-black text-5xl md:text-6xl uppercase placeholder:text-gray-700 w-full"
                  placeholder="PASIÓN POR"
                />
                <Input
                  value={content.headlinePart2}
                  onChange={(e) => handleChange("headlinePart2", e.target.value)}
                  className="bg-transparent border-none p-0 h-auto focus:ring-0 text-primary font-black text-5xl md:text-6xl uppercase placeholder:text-primary/50 w-full"
                  placeholder="EL GAMING"
                />
              </h2>

              <div className="space-y-6 text-lg text-gray-300 leading-relaxed font-light">
                <Textarea
                  value={content.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  className="bg-transparent border border-transparent hover:border-white/10 focus:border-white/20 text-gray-300 w-full h-[200px] resize-none p-2 rounded text-lg leading-relaxed focus:ring-0"
                />
              </div>

              <div className="flex items-center gap-2 mt-4 text-gray-400">
                <Instagram size={18} />
                <Input
                  value={content.instagram}
                  onChange={(e) => handleChange("instagram", e.target.value)}
                  className="bg-transparent border-none text-gray-400 w-[200px] p-0 h-auto focus:ring-0"
                  placeholder="Usuario de Instagram"
                />
              </div>

              <div className="mt-12 pt-8 border-t border-white/10 flex gap-12">
                <div>
                  <Input
                    value={content.stats.followers}
                    onChange={(e) => handleStatChange("followers", e.target.value)}
                    className="block text-4xl font-black text-white bg-transparent border-none p-0 h-auto w-[100px] focus:ring-0"
                  />
                  <Input
                    value={content.stats.followersLabel}
                    onChange={(e) => handleStatChange("followersLabel", e.target.value)}
                    className="text-sm text-gray-500 uppercase tracking-wider bg-transparent border-none p-0 h-auto w-[100px] focus:ring-0 placeholder:text-gray-700"
                    placeholder="SEGUIDORES"
                  />
                </div>
                <div>
                  <Input
                    value={content.stats.tournaments}
                    onChange={(e) => handleStatChange("tournaments", e.target.value)}
                    className="block text-4xl font-black text-white bg-transparent border-none p-0 h-auto w-[100px] focus:ring-0"
                  />
                  <Input
                    value={content.stats.tournamentsLabel}
                    onChange={(e) => handleStatChange("tournamentsLabel", e.target.value)}
                    className="text-sm text-gray-500 uppercase tracking-wider bg-transparent border-none p-0 h-auto w-[100px] focus:ring-0 placeholder:text-gray-700"
                    placeholder="TORNEOS"
                  />
                </div>
                <div>
                  <Input
                    value={content.stats.uptime}
                    onChange={(e) => handleStatChange("uptime", e.target.value)}
                    className="block text-4xl font-black text-white bg-transparent border-none p-0 h-auto w-[100px] focus:ring-0"
                  />
                  <Input
                    value={content.stats.uptimeLabel}
                    onChange={(e) => handleStatChange("uptimeLabel", e.target.value)}
                    className="text-sm text-gray-500 uppercase tracking-wider bg-transparent border-none p-0 h-auto w-[100px] focus:ring-0 placeholder:text-gray-700"
                    placeholder="DIVERSIÓN"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
