"use client";

import { useState, useTransition } from "react";
import { updateTournamentStatus } from "@/app/actions/tournament-status";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { TournamentStatus } from "@prisma/client";

interface StatusBadgeProps {
  id: string;
  status: TournamentStatus;
}

const statusConfig = {
  OPEN: { label: "Abierto", color: "bg-green-500/20 text-green-400 border-green-500/50" },
  REGISTRATION: { label: "Inscripción", color: "bg-blue-500/20 text-blue-400 border-blue-500/50" },
  IN_PROGRESS: { label: "En Curso", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" },
  FINISHED: { label: "Finalizado", color: "bg-red-500/20 text-red-400 border-red-500/50" },
};

export function StatusBadge({ id, status: initialStatus }: StatusBadgeProps) {
  const [status, setStatus] = useState<TournamentStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: TournamentStatus) => {
    if (newStatus === status) return;

    startTransition(async () => {
      const result = await updateTournamentStatus(id, newStatus);
      if (result.success) {
        setStatus(newStatus);
        toast.success(`Estado actualizado a ${statusConfig[newStatus].label}`);
      } else {
        toast.error("Error al actualizar estado");
      }
    });
  };

  const currentConfig = statusConfig[status] || { label: status, color: "bg-gray-500/20 text-gray-400" };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isPending}>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 text-xs border ${currentConfig.color} hover:bg-opacity-80 px-2 gap-1 rounded-full`}
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : currentConfig.label}
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
        {(Object.keys(statusConfig) as TournamentStatus[]).map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => handleStatusChange(s)}
            className="text-white hover:bg-zinc-800 cursor-pointer flex justify-between"
          >
            {statusConfig[s].label}
            {status === s && <Check className="w-3 h-3 text-primary ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
