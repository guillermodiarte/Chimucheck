"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  registerPlayerToChallenge,
  unregisterPlayerFromChallenge,
} from "@/app/actions/challenges";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Swords, Loader2, CheckCircle2, AlertCircle, Clock, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChallengeRegistrationButtonProps {
  challengeId: string;
  userId: string;
  registrationStatus?: string | null;
  isRestricted?: boolean;
  isFull?: boolean;
}

export default function ChallengeRegistrationButton({
  challengeId,
  userId,
  registrationStatus,
  isRestricted = false,
  isFull = false,
}: ChallengeRegistrationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleRegister() {
    setIsLoading(true);
    try {
      const result = await registerPlayerToChallenge(challengeId, userId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Ocurrió un error inesperado al inscribirse");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnregister() {
    setIsLoading(true);
    try {
      const result = await unregisterPlayerFromChallenge(challengeId, userId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Ocurrió un error al cancelar la inscripción");
    } finally {
      setIsLoading(false);
    }
  }

  // Already registered: APPROVED
  if (registrationStatus === "APPROVED") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 font-bold text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>¡Estás inscripto en este desafío!</span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={isLoading}
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Cancelar Inscripción
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar inscripción?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Se liberará tu lugar en el desafío y se removerán tus turnos en la cola.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-gray-700 text-white">
                Volver
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUnregister}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Confirmar Cancelación
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Pending approval
  if (registrationStatus === "PENDING") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 font-bold text-sm">
          <Clock className="w-5 h-5 shrink-0" />
          <span>Inscripción en revisión por los organizadores</span>
        </div>
        <Button
          variant="outline"
          onClick={handleUnregister}
          disabled={isLoading}
          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
        >
          Cancelar Solicitud
        </Button>
      </div>
    );
  }

  // Cupo lleno
  if (isFull) {
    return (
      <Button disabled className="w-full bg-gray-800 text-gray-500 cursor-not-allowed font-bold">
        Cupo Máximo Completo
      </Button>
    );
  }

  // Ready to register
  return (
    <Button
      onClick={handleRegister}
      disabled={isLoading}
      className="w-full h-12 bg-primary text-black hover:bg-yellow-400 font-black tracking-wider uppercase text-base shadow-lg transition-all duration-300"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : (
        <Swords className="w-5 h-5 mr-2" />
      )}
      {isRestricted ? "Solicitar Participación" : "Inscribirme al Desafío"}
    </Button>
  );
}

