"use client";

import { useState, useTransition } from "react";
import { Trophy, Clock, Sparkles, Calendar, Gift, Check, Pencil, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updateRaffleWinnerCooldownDays } from "@/app/actions/settings";
import { getRecentRaffleWinners, type RecentWinnerItem } from "@/app/actions/raffles";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RecentWinnersListProps {
  initialWinners: RecentWinnerItem[];
  initialDays: number;
}

export function RecentWinnersList({ initialWinners, initialDays }: RecentWinnersListProps) {
  const [winners, setWinners] = useState<RecentWinnerItem[]>(initialWinners);
  const [days, setDays] = useState<number>(initialDays);
  const [inputDays, setInputDays] = useState<string>(String(initialDays));
  const [isEditingDays, setIsEditingDays] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSaveDays = () => {
    const parsed = parseInt(inputDays, 10);
    if (isNaN(parsed) || parsed < 0) {
      toast.error("Ingresa un número de días válido (0 o más)");
      return;
    }

    startTransition(async () => {
      const res = await updateRaffleWinnerCooldownDays(parsed);
      if (res.success) {
        toast.success(res.message);
        setDays(parsed);
        setIsEditingDays(false);
        // Refresh winners with the new day range
        const updated = await getRecentRaffleWinners(parsed);
        setWinners(updated);
        router.refresh();
      } else {
        toast.error(res.message || "Error al actualizar");
      }
    });
  };

  const handleCancelDays = () => {
    setInputDays(String(days));
    setIsEditingDays(false);
  };

  return (
    <div className="bg-black/40 border border-gray-800 rounded-2xl p-6 backdrop-blur-md space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              Últimos Ganadores
            </h2>
            <p className="text-xs text-gray-400">
              {winners.length} {winners.length === 1 ? "ganador registrado" : "ganadores registrados"} en los últimos {days} días
            </p>
          </div>
        </div>

        {/* Configuration Control */}
        <div className="flex items-center gap-2">
          {isEditingDays ? (
            <div className="flex items-center gap-2 bg-gray-900/90 border border-yellow-500/40 rounded-xl px-3 py-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-200">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-300 font-medium">Margen:</span>
              <input
                type="number"
                min={0}
                max={365}
                value={inputDays}
                onChange={(e) => setInputDays(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveDays();
                  if (e.key === "Escape") handleCancelDays();
                }}
                autoFocus
                disabled={isPending}
                className="w-14 bg-black/80 border border-white/20 rounded px-2 py-0.5 text-xs text-center text-white font-mono focus:border-yellow-400 outline-none"
              />
              <span className="text-xs text-gray-400">días</span>

              <Button
                size="sm"
                onClick={handleSaveDays}
                disabled={isPending}
                className="h-7 px-2.5 text-xs bg-yellow-500 text-black hover:bg-yellow-400 font-bold ml-1"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelDays}
                disabled={isPending}
                className="h-7 px-2 text-xs text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingDays(true)}
              className="group flex items-center gap-2 bg-gray-900/60 hover:bg-gray-800/80 border border-gray-700/60 hover:border-yellow-500/50 rounded-xl px-3.5 py-1.5 transition-all text-xs text-gray-300 hover:text-white"
              title="Click para configurar margen en días"
            >
              <Clock className="w-3.5 h-3.5 text-yellow-500/80 group-hover:text-yellow-400 transition-colors" />
              <span className="text-gray-400">Margen:</span>
              <span className="font-bold text-white font-mono">{days} días</span>
              <Pencil className="w-3 h-3 text-gray-500 group-hover:text-yellow-400 ml-1 transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {winners.length === 0 ? (
        <div className="py-12 px-4 text-center border border-dashed border-gray-800 rounded-xl bg-gray-950/30 space-y-2">
          <Sparkles className="w-8 h-8 text-yellow-500/40 mx-auto" />
          <p className="text-sm font-semibold text-gray-300">
            No hay ganadores registrados en los últimos {days} días
          </p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Cuando se realicen sorteos, los afortunados aparecerán aquí durante el período de {days} días configurado.
          </p>
        </div>
      ) : (
        <div className="border border-gray-800/80 rounded-xl overflow-hidden bg-black/20">
          <Table>
            <TableHeader className="bg-gray-900/60">
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400 font-semibold text-xs">Jugador</TableHead>
                <TableHead className="text-gray-400 font-semibold text-xs">Sorteo</TableHead>
                <TableHead className="text-gray-400 font-semibold text-xs">Premio</TableHead>
                <TableHead className="text-right text-gray-400 font-semibold text-xs">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {winners.map((winner) => (
                <TableRow
                  key={winner.playerId}
                  className="border-gray-800/60 hover:bg-gray-900/30 transition-colors"
                >
                  {/* Jugador */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {winner.image ? (
                        <img
                          src={winner.image}
                          alt={winner.alias}
                          className="w-9 h-9 rounded-full object-cover border border-yellow-500/40 bg-zinc-900"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center justify-center font-bold text-xs">
                          {winner.alias ? winner.alias[0].toUpperCase() : <User className="w-4 h-4" />}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">
                          {winner.alias}
                        </span>
                        {winner.name && (
                          <span className="text-[11px] text-gray-500 truncate max-w-[160px]">
                            {winner.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Sorteo */}
                  <TableCell>
                    <span className="text-sm font-medium text-gray-300">
                      {winner.raffleTitle}
                    </span>
                  </TableCell>

                  {/* Premio */}
                  <TableCell>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold">
                      <Gift className="w-3.5 h-3.5" />
                      <span>{winner.prizeTitle}</span>
                    </div>
                  </TableCell>

                  {/* Fecha */}
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-medium text-gray-300">
                        {formatDate(winner.wonAt)}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {winner.daysRemaining} {winner.daysRemaining === 1 ? "día restante" : "días restantes"}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
