"use client";

import { useState } from "react";
import { updateSectionContent } from "@/app/actions/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Video, Tv, Youtube } from "lucide-react";

export function StreamingForm({ initialContent }: { initialContent: any }) {
  const [content, setContent] = useState(initialContent || {
    twitchId: "",
    twitchEnabled: false,
    youtubeId: "",
    youtubeEnabled: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await updateSectionContent("streaming_section", content);
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
        <h3 className="text-xl font-semibold text-white">Transmisiones en Vivo</h3>
      </div>
      <p className="text-sm text-gray-400">
        Configura los canales de Twitch y YouTube que se mostrarán en la página principal.
      </p>

      {/* Twitch Control */}
      <div className="space-y-4 bg-black/30 p-4 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between">
          <Label className="text-white flex items-center gap-2 text-lg">
            <Tv className="w-5 h-5 text-purple-500" />
            Twitch
          </Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="twitch-enabled"
              checked={content.twitchEnabled}
              onCheckedChange={(checked) => setContent({ ...content, twitchEnabled: !!checked })}
            />
            <Label htmlFor="twitch-enabled" className="text-sm text-gray-300 cursor-pointer">
              Mostrar en Inicio
            </Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-400 text-xs uppercase font-bold tracking-wider">Nombre del Canal / ID</Label>
          <Input
            placeholder="Ej: ibai"
            className="bg-gray-800 border-gray-700 text-white"
            value={content.twitchId || ""}
            onChange={(e) => setContent({ ...content, twitchId: e.target.value })}
          />
          <p className="text-xs text-gray-500">Ingresa solo el nombre del canal. Ej: si es twitch.tv/mi_canal, ingresa "mi_canal".</p>
        </div>
      </div>

      {/* YouTube Control */}
      <div className="space-y-4 bg-black/30 p-4 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between">
          <Label className="text-white flex items-center gap-2 text-lg">
            <Youtube className="w-5 h-5 text-red-500" />
            YouTube
          </Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="youtube-enabled"
              checked={content.youtubeEnabled}
              onCheckedChange={(checked) => setContent({ ...content, youtubeEnabled: !!checked })}
            />
            <Label htmlFor="youtube-enabled" className="text-sm text-gray-300 cursor-pointer">
              Mostrar en Inicio
            </Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-400 text-xs uppercase font-bold tracking-wider">ID del Video en Vivo</Label>
          <Input
            placeholder="Ej: dQw4w9WgXcQ"
            className="bg-gray-800 border-gray-700 text-white"
            value={content.youtubeId || ""}
            onChange={(e) => setContent({ ...content, youtubeId: e.target.value })}
          />
          <p className="text-xs text-gray-500">Ingresa el ID del video (lo que sigue después de "?v=" en la URL).</p>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-secondary text-black hover:bg-yellow-400">
        {loading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
}
