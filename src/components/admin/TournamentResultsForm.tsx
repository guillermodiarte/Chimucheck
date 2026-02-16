"use client";

import { useState } from "react";
import { setTournamentWinners, setTournamentPhotos } from "@/app/actions/tournaments";
import type { WinnerEntry } from "@/app/actions/tournaments";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trophy, Camera, X, Save, Loader2, Upload, Coins } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface TournamentResultsFormProps {
  tournamentId: string;
  players: { id: string; alias: string }[];
  initialWinners: WinnerEntry[];
  initialPhotos: string[];
}

const POSITIONS = [
  { position: 1, label: "1er Puesto", color: "text-yellow-400 border-yellow-500/50 bg-yellow-500/10", icon: "🥇" },
  { position: 2, label: "2do Puesto", color: "text-gray-300 border-gray-500/50 bg-gray-500/10", icon: "🥈" },
  { position: 3, label: "3er Puesto", color: "text-amber-600 border-amber-700/50 bg-amber-700/10", icon: "🥉" },
];

function ensureAllPositions(initial: WinnerEntry[]): WinnerEntry[] {
  return POSITIONS.map((pos) => {
    const existing = initial.find((w) => w.position === pos.position);
    return existing
      ? { ...existing, chimucoins: existing.chimucoins || 0 }
      : { position: pos.position, playerId: "", playerAlias: "", chimucoins: 0 };
  });
}

export default function TournamentResultsForm({
  tournamentId,
  players,
  initialWinners,
  initialPhotos,
}: TournamentResultsFormProps) {
  const router = useRouter();
  const [winners, setWinners] = useState<WinnerEntry[]>(ensureAllPositions(initialWinners));
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [savingWinners, setSavingWinners] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleWinnerChange = (position: number, playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    setWinners((prev) =>
      prev.map((w) =>
        w.position === position
          ? { ...w, playerId, playerAlias: player?.alias || "" }
          : w
      )
    );
  };

  const handleChimucoinsChange = (position: number, value: string) => {
    const coins = parseInt(value) || 0;
    setWinners((prev) =>
      prev.map((w) =>
        w.position === position ? { ...w, chimucoins: coins } : w
      )
    );
  };

  const handleSaveWinners = async () => {
    setSavingWinners(true);
    const validWinners = winners.filter((w) => w.playerId);
    const result = await setTournamentWinners(tournamentId, validWinners);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message || "Error al guardar ganadores");
    }
    setSavingWinners(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPhotos: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          newPhotos.push(data.url);
        }
      } catch (error) {
        toast.error(`Error al subir ${file.name}`);
      }
    }

    if (newPhotos.length > 0) {
      const updated = [...photos, ...newPhotos];
      setPhotos(updated);
      const result = await setTournamentPhotos(tournamentId, updated);
      if (result.success) {
        toast.success(`${newPhotos.length} foto(s) subida(s)`);
        router.refresh();
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleRemovePhoto = async (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    const result = await setTournamentPhotos(tournamentId, updated);
    if (result.success) {
      toast.success("Foto eliminada");
      router.refresh();
    }
  };

  const selectedPlayerIds = winners.map((w) => w.playerId).filter(Boolean);

  return (
    <div className="space-y-8">
      {/* Winners Section */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Ganadores</h3>
            <p className="text-sm text-gray-400">Asigna los ganadores del listado de inscriptos</p>
          </div>
        </div>

        {players.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No hay jugadores inscriptos en este torneo.</p>
        ) : (
          <div className="space-y-3">
            {POSITIONS.map((pos) => {
              const winner = winners.find((w) => w.position === pos.position)!;
              return (
                <div
                  key={pos.position}
                  className={`flex items-center gap-3 p-4 rounded-lg border ${pos.color}`}
                >
                  <span className="text-2xl shrink-0">{pos.icon}</span>
                  <span className="font-bold text-sm min-w-[80px] shrink-0">{pos.label}</span>
                  <select
                    value={winner.playerId}
                    onChange={(e) => handleWinnerChange(pos.position, e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-0"
                  >
                    <option value="">Seleccionar jugador...</option>
                    {players.map((player) => (
                      <option
                        key={player.id}
                        value={player.id}
                        disabled={selectedPlayerIds.includes(player.id) && winner.playerId !== player.id}
                      >
                        {player.alias}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Coins className="w-4 h-4 text-primary" />
                    <input
                      type="number"
                      min="0"
                      value={winner.chimucoins || ""}
                      onChange={(e) => handleChimucoinsChange(pos.position, e.target.value)}
                      placeholder="0"
                      className="w-20 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSaveWinners}
            disabled={savingWinners}
            className="bg-primary text-black hover:bg-yellow-400 font-bold"
          >
            {savingWinners ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Ganadores
          </Button>
        </div>
      </div>

      {/* Photos Section */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Camera className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Fotos del Evento</h3>
              <p className="text-sm text-gray-400">Sube fotos del torneo</p>
            </div>
          </div>
          <label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
              disabled={uploading}
            >
              <span>
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Subir Fotos
              </span>
            </Button>
          </label>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-lg border border-gray-800 border-dashed">
            <Camera className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No hay fotos. Subí fotos del evento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-900 border border-gray-800">
                <Image
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <button
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back */}
      <div className="flex justify-start">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/tournaments")}
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          ← Volver a Torneos
        </Button>
      </div>
    </div>
  );
}
