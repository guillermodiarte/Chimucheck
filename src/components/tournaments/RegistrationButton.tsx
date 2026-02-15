
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { registerPlayer } from "@/app/actions/tournaments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Swords, Loader2 } from "lucide-react";

interface RegistrationButtonProps {
  tournamentId: string;
  userId: string;
}

export default function RegistrationButton({ tournamentId, userId }: RegistrationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
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
    }
  }

  return (
    <Button
      onClick={handleRegister}
      disabled={isLoading}
      className="w-full bg-primary text-black hover:bg-yellow-400 font-bold text-lg py-6 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all transform hover:-translate-y-1"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Inscribiendo...
        </>
      ) : (
        <>
          <Swords className="w-6 h-6 mr-2" />
          ¡Inscribirme Ahora!
        </>
      )}
    </Button>
  );
}
