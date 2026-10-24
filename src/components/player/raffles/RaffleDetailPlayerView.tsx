"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Gift,
  Users,
  Sparkles,
  Calendar,
  CheckCircle2,
  Trophy,
  LogOut,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Crown,
  Ticket,
  Clock,
  ShieldCheck,
  Search,
  User,
  Maximize2,
  X,
} from "lucide-react";
import { enterRaffle, leaveRaffle } from "@/app/actions/raffles";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface RaffleParticipant {
  id: string;
  playerId: string;
  enteredAt: string | Date;
  player: {
    id: string;
    alias: string | null;
    name: string | null;
    image: string | null;
  };
}

export interface PlayerRaffleDetail {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  prizeImage: string | null;
  images: string | null;
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
  entries?: RaffleParticipant[];
  prizes?: Array<{
    id: string;
    title: string;
    description: string | null;
    image: string | null;
    order: number;
    winnerId: string | null;
    winnerAlias: string | null;
    winnerImage: string | null;
  }>;
}

interface CurrentUser {
  id: string;
  name: string | null;
  alias: string | null;
  image: string | null;
}

function formatEntryTime(dateStr: string | Date): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "reciente";
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "hace instantes";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `hace ${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `hace ${diffDays}d`;
    return formatDateTime(date);
  } catch {
    return "";
  }
}

export function RaffleDetailPlayerView({
  raffle: initialRaffle,
  isLoggedIn = true,
  currentUser,
}: {
  raffle: PlayerRaffleDetail;
  isLoggedIn?: boolean;
  currentUser?: CurrentUser | null;
}) {
  const router = useRouter();
  const [raffle, setRaffle] = useState<PlayerRaffleDetail>(initialRaffle);
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreenImageOpen, setIsFullscreenImageOpen] = useState(false);

  // Keep state synced if props change
  useEffect(() => {
    setRaffle(initialRaffle);
  }, [initialRaffle]);

  // Parse images array
  const imageList: string[] = (() => {
    if (raffle.images) {
      try {
        const parsed = JSON.parse(raffle.images);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    if (raffle.prizeImage) return [raffle.prizeImage];
    return [];
  })();

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % imageList.length);
  };

  const isFull = !!(raffle.maxEntries && raffle._count.entries >= raffle.maxEntries);
  const isFinished = raffle.status === "FINISHED";
  const isDrawing = raffle.status === "DRAWING";
  const canEnter = raffle.status === "ACTIVE" && raffle.type === "OPEN" && !raffle.isEntered && !isFull;

  const participants = raffle.entries || [];

  const myEntryIndex = currentUser?.id
    ? participants.findIndex((p) => p.playerId === currentUser.id)
    : -1;
  const myTicketNumber = myEntryIndex >= 0 ? myEntryIndex + 1 : null;

  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants;
    const q = searchQuery.toLowerCase();
    return participants.filter((p) => {
      const alias = (p.player?.alias || "").toLowerCase();
      const name = (p.player?.name || "").toLowerCase();
      return alias.includes(q) || name.includes(q);
    });
  }, [participants, searchQuery]);

  const PAGE_SIZE = 32;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery]);

  const displayedParticipants = useMemo(() => {
    return filteredParticipants.slice(0, visibleCount);
  }, [filteredParticipants, visibleCount]);

  const hasMore = visibleCount < filteredParticipants.length;

  const handleScrollParticipants = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredParticipants.length));
    }
  };

  const handleEnter = async () => {
    if (!isLoggedIn) {
      window.dispatchEvent(
        new CustomEvent("open-login-modal", {
          detail: {
            callbackUrl:
              typeof window !== "undefined"
                ? `${window.location.pathname}${window.location.search}`
                : undefined,
          },
        })
      );
      return;
    }

    setLoadingAction(true);
    const res = await enterRaffle(raffle.id);
    setLoadingAction(false);

    if (res.success) {
      toast.success(res.message || "¡Inscripción exitosa!");
      const newEntry: RaffleParticipant = {
        id: "temp-" + Date.now(),
        playerId: currentUser?.id || "temp",
        enteredAt: new Date(),
        player: {
          id: currentUser?.id || "temp",
          alias: currentUser?.alias || null,
          name: currentUser?.name || null,
          image: currentUser?.image || null,
        },
      };

      setRaffle((prev) => ({
        ...prev,
        isEntered: true,
        _count: { entries: prev._count.entries + 1 },
        entries: [...(prev.entries || []), newEntry],
        myEntryDate: new Date(),
      }));
      router.refresh();
    } else {
      toast.error(res.message || "Error al inscribirse");
    }
  };

  const handleLeave = async () => {
    if (!confirm(`¿Estás seguro de darte de baja del sorteo "${raffle.title}"?`)) return;

    setLoadingAction(true);
    const res = await leaveRaffle(raffle.id);
    setLoadingAction(false);

    if (res.success) {
      toast.success("Te has retirado del sorteo");
      setRaffle((prev) => ({
        ...prev,
        isEntered: false,
        _count: { entries: Math.max(0, prev._count.entries - 1) },
        entries: (prev.entries || []).filter((e) => e.playerId !== currentUser?.id),
        myEntryDate: null,
      }));
      router.refresh();
    } else {
      toast.error(res.message || "Error al retirarse");
    }
  };

  const renderActionButtons = () => (
    <div className="space-y-2.5">
      {canEnter && (
        <Button
          disabled={loadingAction}
          onClick={handleEnter}
          className="w-full bg-secondary text-black hover:bg-yellow-400 font-black py-6 text-base rounded-xl shadow-lg shadow-yellow-500/20 gap-2 transition-all transform hover:scale-[1.01] active:scale-98 cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          {loadingAction ? "Inscribiendo..." : "¡Inscribirme en este Sorteo!"}
        </Button>
      )}

      {raffle.isEntered && raffle.status === "ACTIVE" && (
        <div className="space-y-2.5">
          <div className="w-full p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex flex-col items-center justify-center text-center gap-1 shadow-lg">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>¡Ya estás participando en este sorteo!</span>
            </div>
            {myTicketNumber && (
              <span className="text-[11px] font-mono text-emerald-300 font-normal">
                Tu número de ticket asignado: <strong className="text-white font-bold">#{myTicketNumber}</strong>
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={loadingAction}
            onClick={handleLeave}
            className="w-full text-xs text-gray-400 hover:text-red-400 hover:bg-red-950/20 py-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Darse de baja del sorteo
          </Button>
        </div>
      )}

      {!raffle.isEntered && isFull && !isFinished && (
        <div className="w-full py-3 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-xs font-bold text-center">
          El cupo máximo de participantes ha sido alcanzado.
        </div>
      )}

      {!raffle.isEntered && raffle.type === "MANUAL" && !isFinished && (
        <div className="w-full py-3 rounded-xl bg-zinc-900 border border-white/10 text-gray-400 text-xs text-center font-medium">
          Sorteo exclusivo por invitación del organizador.
        </div>
      )}

      {isFinished && !raffle.isEntered && (
        <div className="w-full py-3 rounded-xl bg-zinc-900 border border-white/10 text-yellow-400 text-xs font-bold text-center">
          Este sorteo ha finalizado.
        </div>
      )}
    </div>
  );

  const backUrl = isLoggedIn ? "/player/dashboard/raffles" : "/sorteos";

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Header Row with Back Link and Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-xs font-semibold transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 backdrop-blur-md w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a todos los sorteos
        </Link>

        {/* Badges on right */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              raffle.status === "ACTIVE"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : raffle.status === "DRAWING"
                ? "bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse"
                : raffle.status === "FINISHED"
                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                : "bg-zinc-800 text-gray-400 border-zinc-700"
            }`}
          >
            {raffle.status === "ACTIVE"
              ? "🟢 Sorteo Activo"
              : raffle.status === "DRAWING"
              ? "🎲 En Sorteo"
              : raffle.status === "FINISHED"
              ? "🏆 Finalizado"
              : "Borrador"}
          </span>

          <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
            {raffle.type === "OPEN" ? "Sorteo Abierto" : "Exclusivo / Manual"}
          </span>

          {raffle.isEntered && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ¡Estás Inscripto! {myTicketNumber ? `#${myTicketNumber}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Main 2-Column Split: Left 7 cols, Right 5 cols (Sticky) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN (7 cols): Images + Description + Participants ── */}
        <div className="lg:col-span-7 space-y-5">
          {/* Mobile Top Hero & Action Card (Mobile only) */}
          <div className="lg:hidden bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-zinc-950 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-2xl space-y-3.5">
            {/* Header Tag & Date */}
            <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-secondary" />
                {raffle.type === "OPEN" ? "Sorteo Abierto" : "Sorteo Exclusivo"}
              </span>
              {raffle.drawDate ? (
                <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1" suppressHydrationWarning>
                  <Calendar className="w-3.5 h-3.5 text-secondary/80" />
                  {formatDate(raffle.drawDate)}
                </span>
              ) : (
                <span className="text-[11px] font-mono text-gray-500">Fecha a confirmar</span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {raffle.title}
            </h1>

            {/* Quick stats & status pills */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-black/40 border border-white/5">
                <Users className="w-4 h-4 text-secondary shrink-0" />
                <div className="truncate">
                  <span className="text-white font-bold">{raffle._count.entries}</span>
                  {raffle.maxEntries && (
                    <span className="text-gray-500 font-mono text-[10px]"> / {raffle.maxEntries}</span>
                  )}
                  <span className="text-gray-400 text-[10px] block">Participantes</span>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-black/40 border border-white/5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="text-emerald-400 font-bold block text-[11px]">Verificado</span>
                  <span className="text-gray-500 text-[10px] block">100% Oficial</span>
                </div>
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="pt-1">
              {renderActionButtons()}
            </div>
          </div>

          {/* Image Gallery Showcase */}
          <div className="space-y-3">
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl flex items-center justify-center group">
              {imageList.length > 0 ? (
                <>
                  <img
                    src={imageList[activeImageIndex] || imageList[0]}
                    alt={raffle.title}
                    className="w-full h-full object-cover transition-transform duration-500 cursor-pointer"
                    onClick={() => setIsFullscreenImageOpen(true)}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                  {/* Badges on top */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/10">
                      {raffle.type === "OPEN" ? "SORTEO ABIERTO" : "MANUAL / EXCLUSIVO"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsFullscreenImageOpen(true)}
                      className="pointer-events-auto bg-black/70 hover:bg-black text-white p-2 rounded-full border border-white/20 transition-all opacity-80 hover:opacity-100 hover:scale-105 shadow-lg cursor-pointer"
                      title="Ver en pantalla completa"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Navigation arrows if multiple images */}
                  {imageList.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white p-2 rounded-full border border-white/20 transition-all opacity-80 hover:opacity-100 hover:scale-110 shadow-xl cursor-pointer"
                        title="Imagen anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white p-2 rounded-full border border-white/20 transition-all opacity-80 hover:opacity-100 hover:scale-110 shadow-xl cursor-pointer"
                        title="Imagen siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Image counter pill */}
                  {imageList.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-mono text-gray-300 border border-white/10">
                      {activeImageIndex + 1} / {imageList.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-10 space-y-2">
                  <Gift className="w-16 h-16 text-secondary mx-auto opacity-50" />
                  <h4 className="text-sm font-bold text-gray-400">Sin imágenes cargadas</h4>
                </div>
              )}
            </div>

            {/* Thumbnails list if multiple images */}
            {imageList.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto p-1 custom-scrollbar">
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-secondary ring-2 ring-secondary/40 scale-105"
                        : "border-white/10 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description / Rules Section (if exists) */}
          {raffle.description && (
            <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-2 shadow-xl">
              <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-secondary flex items-center gap-2">
                <Ticket className="w-4 h-4 text-secondary" />
                Descripción y Bases del Sorteo
              </h3>
              <div className="text-gray-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap border-t border-white/5 pt-3">
                {raffle.description}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (5 cols): Sticky Sidebar with Details, Prizes & Actions ── */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          {/* Main Info & Action Card */}
          <div className="bg-zinc-950/90 border border-white/10 rounded-2xl p-5 md:p-6 backdrop-blur-md shadow-2xl space-y-5">
            {/* Title (Desktop only, mobile has it in top Hero card) */}
            <div className="space-y-1.5 border-b border-white/10 pb-4 hidden lg:block">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {raffle.title}
              </h1>
            </div>

            {/* Winner Spotlight (If Finished) */}
            {isFinished && raffle.winnerAlias && (
              <div className="bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-yellow-500/15 border border-yellow-500/40 rounded-xl p-4 flex items-center gap-3.5 shadow-lg">
                <div className="relative">
                  {raffle.winnerImage ? (
                    <img
                      src={raffle.winnerImage}
                      alt={raffle.winnerAlias}
                      className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black text-lg">
                      🏆
                    </div>
                  )}
                  <Crown className="w-4 h-4 text-yellow-400 absolute -top-2 -right-1" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-yellow-400 tracking-wider">
                    ¡Ganador del Sorteo!
                  </span>
                  <p className="text-base font-black text-white">{raffle.winnerAlias}</p>
                </div>
              </div>
            )}

            {/* Quick Stats: Participantes & Draw Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-secondary" /> Participantes
                </span>
                <p className="text-xl font-black text-white">
                  {raffle._count.entries}
                  {raffle.maxEntries && (
                    <span className="text-xs text-gray-400 font-normal"> / {raffle.maxEntries}</span>
                  )}
                </p>
                {participants.length > 0 && (
                  <div className="flex items-center -space-x-1.5 pt-0.5 overflow-hidden">
                    {participants.slice(0, 4).map((p, idx) => (
                      <Avatar key={p.id || idx} className="w-5 h-5 border border-black shrink-0">
                        <AvatarImage src={p.player?.image || ""} />
                        <AvatarFallback className="text-[8px] bg-secondary/30 text-secondary font-bold">
                          {(p.player?.alias || p.player?.name || "J")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {participants.length > 4 && (
                      <span className="text-[9px] text-gray-400 pl-2 font-semibold">
                        +{participants.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-secondary" /> Fecha Sorteo
                </span>
                {raffle.drawDate ? (
                  <>
                    <p className="text-xs font-bold text-white truncate" suppressHydrationWarning>
                      {formatDate(raffle.drawDate)}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {new Date(raffle.drawDate).getHours().toString().padStart(2, "0")}:
                      {new Date(raffle.drawDate).getMinutes().toString().padStart(2, "0")} hs
                    </p>
                  </>
                ) : (
                  <p className="text-xs font-bold text-gray-400">A confirmar</p>
                )}
              </div>
            </div>

            {/* Action Button Section (Desktop only - below stats as original) */}
            <div className="space-y-2.5 pt-1 hidden lg:block">
              {renderActionButtons()}
            </div>

            {/* ChimuCheck Verification Badge */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 pt-2 border-t border-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Sorteo oficial verificado por ChimuCheck</span>
            </div>
          </div>

          {/* Premios por Puestos Card */}
          {((raffle.prizes && raffle.prizes.length > 0) || raffle.prize) && (
            <div className="bg-zinc-950/90 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-xl space-y-3">
              <span className="text-[11px] uppercase font-mono tracking-wider text-secondary font-bold flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-secondary" /> Premios por Puestos ({raffle.prizes?.length || 1})
              </span>
              <div className="space-y-2">
                {(raffle.prizes && raffle.prizes.length > 0
                  ? [...raffle.prizes].sort((a, b) => a.order - b.order)
                  : [
                      {
                        id: "main",
                        order: 1,
                        title: raffle.prize,
                        winnerAlias: raffle.winnerAlias,
                      },
                    ]
                ).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          p.order === 1
                            ? "bg-yellow-400 text-black shadow-sm"
                            : p.order === 2
                            ? "bg-zinc-300 text-black"
                            : p.order === 3
                            ? "bg-amber-600 text-white"
                            : "bg-zinc-800 text-gray-300"
                        }`}
                      >
                        {p.order === 1 ? "🥇 1º" : p.order === 2 ? "🥈 2º" : p.order === 3 ? "🥉 3º" : `🎖️ ${p.order}º`}
                      </span>
                      <span className="font-bold text-white truncate">{p.title}</span>
                    </div>
                    {p.winnerAlias && (
                      <span className="font-bold text-yellow-400 text-[11px] font-mono shrink-0 pl-2">
                        🏆 {p.winnerAlias}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── PARTICIPANTES INSCRIPTOS (Full Width Panel) ── */}
      <div className="bg-zinc-950/90 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-md space-y-4 shadow-2xl">
        {/* Header with Title, Count and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Participantes Inscriptos
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary/20 border border-secondary/35 text-secondary text-xs font-black">
                  {raffle._count.entries}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {raffle.maxEntries
                  ? `Cupo: ${raffle._count.entries} de ${raffle.maxEntries} inscriptos`
                  : "Todos los jugadores registrados para este sorteo"}
              </p>
            </div>
          </div>

          {/* Search filter & Live Counter */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {searchQuery && (
              <span className="text-xs text-gray-400 hidden md:inline font-mono">
                {filteredParticipants.length} encontrados
              </span>
            )}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o alias..."
                className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-secondary/60 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5 rounded-full hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Participants Content with Stable Fixed Height */}
        <div className="h-[380px] min-h-[380px] flex flex-col">
          {participants.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 p-6">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
                <Ticket className="w-6 h-6 text-secondary/60" />
              </div>
              <p className="text-sm font-bold text-white">
                Aún no hay participantes inscriptos
              </p>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                {canEnter
                  ? "¡Sé el primero en inscribirte y asegurar tu número en este sorteo!"
                  : "Los participantes inscriptos aparecerán aquí una vez que comiencen las inscripciones."}
              </p>
              {canEnter && (
                <div className="pt-2">
                  <Button
                    onClick={handleEnter}
                    disabled={loadingAction}
                    className="bg-secondary text-black hover:bg-yellow-400 font-bold px-4 py-1.5 text-xs rounded-xl cursor-pointer"
                  >
                    Inscribirme ahora
                  </Button>
                </div>
              )}
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-gray-400 space-y-1">
              <Search className="w-8 h-8 text-gray-600 mb-1" />
              <p className="text-sm font-medium text-gray-300">Sin resultados</p>
              <p className="text-xs text-gray-500">
                No se encontraron participantes que coincidan con &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          ) : (
            <div
              onScroll={handleScrollParticipants}
              className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {displayedParticipants.map((entry, idx) => {
                  const isMe = currentUser?.id && entry.playerId === currentUser.id;
                  const originalIndex = participants.findIndex((p) => p.id === entry.id);
                  const ticketNumber = originalIndex >= 0 ? originalIndex + 1 : idx + 1;
                  const initial =
                    (entry.player?.alias || entry.player?.name || "J")[0]?.toUpperCase() || "J";

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                        isMe
                          ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30"
                          : "bg-white/[0.03] border-white/5 hover:border-white/15 hover:bg-white/[0.06]"
                      }`}
                    >
                      {/* Ticket # */}
                      <span className="text-secondary font-mono font-bold text-xs w-7 shrink-0 text-center bg-secondary/10 py-1 rounded-md border border-secondary/20">
                        #{ticketNumber}
                      </span>

                      {/* Avatar */}
                      <Avatar className="w-8 h-8 border border-white/10 shrink-0">
                        <AvatarImage
                          src={entry.player?.image || ""}
                          alt={entry.player?.alias || "Jugador"}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-secondary/30 to-purple-600/30 text-white font-bold text-[11px]">
                          {initial}
                        </AvatarFallback>
                      </Avatar>

                      {/* Names & Date */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-white truncate">
                            {entry.player?.alias || entry.player?.name || "Sin alias"}
                          </p>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-black text-[9px] font-black shrink-0">
                              TÚ
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{formatEntryTime(entry.enteredAt)}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}

                {hasMore && (
                  <div className="col-span-full py-3 text-center text-xs text-gray-500">
                    Desplázate hacia abajo para cargar más participantes...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {isFullscreenImageOpen && imageList.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setIsFullscreenImageOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsFullscreenImageOpen(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full border border-white/20 transition-all cursor-pointer z-50"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageList[activeImageIndex] || imageList[0]}
              alt={raffle.title}
              className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />

            {imageList.length > 1 && (
              <div className="flex items-center justify-between w-full pt-4">
                <button
                  type="button"
                  onClick={prevImage}
                  className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full border border-white/10 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="text-xs font-mono text-gray-400">
                  {activeImageIndex + 1} de {imageList.length}
                </span>

                <button
                  type="button"
                  onClick={nextImage}
                  className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full border border-white/10 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
