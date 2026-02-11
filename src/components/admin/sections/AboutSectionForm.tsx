"use client";

import { useState } from "react";
import { updateSectionContent } from "@/app/actions/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function AboutSectionForm({ initialContent }: { initialContent: any }) {
  const [content, setContent] = useState(initialContent || { title: "", bio: "", instagram: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateSectionContent("about_us", content);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800">
      <h3 className="text-xl font-semibold text-white">Editar "Historia / Acerca de"</h3>

      <div className="space-y-2">
        <Label className="text-white">Título</Label>
        <Input
          value={content.title}
          onChange={(e) => setContent({ ...content, title: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">Biografía / Historia</Label>
        <Textarea
          value={content.bio}
          onChange={(e) => setContent({ ...content, bio: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white h-48"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">Instagram (Usuario)</Label>
        <Input
          value={content.instagram}
          onChange={(e) => setContent({ ...content, instagram: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-secondary text-black hover:bg-yellow-400">
        {loading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
}
