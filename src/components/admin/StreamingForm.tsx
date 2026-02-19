"use client";

import { useState, useTransition } from "react";
import { updateStreamingConfig, StreamingConfig } from "@/app/actions/streaming";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Twitch, Youtube, Save, Loader2, Radio } from "lucide-react";
import { toast } from "sonner";

export default function StreamingForm({ initialData }: { initialData: StreamingConfig }) {
  const [formData, setFormData] = useState<StreamingConfig>(initialData);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateStreamingConfig(formData);
      if (result.success) {
        toast.success("Configuración de streaming actualizada");
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleChange = (key: keyof StreamingConfig, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="bg-zinc-900 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Radio className={formData.isLive ? "text-red-500 animate-pulse" : "text-gray-500"} />
          Configuración de Transmisión
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-white/5">
            <div className="space-y-0.5">
              <Label className="text-base text-white">Estado del Stream</Label>
              <p className="text-sm text-gray-400">
                Activa esto para mostrar el reproductor en la portada.
              </p>
            </div>
            <Switch
              checked={formData.isLive}
              onCheckedChange={(checked) => handleChange("isLive", checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Plataforma</Label>
            <Select
              value={formData.platform}
              onValueChange={(val) => handleChange("platform", val)}
            >
              <SelectTrigger className="bg-black/40 border-white/10 text-white">
                <SelectValue placeholder="Selecciona plataforma" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-white/10 text-white">
                <SelectItem value="twitch">
                  <div className="flex items-center gap-2">
                    <Twitch size={16} className="text-purple-500" /> Twitch
                  </div>
                </SelectItem>
                <SelectItem value="youtube">
                  <div className="flex items-center gap-2">
                    <Youtube size={16} className="text-red-600" /> YouTube
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">URL del Canal / Video</Label>
            <Input
              value={formData.channelUrl}
              onChange={(e) => handleChange("channelUrl", e.target.value)}
              className="bg-black/40 border-white/10 text-white"
              placeholder="https://twitch.tv/chimucheck"
            />
            <p className="text-xs text-gray-500">
              {formData.platform === "twitch"
                ? "Ingresa la URL completa de tu canal (ej: https://twitch.tv/tu_canal)"
                : "Ingresa la URL del video o directo (ej: https://youtube.com/watch?v=...)"}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Título (Opcional)</Label>
            <Input
              value={formData.gridTitle || ""}
              onChange={(e) => handleChange("gridTitle", e.target.value)}
              className="bg-black/40 border-white/10 text-white"
              placeholder="Estamos en Vivo"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-black font-bold hover:bg-primary/90"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Configuración
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
