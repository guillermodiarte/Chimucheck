"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { unregisterPlayer } from "@/app/actions/tournaments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface UnregisterButtonProps {
  tournamentId: string;
  userId: string;
}

export default function UnregisterButton({ tournamentId, userId }: UnregisterButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  async function handleUnregister() {
    setIsLoading(true);
    try {
      const result = await unregisterPlayer(tournamentId, userId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-center text-gray-400">
          ¿Seguro que querés cancelar tu inscripción?
        </p>
        <div className="flex gap-2">
          <Button
            onClick={handleUnregister}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            Sí, cancelar
          </Button>
          <Button
            onClick={() => setShowConfirm(false)}
            disabled={isLoading}
            variant="outline"
            className="flex-1 border-white/10 text-white hover:bg-white/5 font-bold"
          >
            No, quedarme
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="w-full py-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center text-green-400 font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
        <CheckCircle2 className="w-5 h-5" />
        YA ESTÁS INSCRITO
      </div>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full text-xs text-gray-500 hover:text-red-400 transition-colors py-1 cursor-pointer"
      >
        Cancelar inscripción
      </button>
    </div>
  );
}
