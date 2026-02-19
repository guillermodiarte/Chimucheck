"use client";

import { useState, useTransition } from "react";
import { updateSocialLinks, SocialLinks } from "@/app/actions/socials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, Twitch, Youtube, Monitor, Twitter, Disc, Video, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SocialsForm({ initialData }: { initialData: SocialLinks }) {
  const [formData, setFormData] = useState<SocialLinks>(initialData);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateSocialLinks(formData);
      if (result.success) {
        toast.success("Redes sociales actualizadas correctamente");
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleChange = (key: keyof SocialLinks, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="bg-zinc-900 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Redes Sociales & Enlaces</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-zinc-300">
                <Instagram size={16} className="text-pink-500" /> Instagram
              </Label>
              <Input
                value={formData.instagram}
                onChange={(e) => handleChange("instagram", e.target.value)}
                className="bg-black/40 border-white/10 text-white"
                placeholder="https://instagram.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-zinc-300">
                <Twitter size={16} className="text-blue-400" /> Twitter / X
              </Label>
              <Input
                value={formData.twitter}
                onChange={(e) => handleChange("twitter", e.target.value)}
                className="bg-black/40 border-white/10 text-white"
                placeholder="https://twitter.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-zinc-300">
                <Twitch size={16} className="text-purple-500" /> Twitch
              </Label>
              <Input
                value={formData.twitch}
                onChange={(e) => handleChange("twitch", e.target.value)}
                className="bg-black/40 border-white/10 text-white"
                placeholder="https://twitch.tv/..."
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-zinc-300">
                <Youtube size={16} className="text-red-600" /> YouTube
              </Label>
              <Input
                value={formData.youtube}
                onChange={(e) => handleChange("youtube", e.target.value)}
                className="bg-black/40 border-white/10 text-white"
                placeholder="https://youtube.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-zinc-300">
                <Monitor size={16} className="text-green-500" /> Kick
              </Label>
              <Input
                value={formData.kick}
                onChange={(e) => handleChange("kick", e.target.value)}
                className="bg-black/40 border-white/10 text-white"
                placeholder="https://kick.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-zinc-300">
                <Disc size={16} className="text-indigo-400" /> Discord
              </Label>
              <Input
                value={formData.discord}
                onChange={(e) => handleChange("discord", e.target.value)}
                className="bg-black/40 border-white/10 text-white"
                placeholder="https://discord.gg/..."
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-zinc-300">
                <Video size={16} className="text-white" /> TikTok
              </Label>
              <Input
                value={formData.tiktok}
                onChange={(e) => handleChange("tiktok", e.target.value)}
                className="bg-black/40 border-white/10 text-white"
                placeholder="https://tiktok.com/@..."
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-black font-bold hover:bg-primary/90"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Redes Sociales
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
