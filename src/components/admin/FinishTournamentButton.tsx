"use client";

import { finishTournament } from "@/app/actions/tournaments";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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

export function FinishTournamentButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  const handleFinish = async () => {
    const result = await finishTournament(id);
    if (result.success) {
      toast.success(`Torneo "${name}" finalizado`);
      router.refresh();
    } else {
      toast.error(result.message || "Error al finalizar");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20" title="Finalizar torneo">
          <Flag className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Finalizar torneo?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            El torneo <strong>{name}</strong> pasará a la sección de &quot;Finalizados&quot; donde podrás asignar ganadores y subir fotos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-gray-700 text-white hover:bg-gray-800">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleFinish} className="bg-yellow-600 hover:bg-yellow-700 text-white border-0">
            Finalizar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
