"use client";

import { useState, useTransition } from "react";
import { updateGamingItems, GamingItem } from "@/app/actions/gaming";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, Loader2, GripVertical, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

export default function GamingZoneForm({ initialItems }: { initialItems: GamingItem[] }) {
  const [items, setItems] = useState<GamingItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateGamingItems(items);
      if (result.success) {
        toast.success("Zona Gaming actualizada");
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleAddItem = () => {
    if (items.length >= 5) {
      toast.error("Máximo 5 elementos permitidos");
      return;
    }
    setItems([
      ...items,
      {
        id: uuidv4(),
        title: "Nuevo Elemento",
        image: "",
        message: "",
        url: "",
        buttonText: "Ver Más"
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleChange = (id: string, key: keyof GamingItem, value: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [key]: value } : item
    ));
  };

  const handleUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "gaming");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        handleChange(id, "image", data.url);
        toast.success("Imagen subida");
      } else {
        toast.error("Error al subir imagen");
      }
    } catch {
      toast.error("Error de red");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={handleAddItem}
          disabled={items.length >= 5}
          className="bg-primary text-black font-bold hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Agregar Elemento ({items.length}/5)
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {items.map((item, index) => (
          <Card key={item.id} className="bg-zinc-900 border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 hover:bg-primary transition-colors cursor-move"></div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <span className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  {item.title || "Sin Título"}
                </CardTitle>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveItem(item.id)}
                  className="h-8 w-8 hover:bg-red-900/50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Título</Label>
                  <Input
                    value={item.title}
                    onChange={(e) => handleChange(item.id, "title", e.target.value)}
                    className="bg-black/40 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Imagen</Label>
                  <div className="flex gap-2">
                    <Input
                      value={item.image}
                      onChange={(e) => handleChange(item.id, "image", e.target.value)}
                      className="bg-black/40 border-white/10 text-white flex-1"
                      placeholder="https://..."
                    />
                    <div className="relative">
                      <input
                        type="file"
                        id={`upload-${item.id}`}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleUpload(item.id, e)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="border-white/10 bg-black/40 hover:bg-white/5 hover:text-primary"
                        onClick={() => document.getElementById(`upload-${item.id}`)?.click()}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Mensaje / Descripción</Label>
                <Input
                  value={item.message}
                  onChange={(e) => handleChange(item.id, "message", e.target.value)}
                  className="bg-black/40 border-white/10 text-white"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">URL del Botón</Label>
                  <Input
                    value={item.url}
                    onChange={(e) => handleChange(item.id, "url", e.target.value)}
                    className="bg-black/40 border-white/10 text-white"
                    placeholder="/torneos"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400">Texto del Botón</Label>
                  <Input
                    value={item.buttonText}
                    onChange={(e) => handleChange(item.id, "buttonText", e.target.value)}
                    className="bg-black/40 border-white/10 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 bg-gradient-to-r from-primary to-yellow-500 text-black font-black uppercase tracking-wide hover:opacity-90 transition-opacity"
        >
          {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Guardar Zona Gaming
        </Button>
      </form>
    </div>
  );
}
