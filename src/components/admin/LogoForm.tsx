"use client";

import { useState, useTransition } from "react";
import { updateSectionContent } from "@/app/actions/sections"; // Corrected import
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function LogoForm({ initialData }: { initialData: any }) {
  const [logoUrl, setLogoUrl] = useState<string>(initialData?.logoUrl || "/images/logo5.png");
  const [isPending, startTransition] = useTransition();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "branding");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setLogoUrl(data.url);
        toast.success("Logo subido, recuerda guardar cambios");
      } else {
        toast.error("Error al subir imagen");
      }
    } catch {
      toast.error("Error de red");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // We only care about logoUrl now, title/subtitle are legacy/removed as per requirements
      const result = await updateSectionContent("home_section", {
        logoUrl,
        title: initialData?.title || "",
        subtitle: initialData?.subtitle || "",
        buttonText: initialData?.buttonText || "",
        buttonUrl: initialData?.buttonUrl || ""
      });

      if (result.success) {
        toast.success("Logo actualizado correctamente");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Card className="bg-zinc-900 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Logo Principal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4 p-8 border-2 border-dashed border-white/10 rounded-xl bg-black/20">
            <div className="relative w-40 h-40">
              <Image
                src={logoUrl}
                alt="Logo Preview"
                fill
                className="object-contain"
              />
            </div>

            <div className="flex gap-2">
              <input
                type="file"
                id="logo-upload"
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("logo-upload")?.click()}
                className="border-white/10 bg-zinc-800 hover:bg-white/5 hover:text-primary"
              >
                <Upload className="h-4 w-4 mr-2" /> Subir Nuevo Logo
              </Button>
            </div>
            <p className="text-xs text-gray-500">Recomendado: 500x500px PNG transparente</p>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-black font-bold hover:bg-primary/90"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Logo
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
