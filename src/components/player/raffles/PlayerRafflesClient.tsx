"use client";

import { useState, useEffect } from "react";
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
  currentUserId,
}: {
  initialRaffles: PlayerRaffleItem[];
  currentUserId?: string;
}) {
  const [raffles, setRaffles] = useState<PlayerRaffleItem[]>(initialRaffles);
  const [filter, setFilter] = useState<"ALL" | "MINE" | "ACTIVE" | "FINISHED">("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const getRaffleHref = (raffleId: string) => {
    return currentUserId ? `/player/dashboard/raffles/${raffleId}` : `/sorteos/${raffleId}`;
  };

  const handleEnter = async (raffleId: string) => {
    if (!currentUserId) {
      if (typeof window !== "undefined") {
        localStorage.setItem("pending_raffle_enter", raffleId);
      }
      toast.info("Iniciá sesión para completar tu inscripción automáticamente");
      window.dispatchEvent(
        new CustomEvent("open-login-modal", {
          detail: {
            callbackUrl:
              typeof window !== "undefined"
                ? `${window.location.pathname}?autoEnter=${raffleId}`
                : undefined,
          },
        })
      );
      return;
    }

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

  // Auto-inscribir si el usuario viene de iniciar sesión
  useEffect(() => {
    if (!currentUserId) return;

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRaffleId = urlParams.get("autoEnter");
      const storageRaffleId = localStorage.getItem("pending_raffle_enter");
      const targetRaffleId = urlRaffleId || storageRaffleId;

      if (targetRaffleId) {
        localStorage.removeItem("pending_raffle_enter");
        if (urlRaffleId) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("autoEnter");
          window.history.replaceState({}, "", newUrl.toString());
        }

        const target = raffles.find((r) => r.id === targetRaffleId);
        if (target && !target.isEntered && target.status === "ACTIVE" && target.type === "OPEN") {
          handleEnter(targetRaffleId);
        }
      }
    }
  }, [currentUserId]);

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

  const myRaffles = raffles.filter((r) => r.isEntered);
  const activeRaffles = raffles.filter((r) => r.status === "ACTIVE");
  const finishedRaffles = raffles.filter((r) => r.status === "FINISHED");

  // Render a single raffle card
  const renderRaffleCard = (raffle: PlayerRaffleItem) => {
    const isFull = !!(raffle.maxEntries && raffle._count.entries >= raffle.maxEntries);
    const isFinished = raffle.status === "FINISHED";
    const isDrawing = raffle.status === "DRAWING";
    const canEnter = raffle.status === "ACTIVE" && raffle.type === "OPEN" && !raffle.isEntered && !isFull;

    const renderCardActions = (isMobile = false) => (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`space-y-2 ${
          isMobile
            ? "p-3.5 pb-2.5 md:hidden"
            : "pt-2 hidden md:block"
        }`}
      >
        {canEnter && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleEnter(raffle.id);
            }}
            disabled={loadingId === raffle.id}
            className={`w-full bg-secondary text-black hover:bg-yellow-400 font-black rounded-xl shadow-lg shadow-yellow-500/15 gap-2 transition-all transform hover:scale-[1.01] active:scale-95 cursor-pointer ${
              isMobile ? "py-3.5 text-sm" : "py-5 text-sm md:text-base"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {loadingId === raffle.id ? "Inscribiendo..." : "Inscribirme"}
          </Button>
        )}

        {raffle.isEntered && raffle.status === "ACTIVE" && (
          <div className="space-y-2">
            <div className="w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Ya estás participando en este sorteo
            </div>
            <Link href={getRaffleHref(raffle.id)} className="block">
              <Button
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-white/15 hover:border-white/30 font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 text-secondary" />
                Ver detalle del sorteo
              </Button>
            </Link>
            <Button
              disabled={loadingId === raffle.id}
              onClick={(e) => {
                e.stopPropagation();
                handleLeave(raffle.id, raffle.title);
              }}
              className="w-full bg-red-950/30 hover:bg-red-950/60 text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-700/60 font-semibold text-xs py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              Darse de baja
            </Button>
          </div>
        )}

        {raffle.isEntered && (isDrawing || isFinished) && (
          <div className="space-y-2">
            <div className="w-full py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              Participaste en este sorteo
            </div>
            <Link href={getRaffleHref(raffle.id)} className="block">
              <Button
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-yellow-400 hover:text-yellow-300 border border-yellow-500/30 hover:border-yellow-500/50 font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                Ver Resultados del Sorteo
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}

        {!raffle.isEntered && isFull && !isFinished && (
          <Link href={getRaffleHref(raffle.id)} className="block">
            <div className="w-full py-2.5 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-xs font-bold text-center cursor-pointer hover:bg-red-950/50 transition-colors shadow-sm">
              Cupo máximo completado — Ver detalle
            </div>
          </Link>
        )}

        {!raffle.isEntered && raffle.type === "MANUAL" && !isFinished && (
          <Link href={getRaffleHref(raffle.id)} className="block">
            <div className="w-full py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-gray-300 text-xs text-center font-medium cursor-pointer hover:bg-zinc-800 transition-colors shadow-sm">
              Sorteo por invitación — Ver detalle
            </div>
          </Link>
        )}

        {isFinished && !raffle.isEntered && (
          <Link href={getRaffleHref(raffle.id)} className="block">
            <Button
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-yellow-400 hover:text-yellow-300 border border-yellow-500/30 hover:border-yellow-500/60 font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              Ver Resultados del Sorteo
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
      </div>
    );

    return (
      <div
        key={raffle.id}
        onClick={() => router.push(getRaffleHref(raffle.id))}
        className={`group relative rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer ${
          raffle.isEntered
            ? "bg-gradient-to-b from-yellow-500/10 via-zinc-950 to-zinc-950 border-yellow-500/40 shadow-xl shadow-yellow-500/5 hover:border-yellow-500/60"
            : "bg-zinc-950/80 border-white/10 hover:border-white/30 hover:bg-zinc-900/50"
        }`}
      >
        {/* Mobile Actions (Above image on mobile only) */}
        {renderCardActions(true)}

        {/* Image & Header Overlay — Clickable */}
        <Link href={getRaffleHref(raffle.id)} className="block">
          <div className="relative h-48 mx-3.5 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 md:mx-0 md:rounded-none md:border-0">
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
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-zinc-950/85 backdrop-blur-md text-white border border-white/15 shadow-lg">
                {raffle.type === "OPEN" ? "SORTEO ABIERTO" : "EXCLUSIVO / MANUAL"}
              </span>

              <div className="flex items-center gap-1.5">
                {raffle.isEntered && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-black flex items-center gap-1 shadow-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ¡INSCRIPTO!
                  </span>
                )}

                {isFinished && (
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-zinc-950/90 backdrop-blur-md text-yellow-400 border border-yellow-400/70 shadow-xl flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-yellow-400" />
                    FINALIZADO
                  </span>
                )}

                {!isFinished && isDrawing && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-950/90 backdrop-blur-md text-purple-300 border border-purple-500/60 shadow-xl animate-pulse">
                    EN SORTEO
                  </span>
                )}
              </div>
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
          <div className="space-y-2 flex-1">
            <Link href={getRaffleHref(raffle.id)}>
              <h4 className="text-xl font-bold text-white hover:text-secondary transition-colors cursor-pointer">
                {raffle.title}
              </h4>
            </Link>

            {raffle.description && (
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed whitespace-pre-wrap">
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

          {/* Desktop Actions (At bottom as original) */}
          {renderCardActions(false)}
        </div>
      </div>
    );
  };

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
          Mis Inscripciones ({myRaffles.length})
        </button>

        <button
          onClick={() => setFilter("ACTIVE")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${
            filter === "ACTIVE"
              ? "bg-secondary text-black shadow-lg shadow-yellow-500/20"
              : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
          }`}
        >
          Disponibles ({activeRaffles.length})
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
          Historial / Ganadores ({finishedRaffles.length})
        </button>
      </div>

      {/* VIEW: ALL (Diferenciado entre Sorteos Abiertos arriba e Historial de Ganadores abajo) */}
      {filter === "ALL" && (
        <div className="space-y-14">
          {/* SECCIÓN 1: Sorteos Abiertos */}
          <section className="space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-secondary" />
                Sorteos Abiertos
              </h2>
              <span className="text-xs text-gray-400 font-semibold bg-white/5 px-3 py-1 rounded-full border border-white/10">
                {activeRaffles.length} {activeRaffles.length === 1 ? "sorteo disponible" : "sorteos disponibles"}
              </span>
            </div>

            {activeRaffles.length === 0 ? (
              <div className="bg-zinc-950/60 border border-white/10 rounded-2xl p-10 text-center max-w-xl mx-auto space-y-3">
                <Ticket className="w-12 h-12 text-zinc-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No hay sorteos abiertos en este momento</h3>
                <p className="text-gray-400 text-xs">
                  Pronto publicaremos nuevos sorteos oficiales. ¡Mantente atento a la comunidad!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeRaffles.map(renderRaffleCard)}
              </div>
            )}
          </section>

          {/* SECCIÓN 2: Historial de Ganadores */}
          {finishedRaffles.length > 0 && (
            <section className="space-y-5 pt-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  Historial de Ganadores
                </h2>
                <span className="text-xs text-yellow-400/80 font-semibold bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                  {finishedRaffles.length} {finishedRaffles.length === 1 ? "sorteo finalizado" : "sorteos finalizados"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {finishedRaffles.map(renderRaffleCard)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* VIEW: ACTIVE ONLY */}
      {filter === "ACTIVE" && (
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-secondary" />
              Sorteos Disponibles
            </h2>
            <span className="text-xs text-gray-400 font-semibold bg-white/5 px-3 py-1 rounded-full border border-white/10">
              {activeRaffles.length} disponibles
            </span>
          </div>

          {activeRaffles.length === 0 ? (
            <div className="bg-zinc-950/60 border border-white/10 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3">
              <Ticket className="w-14 h-14 text-zinc-700 mx-auto" />
              <h3 className="text-xl font-bold text-white">No hay sorteos abiertos en este momento</h3>
              <p className="text-gray-400 text-sm">
                Pronto publicaremos nuevos sorteos oficiales. ¡Mantente atento!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeRaffles.map(renderRaffleCard)}
            </div>
          )}
        </section>
      )}

      {/* VIEW: FINISHED ONLY */}
      {filter === "FINISHED" && (
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Historial de Ganadores
            </h2>
            <span className="text-xs text-yellow-400/80 font-semibold bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
              {finishedRaffles.length} sorteos finalizados
            </span>
          </div>

          {finishedRaffles.length === 0 ? (
            <div className="bg-zinc-950/60 border border-white/10 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3">
              <Trophy className="w-14 h-14 text-zinc-700 mx-auto" />
              <h3 className="text-xl font-bold text-white">No hay sorteos finalizados todavía</h3>
              <p className="text-gray-400 text-sm">
                Los sorteos concluidos aparecerán aquí con sus ganadores proclamados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {finishedRaffles.map(renderRaffleCard)}
            </div>
          )}
        </section>
      )}

      {/* VIEW: MINE ONLY */}
      {filter === "MINE" && (
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Mis Inscripciones
            </h2>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              {myRaffles.length} inscriptos
            </span>
          </div>

          {myRaffles.length === 0 ? (
            <div className="bg-zinc-950/60 border border-white/10 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
              <Ticket className="w-14 h-14 text-zinc-700 mx-auto" />
              <h3 className="text-xl font-bold text-white">No estás inscripto en ningún sorteo</h3>
              <p className="text-gray-400 text-sm">
                {currentUserId
                  ? "Aún no te has inscripto en ningún sorteo. ¡Revisá los disponibles y sumate!"
                  : "Inicia sesión con tu cuenta para ver y gestionar tus inscripciones."}
              </p>
              {!currentUserId && (
                <Button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("open-login-modal", {
                        detail: { callbackUrl: "/sorteos" },
                      })
                    )
                  }
                  className="bg-secondary text-black hover:bg-yellow-400 font-bold text-xs mt-2"
                >
                  Iniciar Sesión
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRaffles.map(renderRaffleCard)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
