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
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
      setShowModal(false);
    }
  }

  return (
    <>
      {/* Badge with hover effect */}
      <div
        onClick={() => setShowModal(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`w-full py-4 rounded-xl text-center font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${isHovered
          ? "bg-red-500/10 border border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
          : "bg-green-500/10 border border-green-500/30 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
          }`}
      >
        {isHovered ? (
          <>
            <XCircle className="w-5 h-5" />
            CANCELAR INSCRIPCIÓN
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            YA ESTÁS INSCRITO
          </>
        )}
      </div>

      {/* Modal overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">¿Cancelar inscripción?</h3>
              <p className="text-sm text-gray-400">
                Vas a perder tu lugar en este torneo. Podés volver a inscribirte si hay cupo disponible.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleUnregister}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Sí, cancelar
              </Button>
              <Button
                onClick={() => setShowModal(false)}
                disabled={isLoading}
                variant="outline"
                className="flex-1 bg-white text-black hover:bg-gray-200 font-bold"
              >
                No, quedarme
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
