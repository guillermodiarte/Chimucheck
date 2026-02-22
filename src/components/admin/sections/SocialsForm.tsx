"use client";

import { useState } from "react";
import { updateSectionContent } from "@/app/actions/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Facebook, Instagram, Twitter, MessageCircle, Youtube, Twitch, Monitor } from "lucide-react";
import { getSocialConfig } from "@/lib/utils";

export function SocialsForm({ initialContent }: { initialContent: any }) {
  const [content, setContent] = useState({
    instagram: getSocialConfig(initialContent, "instagram"),
    whatsapp: getSocialConfig(initialContent, "whatsapp"),
    facebook: getSocialConfig(initialContent, "facebook"),
    twitter: getSocialConfig(initialContent, "twitter"),
    youtube: getSocialConfig(initialContent, "youtube"),
    twitch: getSocialConfig(initialContent, "twitch"),
    kick: getSocialConfig(initialContent, "kick"),
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

  const updateNetwork = (key: keyof typeof content, field: "url" | "active", value: string | boolean) => {
    setContent(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Redes Sociales</h3>
      </div>
      <p className="text-sm text-gray-400">
        Configura las URLs de tus redes sociales y decide cuáles están activas.
      </p>

      <div className="space-y-6">
        {/* Instagram */}
        <div className="space-y-2 border border-gray-800 p-4 rounded-lg bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-gray-300 flex items-center gap-2">
              <Instagram className="w-5 h-5 text-pink-500" />
              Instagram
            </Label>
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-400">Activa</Label>
              <Switch checked={content.instagram.active} onCheckedChange={(c) => updateNetwork("instagram", "active", c)} />
            </div>
          </div>
          <Input placeholder="https://instagram.com/tu-usuario" className="bg-gray-800 border-gray-700 text-white" value={content.instagram.url} onChange={(e) => updateNetwork("instagram", "url", e.target.value)} />
        </div>

        {/* Whatsapp */}
        <div className="space-y-2 border border-gray-800 p-4 rounded-lg bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-gray-300 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              WhatsApp
            </Label>
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-400">Activa</Label>
              <Switch checked={content.whatsapp.active} onCheckedChange={(c) => updateNetwork("whatsapp", "active", c)} />
            </div>
          </div>
          <Input placeholder="https://wa.me/5491100000000" className="bg-gray-800 border-gray-700 text-white" value={content.whatsapp.url} onChange={(e) => updateNetwork("whatsapp", "url", e.target.value)} />
        </div>

        {/* Facebook */}
        <div className="space-y-2 border border-gray-800 p-4 rounded-lg bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-gray-300 flex items-center gap-2">
              <Facebook className="w-5 h-5 text-blue-500" />
              Facebook
            </Label>
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-400">Activa</Label>
              <Switch checked={content.facebook.active} onCheckedChange={(c) => updateNetwork("facebook", "active", c)} />
            </div>
          </div>
          <Input placeholder="https://facebook.com/tu-pagina" className="bg-gray-800 border-gray-700 text-white" value={content.facebook.url} onChange={(e) => updateNetwork("facebook", "url", e.target.value)} />
        </div>

        {/* Twitter/X */}
        <div className="space-y-2 border border-gray-800 p-4 rounded-lg bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-gray-300 flex items-center gap-2">
              <Twitter className="w-5 h-5 text-blue-400" />
              Twitter / X
            </Label>
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-400">Activa</Label>
              <Switch checked={content.twitter.active} onCheckedChange={(c) => updateNetwork("twitter", "active", c)} />
            </div>
          </div>
          <Input placeholder="https://twitter.com/tu-usuario" className="bg-gray-800 border-gray-700 text-white" value={content.twitter.url} onChange={(e) => updateNetwork("twitter", "url", e.target.value)} />
        </div>

        {/* Twitch */}
        <div className="space-y-2 border border-gray-800 p-4 rounded-lg bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-gray-300 flex items-center gap-2">
              <Twitch className="w-5 h-5 text-purple-500" />
              Twitch
            </Label>
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-400">Activa</Label>
              <Switch checked={content.twitch.active} onCheckedChange={(c) => updateNetwork("twitch", "active", c)} />
            </div>
          </div>
          <Input placeholder="https://twitch.tv/chimucheck" className="bg-gray-800 border-gray-700 text-white" value={content.twitch.url} onChange={(e) => updateNetwork("twitch", "url", e.target.value)} />
        </div>

        {/* Kick / Monitor */}
        <div className="space-y-2 border border-gray-800 p-4 rounded-lg bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-gray-300 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-green-400" />
              Kick
            </Label>
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-400">Activa</Label>
              <Switch checked={content.kick.active} onCheckedChange={(c) => updateNetwork("kick", "active", c)} />
            </div>
          </div>
          <Input placeholder="https://kick.com/chimucheck" className="bg-gray-800 border-gray-700 text-white" value={content.kick.url} onChange={(e) => updateNetwork("kick", "url", e.target.value)} />
        </div>

        {/* YouTube */}
        <div className="space-y-2 border border-gray-800 p-4 rounded-lg bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-gray-300 flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              YouTube
            </Label>
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-400">Activa</Label>
              <Switch checked={content.youtube.active} onCheckedChange={(c) => updateNetwork("youtube", "active", c)} />
            </div>
          </div>
          <Input placeholder="https://youtube.com/@tu-canal" className="bg-gray-800 border-gray-700 text-white" value={content.youtube.url} onChange={(e) => updateNetwork("youtube", "url", e.target.value)} />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-secondary text-black hover:bg-yellow-400">
        {loading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
}
