"use client";

import { useState } from "react";
import { updateSectionContent } from "@/app/actions/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Facebook, Instagram, Twitter, MessageCircle, Youtube } from "lucide-react";

export function SocialsForm({ initialContent }: { initialContent: any }) {
  const [content, setContent] = useState(initialContent || {
    facebook: "",
    instagram: "",
    twitter: "",
    whatsapp: "",
    youtube: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await updateSectionContent("social_links", content);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Redes Sociales</h3>
      </div>
      <p className="text-sm text-gray-400">
        Configura las URLs de tus redes sociales. Estas aparecerán en el Navbar y Footer de la página.
      </p>

      <div className="space-y-4">
        {/* Instagram */}
        <div className="space-y-2">
          <Label className="text-gray-300 flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-500" />
            Instagram
          </Label>
          <Input
            placeholder="https://instagram.com/tu-usuario"
            className="bg-gray-800 border-gray-700 text-white"
            value={content.instagram || ""}
            onChange={(e) => setContent({ ...content, instagram: e.target.value })}
          />
        </div>

        {/* Whatsapp */}
        <div className="space-y-2">
          <Label className="text-gray-300 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-green-500" />
            WhatsApp
          </Label>
          <Input
            placeholder="https://wa.me/5491100000000"
            className="bg-gray-800 border-gray-700 text-white"
            value={content.whatsapp || ""}
            onChange={(e) => setContent({ ...content, whatsapp: e.target.value })}
          />
        </div>

        {/* Facebook */}
        <div className="space-y-2">
          <Label className="text-gray-300 flex items-center gap-2">
            <Facebook className="w-4 h-4 text-blue-500" />
            Facebook
          </Label>
          <Input
            placeholder="https://facebook.com/tu-pagina"
            className="bg-gray-800 border-gray-700 text-white"
            value={content.facebook || ""}
            onChange={(e) => setContent({ ...content, facebook: e.target.value })}
          />
        </div>

        {/* Twitter/X */}
        <div className="space-y-2">
          <Label className="text-gray-300 flex items-center gap-2">
            <Twitter className="w-4 h-4 text-blue-400" />
            Twitter / X
          </Label>
          <Input
            placeholder="https://twitter.com/tu-usuario"
            className="bg-gray-800 border-gray-700 text-white"
            value={content.twitter || ""}
            onChange={(e) => setContent({ ...content, twitter: e.target.value })}
          />
        </div>

        {/* YouTube */}
        <div className="space-y-2">
          <Label className="text-gray-300 flex items-center gap-2">
            <Youtube className="w-4 h-4 text-red-500" />
            YouTube
          </Label>
          <Input
            placeholder="https://youtube.com/@tu-canal"
            className="bg-gray-800 border-gray-700 text-white"
            value={content.youtube || ""}
            onChange={(e) => setContent({ ...content, youtube: e.target.value })}
          />
        </div>

      </div>

      <Button type="submit" disabled={loading} className="w-full bg-secondary text-black hover:bg-yellow-400">
        {loading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
}
