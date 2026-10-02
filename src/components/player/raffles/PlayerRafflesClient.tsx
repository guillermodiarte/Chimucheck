"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Gift,
  Users,
  Sparkles,
  Calendar,
  CheckCircle2,
  Trophy,
  LogOut,
  Ticket,
  ArrowRight,
} from "lucide-react";
import { enterRaffle, leaveRaffle } from "@/app/actions/raffles";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PlayerRaffleItem {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  prizeImage: string | null;
  type: string;
  status: string;
  maxEntries: number | null;
  drawDate: string | Date | null;
  winnerAlias: string | null;
  winnerImage: string | null;
  _count: {
    entries: number;
  };
  isEntered: boolean;
  myEntryDate: string | Date | null;
  prizes?: Array<{
    id: string;
    title: string;
    order: number;
    winnerAlias: string | null;
  }>;
}

export function PlayerRafflesClient({
  initialRaffles,
}: {
  initialRaffles: PlayerRaffleItem[];
  currentUserId?: string;
}) {
  const [raffles, setRaffles] = useState<PlayerRaffleItem[]>(initialRaffles);
  const [filter, setFilter] = useState<"ALL" | "MINE" | "ACTIVE" | "FINISHED">("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleEnter = async (raffleId: string) => {
    setLoadingId(raffleId);
    const res = await enterRaffle(raffleId);
    setLoadingId(null);

    if (res.success) {
      toast.success(res.message || "¡Inscripción exitosa!");
      setRaffles((prev) =>
        prev.map((r) =>
          r.id === raffleId
            ? {
                ...r,
                isEntered: true,
                _count: { entries: r._count.entries + 1 },
                myEntryDate: new Date(),
              }
            : r
        )
      );
      router.refresh();
    } else {
      toast.error(res.message || "Error al inscribirse");
    }
  };

  const handleLeave = async (raffleId: string, title: string) => {
    if (!confirm(`¿Estás seguro de darte de baja del sorteo "${title}"?`)) return;

    setLoadingId(raffleId);
    const res = await leaveRaffle(raffleId);
    setLoadingId(null);

    if (res.success) {
      toast.success("Te has retirado del sorteo");
      setRaffles((prev) =>
        prev.map((r) =>
          r.id === raffleId
            ? {
                ...r,
                isEntered: false,
                _count: { entries: Math.max(0, r._count.entries - 1) },
                myEntryDate: null,
              }
            : r
        )
      );
      router.refresh();
    } else {
      toast.error(res.message || "Error al retirarse");
    }
  };

  const myRafflesCount = raffles.filter((r) => r.isEntered).length;
  const activeCount = raffles.filter((r) => r.status === "ACTIVE").length;

  const filtered = raffles.filter((r) => {
    if (filter === "MINE") return r.isEntered;
    if (filter === "ACTIVE") return r.status === "ACTIVE";
    if (filter === "FINISHED") return r.status === "FINISHED";
    return true;
  });

  return (
    <div className="space-y-8">
      {/* FILTER TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${
            filter === "ALL"
              ? "bg-secondary text-black shadow-lg shadow-yellow-500/20"
              : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          Todos los Sorteos ({raffles.length})
        </button>

        <button
          onClick={() => setFilter("MINE")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 flex items-center gap-2 ${
            filter === "MINE"
              ? "bg-secondary text-black shadow-lg shadow-yellow-500/20"
              : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Mis Inscripciones ({myRafflesCount})
        </button>

        <button
          onClick={() => setFilter("ACTIVE")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${
            filter === "ACTIVE"
              ? "bg-secondary text-black shadow-lg shadow-yellow-500/20"
              : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          Disponibles ({activeCount})
        </button>

        <button
          onClick={() => setFilter("FINISHED")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            filter === "FINISHED"
              ? "bg-secondary text-black shadow-lg shadow-yellow-500/20"
              : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Historial / Ganadores
        </button>
      </div>

      {/* RAFFLE CARDS GRID */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-950/60 border border-white/10 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
          <Ticket className="w-16 h-16 text-zinc-700 mx-auto" />
          <h3 className="text-xl font-bold text-white">No hay sorteos en esta sección</h3>
          <p className="text-gray-400 text-sm">
            {filter === "MINE"
              ? "Aún no te has inscripto en ningún sorteo. ¡Revisa los disponibles y participa!"
              : "Pronto anunciaremos nuevos sorteos con grandes premios."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((raffle) => {
            const isFull = !!(raffle.maxEntries && raffle._count.entries >= raffle.maxEntries);
            const isFinished = raffle.status === "FINISHED";
            const isDrawing = raffle.status === "DRAWING";
            const canEnter = raffle.status === "ACTIVE" && raffle.type === "OPEN" && !raffle.isEntered && !isFull;

            return (
              <div
                key={raffle.id}
                className={`group relative rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                  raffle.isEntered
                    ? "bg-gradient-to-b from-yellow-500/10 via-zinc-950 to-zinc-950 border-yellow-500/40 shadow-xl shadow-yellow-500/5"
                    : "bg-zinc-950/80 border-white/10 hover:border-white/20"
                }`}
              >
                {/* Image & Header Overlay — Clickable */}
                <Link href={`/player/dashboard/raffles/${raffle.id}`} className="block">
                <div className="relative h-48 w-full bg-zinc-900 overflow-hidden">
                  {raffle.prizeImage ? (
                    <img
                      src={raffle.prizeImage}
                      alt={raffle.prize}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black text-secondary">
                      <Gift className="w-16 h-16 opacity-60" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                  {/* Badges on top */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/10">
                      {raffle.type === "OPEN" ? "SORTEO ABIERTO" : "EXCLUSIVO / MANUAL"}
                    </span>

                    {raffle.isEntered && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-black flex items-center gap-1 shadow-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ¡INSCRIPTO!
                      </span>
                    )}

                    {!raffle.isEntered && isFinished && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                        FINALIZADO
                      </span>
                    )}

                    {!raffle.isEntered && isDrawing && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/30 text-purple-300 border border-purple-500/50 animate-pulse">
                        EN SORTEO
                      </span>
                    )}
                  </div>

                  {/* Prize text inside image gradient */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[11px] uppercase tracking-wider text-secondary font-bold flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" /> Premio en juego
                    </span>
                    <h3 className="text-lg font-black text-white truncate drop-shadow flex items-center justify-between">
                      <span className="truncate">{raffle.prize}</span>
                      {raffle.prizes && raffle.prizes.length > 1 && (
                        <span className="text-[11px] bg-yellow-400 text-black font-mono font-black px-2 py-0.5 rounded-full ml-2 shrink-0 shadow">
                          +{raffle.prizes.length - 1} más
                        </span>
                      )}
                    </h3>
                  </div>
                </div>
                </Link>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <Link href={`/player/dashboard/raffles/${raffle.id}`}>
                      <h4 className="text-xl font-bold text-white hover:text-secondary transition-colors cursor-pointer">
                        {raffle.title}
                      </h4>
                    </Link>

                    {raffle.description && (
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {raffle.description}
                      </p>
                    )}
                  </div>

                  {/* Winner Display if finished */}
                  {isFinished && raffle.winnerAlias && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-3">
                      {raffle.winnerImage ? (
                        <img
                          src={raffle.winnerImage}
                          alt={raffle.winnerAlias}
                          className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold text-base">
                          🏆
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-yellow-400 tracking-wider">
                          Ganador Oficial
                        </span>
                        <p className="font-black text-white text-sm">
                          {raffle.winnerAlias}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Metadata Ticker */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-white font-semibold">
                        {raffle._count.entries}
                      </span>
                      {raffle.maxEntries && (
                        <span>/ {raffle.maxEntries} participantes</span>
                      )}
                      {!raffle.maxEntries && <span>participantes</span>}
                    </div>

                    {raffle.drawDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span suppressHydrationWarning>{formatDate(raffle.drawDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 space-y-2">
                    {canEnter && (
                      <>
                        <Link href={`/player/dashboard/raffles/${raffle.id}`}>
                          <Button
                            className="w-full bg-secondary text-black hover:bg-yellow-400 font-bold py-5 rounded-xl shadow-lg shadow-yellow-500/15 gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Ver Sorteo e Inscribirme
                          </Button>
                        </Link>
                      </>
                    )}

                    {raffle.isEntered && raffle.status === "ACTIVE" && (
                      <div className="space-y-2">
                        <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Ya estás participando en este sorteo
                        </div>
                        <Link href={`/player/dashboard/raffles/${raffle.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-gray-400 hover:text-white hover:bg-white/10 gap-1.5"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            Ver detalle del sorteo
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loadingId === raffle.id}
                          onClick={() => handleLeave(raffle.id, raffle.title)}
                          className="w-full text-xs text-gray-400 hover:text-red-400 hover:bg-red-950/20"
                        >
                          <LogOut className="w-3.5 h-3.5 mr-1" />
                          Darse de baja
                        </Button>
                      </div>
                    )}

                    {raffle.isEntered && (isDrawing || isFinished) && (
                      <div className="space-y-2">
                        <div className="w-full py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold text-center">
                          Participaste en este sorteo
                        </div>
                        <Link href={`/player/dashboard/raffles/${raffle.id}`}>
                          <Button variant="ghost" size="sm" className="w-full text-xs text-gray-400 hover:text-white gap-1.5">
                            <ArrowRight className="w-3.5 h-3.5" /> Ver detalle
                          </Button>
                        </Link>
                      </div>
                    )}

                    {!raffle.isEntered && isFull && !isFinished && (
                      <Link href={`/player/dashboard/raffles/${raffle.id}`}>
                        <div className="w-full py-2.5 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-bold text-center cursor-pointer hover:bg-red-950/40 transition-colors">
                          Cupo máximo completado — Ver detalle
                        </div>
                      </Link>
                    )}

                    {!raffle.isEntered && raffle.type === "MANUAL" && !isFinished && (
                      <Link href={`/player/dashboard/raffles/${raffle.id}`}>
                        <div className="w-full py-2.5 rounded-xl bg-zinc-900 border border-white/5 text-gray-400 text-xs text-center font-medium cursor-pointer hover:bg-zinc-800 transition-colors">
                          Sorteo por invitación — Ver detalle
                        </div>
                      </Link>
                    )}

                    {isFinished && !raffle.isEntered && (
                      <Link href={`/player/dashboard/raffles/${raffle.id}`}>
                        <Button variant="ghost" size="sm" className="w-full text-xs text-gray-400 hover:text-white gap-1.5">
                          <ArrowRight className="w-3.5 h-3.5" /> Ver resultado
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
