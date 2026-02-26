
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { registerPlayer } from "@/app/actions/tournaments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Swords, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface RegistrationButtonProps {
  tournamentId: string;
  userId: string;
  registrationStatus?: string | null;
  isRestricted?: boolean;
}

export default function RegistrationButton({
  tournamentId,
  userId,
  registrationStatus,
  isRestricted = false
}: RegistrationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  async function handleRegister() {
    setIsLoading(true);
    try {
      const result = await registerPlayer(tournamentId, userId);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
      setShowModal(false);
    }
  }

  if (registrationStatus === "REJECTED") {
    return (
      <Button
        disabled
        className="w-full bg-red-900/50 text-red-200 border border-red-500/30 font-bold text-lg py-6 cursor-not-allowed"
      >
        <AlertCircle className="w-6 h-6 mr-2" />
        Inscripción Rechazada
      </Button>
    );
  }

  if (registrationStatus === "PENDING") {
    return (
      <Button
        disabled
        className="w-full bg-gray-800 text-gray-400 border border-gray-700 font-bold text-lg py-6 cursor-not-allowed"
      >
        <Clock className="w-6 h-6 mr-2" />
        Inscripción Pendiente
      </Button>
    );
  }

  // If approved or confirmed, this component wouldn't be shown (Unregister button shows instead)
  // We only show this if they are not registered at all.

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="w-full bg-primary text-black hover:bg-yellow-400 font-bold text-lg py-6 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all transform hover:-translate-y-1"
      >
        <Swords className="w-6 h-6 mr-2" />
        ¡Inscribirme Ahora!
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Swords className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white">¿Inscribirte al torneo?</h3>
              <p className="text-sm text-gray-400">
                {isRestricted
                  ? "Este torneo requiere aprobación. Tu solicitud quedará pendiente hasta que un administrador la revise."
                  : "Vas a confirmar tu inscripción a este torneo. ¡Preparate para competir!"}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRegister}
                disabled={isLoading}
                className="flex-1 bg-primary text-black hover:bg-yellow-400 font-bold"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Sí, inscribirme
              </Button>
              <Button
                onClick={() => setShowModal(false)}
                disabled={isLoading}
                className="flex-1 bg-white text-black hover:bg-gray-200 font-bold"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
