"use client";

import { useActionState, useState } from "react";
import { updatePlayer } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalImageUpload } from "@/components/admin/LocalImageUpload";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { startTransition } from "react";
import { CATEGORIES, calculateRank, RANK_TIERS } from "@/lib/mmr";

interface PlayerFormProps {
  initialData: {
    id: string;
    alias: string | null;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
    chimucoins: number;
    active: boolean;
    stats?: {
      matchesPlayed: number;
      winsFirst: number;
      winsSecond: number;
      winsThird: number;
    } | null;
    categoryStats?: {
      category: string;
      points: number;
    }[];
  };
}

export function PlayerForm({ initialData }: PlayerFormProps) {
  const [imageUrl, setImageUrl] = useState(initialData.image || "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Bind the update action with the player ID
  const updatePlayerWithId = updatePlayer.bind(null, initialData.id);
  const [state, formAction] = useActionState(updatePlayerWithId as any, { message: "", errors: {} });

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (formData: FormData) => {
    // If there's a file to upload, do it first
    if (pendingFile) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", pendingFile);
      uploadFormData.append("customName", `avatar-${initialData.alias || "player"}`);
      uploadFormData.append("folder", "avatars");
      uploadFormData.append("type", "avatar");

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        const data = await response.json();

        if (response.ok && data.success) {
          formData.set("image", data.url);
        } else {
          toast.error(data.message || "Error al subir la imagen");
          return;
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Error al subir la imagen");
        return;
      }
    } else {
      // If no new file, ensure current image url is sent (or empty string if cleared)
      formData.set("image", imageUrl);
    }

    startTransition(() => {
      // @ts-ignore
      formAction(formData);
    });
  };

  return (
    <form action={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg border border-gray-800">

      {/* Avatar Section */}
      <div className="space-y-2">
        <Label className="text-white">Avatar</Label>
        <div className="flex items-center gap-6">
          {imageUrl ? (
            <div className="relative group shrink-0">
              <img src={imageUrl} alt="Avatar Preview" className="w-24 h-24 object-cover rounded-full border-2 border-gray-700" />
              <button
                type="button"
                onClick={() => {
                  setImageUrl("");
                  setPendingFile(null);
                }}
                className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                title="Eliminar imagen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center text-gray-500 border-2 border-gray-700 border-dashed">
              Sin Avatar
            </div>
          )}

          <div className="flex-1">
            <LocalImageUpload
              onFileSelect={handleFileSelect}
              label="Subir Avatar"
              onUrlSelect={(url) => {
                setImageUrl(url);
                setPendingFile(null);
              }}
            />
            <p className="text-xs text-gray-500 mt-2">Formatos: JPG, PNG, GIF. Máx 5MB.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="alias" className="text-white">Alias</Label>
          <Input
            id="alias"
            name="alias"
            defaultValue={initialData.alias || ""}
            className="bg-gray-800 border-gray-700 text-white"
            placeholder="Ej: Slayer99"
          />
          {(state as any)?.errors?.alias && <p className="text-red-500 text-sm">{(state as any).errors.alias}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-white">Nombre Real</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initialData.name || ""}
            className="bg-gray-800 border-gray-700 text-white"
            placeholder="Ej: Juan Perez"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={initialData.email}
            className="bg-gray-800 border-gray-700 text-white"
          />
          {(state as any)?.errors?.email && <p className="text-red-500 text-sm">{(state as any).errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white">Teléfono</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={initialData.phone || ""}
            className="bg-gray-800 border-gray-700 text-white"
            placeholder="+54 9 ..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="chimucoins" className="text-white text-yellow-500 font-bold">ChimuCoins Balance</Label>
          <Input
            id="chimucoins"
            name="chimucoins"
            type="number"
            min="0"
            defaultValue={initialData.chimucoins}
            className="bg-gray-800 border-gray-700 text-white font-mono text-lg"
          />
          {(state as any)?.errors?.chimucoins && <p className="text-red-500 text-sm">{(state as any).errors.chimucoins}</p>}
        </div>



        <div className="space-y-2">
          <Label htmlFor="password" className="text-white">Nueva Contraseña</Label>
          <PasswordInput
            id="password"
            name="password"
            className="bg-gray-800 border-gray-700 text-white"
            placeholder="Dejar en blanco para no cambiar"
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="pt-4 border-t border-gray-800">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">📊 Estadísticas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label htmlFor="matchesPlayed" className="text-zinc-400 text-xs">Partidas Jugadas</Label>
            <Input
              id="matchesPlayed"
              name="matchesPlayed"
              type="number"
              min="0"
              defaultValue={initialData.stats?.matchesPlayed || 0}
              className="bg-gray-800 border-gray-700 text-white font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="winsFirst" className="text-yellow-400 text-xs font-bold">🥇 1° Puesto</Label>
            <Input
              id="winsFirst"
              name="winsFirst"
              type="number"
              min="0"
              defaultValue={initialData.stats?.winsFirst || 0}
              className="bg-gray-800 border-yellow-500/30 text-white font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="winsSecond" className="text-gray-300 text-xs font-bold">🥈 2° Puesto</Label>
            <Input
              id="winsSecond"
              name="winsSecond"
              type="number"
              min="0"
              defaultValue={initialData.stats?.winsSecond || 0}
              className="bg-gray-800 border-gray-400/30 text-white font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="winsThird" className="text-orange-400 text-xs font-bold">🥉 3° Puesto</Label>
            <Input
              id="winsThird"
              name="winsThird"
              type="number"
              min="0"
              defaultValue={initialData.stats?.winsThird || 0}
              className="bg-gray-800 border-orange-500/30 text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* MMR Section */}
      <div className="pt-4 border-t border-gray-800">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          Puntaje Competitivo (MMR)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const stat = initialData.categoryStats?.find(s => s.category === cat);
            const defaultPoints = stat?.points || 0;

            return (
              <div key={cat} className="space-y-1 bg-black/20 p-3 rounded-lg border border-gray-800">
                <Label htmlFor={`mmr_${cat}`} className="text-blue-400 text-xs font-bold uppercase tracking-wider">{cat.replace("_", " ")}</Label>
                <div className="relative">
                  <Input
                    id={`mmr_${cat}`}
                    name={`mmr_${cat}`}
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={defaultPoints}
                    className="bg-gray-800 border-gray-700 text-white font-mono"
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const display = document.getElementById(`rank_display_${cat}`);
                      if (display) {
                        if (isNaN(val)) display.textContent = "";
                        else {
                          const r = calculateRank(val);
                          display.textContent = r.label;
                          display.className = r.tier === RANK_TIERS.PRO ? "text-[10px] text-yellow-500 font-bold" : r.tier === RANK_TIERS.SEMI_PRO ? "text-[10px] text-blue-400 font-bold" : "text-[10px] text-green-400 font-bold";
                        }
                      }
                    }}
                  />
                </div>
                {/* Dynamic Rank Display Span */}
                <div className="flex justify-end mt-1 h-4">
                  <span id={`rank_display_${cat}`} className="text-[10px] text-gray-400 font-bold">
                    {calculateRank(defaultPoints).label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-800">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            name="active"
            defaultChecked={initialData.active}
            className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-secondary focus:ring-secondary cursor-pointer"
          />
          <span className="text-white group-hover:text-secondary transition-colors">Jugador Activo</span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-8">Si se desactiva, el jugador no podrá iniciar sesión.</p>
      </div>

      {(state as any)?.message && (
        <div className="bg-red-900/20 border border-red-900/50 p-3 rounded-md">
          <p className="text-red-500 font-medium">{(state as any).message}</p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button type="submit" className="bg-secondary text-black hover:bg-yellow-400 min-w-[150px] font-bold">
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
}
