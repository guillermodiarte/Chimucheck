"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserPlus, Sparkles, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { addManualPlayerToChallenge } from "@/app/actions/challenges";

interface AddManualPlayerModalProps {
  challengeId: string;
  isOpen: boolean;
  onClose: () => void;
  availablePlayers?: { id: string; alias?: string | null; name?: string | null; image?: string | null }[];
  onPlayerAdded?: () => void;
}

export function AddManualPlayerModal({
  challengeId,
  isOpen,
  onClose,
  availablePlayers = [],
  onPlayerAdded,
}: AddManualPlayerModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"quick" | "catalog">("quick");
  const [alias, setAlias] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload =
        mode === "quick"
          ? { alias: alias.trim() }
          : { playerId: selectedPlayerId };

      if (mode === "quick" && !alias.trim()) {
        toast.error("Ingresa el nombre o alias del jugador");
        setIsSubmitting(false);
        return;
      }

      if (mode === "catalog" && !selectedPlayerId) {
        toast.error("Selecciona un jugador del catálogo");
        setIsSubmitting(false);
        return;
      }

      const result = await addManualPlayerToChallenge(challengeId, payload);
      if (result.success) {
        toast.success(result.message);
        setAlias("");
        setSelectedPlayerId("");
        onClose();
        if (onPlayerAdded) onPlayerAdded();
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Error al agregar jugador");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Agregar Jugador Manual</DialogTitle>
              <DialogDescription className="text-gray-400 text-xs">
                Suma jugadores directamente al desafío para probar la cola de turnos y puntajes.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab switch: Quick vs Catalog */}
        <div className="flex gap-1 bg-gray-800/80 p-1 rounded-lg border border-gray-700">
          <button
            type="button"
            onClick={() => setMode("quick")}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === "quick"
                ? "bg-primary text-black shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Crear Rápido (Pruebas)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("catalog")}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === "catalog"
                ? "bg-primary text-black shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Del Catálogo ({availablePlayers.length})</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {mode === "quick" ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">
                Nombre o Nickname del Jugador
              </label>
              <Input
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Ej: Pepe, Juan, Lola, Guille..."
                className="bg-gray-800 border-gray-700 text-white"
                autoFocus
              />
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Ingresa cualquier nombre de prueba. Se añadirá inmediatamente a la cola de turnos con <strong>0 partidas jugadas</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">
                Seleccionar Jugador Registrado
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white h-10 px-3 rounded-md text-sm focus:border-primary/50"
              >
                <option value="">Selecciona un jugador...</option>
                {availablePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.alias || p.name || "Sin nombre"} {p.name && p.alias ? `(${p.name})` : ""}
                  </option>
                ))}
              </select>
              {availablePlayers.length === 0 && (
                <p className="text-[11px] text-yellow-500/80">
                  No hay otros jugadores registrados disponibles para agregar. Utiliza la opción de &quot;Crear Rápido&quot;.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-black hover:bg-yellow-400 font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Agregar al Desafío
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

