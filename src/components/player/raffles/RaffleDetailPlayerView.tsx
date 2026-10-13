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
  LogIn,
  Search,
  User,
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

  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants;
    const q = searchQuery.toLowerCase();
    return participants.filter((p) => {
      const alias = (p.player?.alias || "").toLowerCase();
      const name = (p.player?.name || "").toLowerCase();
      return alias.includes(q) || name.includes(q);
    });
  }, [participants, searchQuery]);

  const handleEnter = async () => {
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("open-login-modal"));
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

  const backUrl = isLoggedIn ? "/player/dashboard/raffles" : "/sorteos";

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a todos los sorteos
        </Link>
      </div>

      {/* Main Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: High-Res Image Gallery / Showcase (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden border-2 border-white/10 bg-zinc-950 shadow-2xl flex items-center justify-center group">
            {imageList.length > 0 ? (
              <>
                <img
                  src={imageList[activeImageIndex] || imageList[0]}
                  alt={raffle.title}
                  className="w-full h-full object-cover transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Badges on top */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/10">
                    {raffle.type === "OPEN" ? "SORTEO ABIERTO" : "MANUAL / EXCLUSIVO"}
                  </span>

                  {raffle.isEntered && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500 text-black flex items-center gap-1.5 shadow-lg">
                      <CheckCircle2 className="w-4 h-4" />
                      ¡ESTÁS INSCRIPTO!
                    </span>
                  )}
                </div>

                {/* Navigation arrows if multiple images */}
                {imageList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white p-2.5 rounded-full border border-white/20 transition-all opacity-80 hover:opacity-100 hover:scale-110 shadow-xl cursor-pointer"
                      title="Imagen anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white p-2.5 rounded-full border border-white/20 transition-all opacity-80 hover:opacity-100 hover:scale-110 shadow-xl cursor-pointer"
                      title="Imagen siguiente"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image counter pill */}
                {imageList.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-gray-300 border border-white/10">
                    {activeImageIndex + 1} / {imageList.length}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-12 space-y-3">
                <Gift className="w-20 h-20 text-secondary mx-auto opacity-50" />
                <h4 className="text-lg font-bold text-gray-400">Sin imágenes cargadas</h4>
              </div>
            )}
          </div>

          {/* Thumbnails list if multiple images */}
          {imageList.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto p-1">
              {imageList.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
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

        {/* RIGHT COLUMN: Details & Enrollment Action Box (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-950/90 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6">
            {/* Prize Spotlight */}
            <div className="space-y-2 border-b border-white/10 pb-5">
              <span className="text-xs uppercase font-mono tracking-widest text-secondary font-bold flex items-center gap-1.5">
                <Gift className="w-4 h-4" />
                Premio en Juego
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300 drop-shadow">
                {raffle.prize}
              </h2>
              <h1 className="text-xl font-bold text-white mt-1">
                {raffle.title}
              </h1>
            </div>

            {/* Multiple Prizes Breakdown */}
            {raffle.prizes && raffle.prizes.length > 1 && (
              <div className="space-y-2.5 bg-black/40 border border-white/5 rounded-2xl p-4">
                <span className="text-[11px] uppercase font-mono tracking-wider text-secondary font-bold flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" /> Premios por Puestos ({raffle.prizes.length})
                </span>
                <div className="space-y-2">
                  {[...raffle.prizes]
                    .sort((a, b) => a.order - b.order)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              p.order === 1
                                ? "bg-yellow-400 text-black shadow-sm"
                                : p.order === 2
                                ? "bg-zinc-300 text-black"
                                : p.order === 3
                                ? "bg-amber-600 text-white"
                                : "bg-zinc-800 text-gray-300"
                            }`}
                          >
                            {p.order === 1 ? "🥇 1º Puesto" : p.order === 2 ? "🥈 2º Puesto" : p.order === 3 ? "🥉 3º Puesto" : `🎖️ ${p.order}º Puesto`}
                          </span>
                          <span className="font-bold text-white">{p.title}</span>
                        </div>
                        {p.winnerAlias && (
                          <span className="font-bold text-yellow-400 text-[11px] font-mono">
                            🏆 {p.winnerAlias}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Winner Spotlight (If Finished) */}
            {isFinished && raffle.winnerAlias && (
              <div className="bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-yellow-500/15 border-2 border-yellow-500/40 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
                <div className="relative">
                  {raffle.winnerImage ? (
                    <img
                      src={raffle.winnerImage}
                      alt={raffle.winnerAlias}
                      className="w-14 h-14 rounded-full object-cover border-2 border-yellow-400"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black text-xl">
                      🏆
                    </div>
                  )}
                  <Crown className="w-5 h-5 text-yellow-400 absolute -top-2 -right-1" />
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-yellow-400 tracking-wider">
                    ¡Ganador del Sorteo!
                  </span>
                  <p className="text-xl font-black text-white">{raffle.winnerAlias}</p>
                </div>
              </div>
            )}

            {/* Metadata Stats */}
            <div className="grid grid-cols-2 gap-4">
              <a
                href="#participantes"
                className="bg-black/50 hover:bg-black/80 border border-white/5 hover:border-white/20 rounded-2xl p-4 space-y-1.5 transition-all group block cursor-pointer"
                title="Ver lista de participantes inscriptos"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1.5 group-hover:text-secondary transition-colors">
                    <Users className="w-3.5 h-3.5 text-secondary" /> Participantes
                  </span>
                  <span className="text-[10px] text-gray-500 group-hover:text-gray-300 transition-colors">
                    Ver todos ↓
                  </span>
                </div>

                <p className="text-2xl font-black text-white">
                  {raffle._count.entries}
                  {raffle.maxEntries && (
                    <span className="text-xs text-gray-400 font-normal"> / {raffle.maxEntries}</span>
                  )}
                </p>

                {/* Mini Avatar Stack Preview */}
                {participants.length > 0 ? (
                  <div className="flex items-center -space-x-2 pt-1 overflow-hidden">
                    {participants.slice(0, 4).map((p, idx) => (
                      <Avatar key={p.id || idx} className="w-6 h-6 border-2 border-black shrink-0">
                        <AvatarImage src={p.player?.image || ""} />
                        <AvatarFallback className="text-[9px] bg-secondary/30 text-secondary font-bold">
                          {(p.player?.alias || p.player?.name || "J")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {participants.length > 4 && (
                      <span className="text-[10px] text-gray-400 pl-3 font-semibold">
                        +{participants.length - 4} más
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500">
                    {raffle.maxEntries ? "Cupo limitado" : "Sin inscriptos aún"}
                  </p>
                )}
              </a>

              <div className="bg-black/50 border border-white/5 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-secondary" /> Fecha Sorteo
                </span>
                {raffle.drawDate ? (
                  <>
                    <p className="text-sm font-bold text-white truncate" suppressHydrationWarning>
                      {formatDate(raffle.drawDate)}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono">
                      {new Date(raffle.drawDate).getHours().toString().padStart(2, "0")}:
                      {new Date(raffle.drawDate).getMinutes().toString().padStart(2, "0")} hs
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-bold text-gray-400">A confirmar</p>
                )}
              </div>
            </div>

            {/* Enrollment Action Buttons */}
            <div className="pt-2">
              {canEnter && (
                <Button
                  disabled={loadingAction}
                  onClick={handleEnter}
                  className="w-full bg-secondary text-black hover:bg-yellow-400 font-black py-7 text-lg rounded-2xl shadow-xl shadow-yellow-500/20 gap-2 transition-all transform hover:scale-[1.02] active:scale-98 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 animate-spin" />
                  {loadingAction ? "Inscribiendo..." : "¡Inscribirme en este Sorteo!"}
                </Button>
              )}

              {raffle.isEntered && raffle.status === "ACTIVE" && (
                <div className="space-y-3">
                  <div className="w-full py-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-sm font-bold flex items-center justify-center gap-2 shadow-lg">
                    <CheckCircle2 className="w-5 h-5" />
                    ¡Ya estás participando en este sorteo!
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loadingAction}
                    onClick={handleLeave}
                    className="w-full text-xs text-gray-400 hover:text-red-400 hover:bg-red-950/20 py-2.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1" />
                    Darse de baja del sorteo
                  </Button>
                </div>
              )}

              {!isLoggedIn && !isFinished && (
                <Button
                  onClick={handleEnter}
                  className="w-full bg-white text-black border-2 border-white hover:bg-primary hover:text-black hover:border-primary font-black py-7 text-base rounded-2xl shadow-xl gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <LogIn className="w-5 h-5" />
                  Iniciar Sesión para Inscribirme
                </Button>
              )}

              {!raffle.isEntered && isFull && !isFinished && (
                <div className="w-full py-4 rounded-2xl bg-red-950/30 border border-red-900/40 text-red-400 text-sm font-bold text-center">
                  El cupo máximo de participantes ha sido alcanzado.
                </div>
              )}

              {!raffle.isEntered && raffle.type === "MANUAL" && !isFinished && (
                <div className="w-full py-4 rounded-2xl bg-zinc-900 border border-white/10 text-gray-400 text-sm text-center font-medium">
                  Sorteo exclusivo por invitación del organizador.
                </div>
              )}

              {isFinished && !raffle.isEntered && (
                <div className="w-full py-4 rounded-2xl bg-zinc-900 border border-white/10 text-yellow-400 text-sm font-bold text-center">
                  Este sorteo ha finalizado.
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2 border-t border-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Sorteo oficial verificado por ChimuCheck</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── INSCRIBED PARTICIPANTS SECTION ── */}
      <div
        id="participantes"
        className="bg-zinc-950/80 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-6 shadow-2xl scroll-mt-24"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    Participantes Inscriptos
                  </h3>
                  <span className="px-3 py-0.5 rounded-full bg-secondary/20 border border-secondary/35 text-secondary text-xs font-black">
                    {raffle._count.entries}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-400">
                  {raffle.maxEntries
                    ? `Cupo: ${raffle._count.entries} de ${raffle.maxEntries} jugadores inscriptos`
                    : "Todos los jugadores registrados para este sorteo"}
                </p>
              </div>
            </div>
          </div>

          {/* Real-time search filter */}
          {participants.length > 4 && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por alias o nombre..."
                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-secondary/60 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Participants Content */}
        {participants.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-500">
              <Ticket className="w-8 h-8 text-secondary/60" />
            </div>
            <p className="text-base font-bold text-white">
              Aún no hay participantes inscriptos
            </p>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              {canEnter
                ? "¡Sé el primero en inscribirte y asegurar tu número en este sorteo!"
                : "Los participantes inscriptos aparecerán aquí una vez que comiencen las inscripciones."}
            </p>
            {canEnter && (
              <div className="pt-2">
                <Button
                  onClick={handleEnter}
                  disabled={loadingAction}
                  className="bg-secondary text-black hover:bg-yellow-400 font-bold px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  Inscribirme ahora
                </Button>
              </div>
            )}
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            No se encontraron participantes que coincidan con &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[520px] overflow-y-auto pr-1.5 custom-scrollbar">
            {filteredParticipants.map((entry, idx) => {
              const isMe = currentUser?.id && entry.playerId === currentUser.id;
              const originalIndex = participants.findIndex((p) => p.id === entry.id);
              const ticketNumber = originalIndex >= 0 ? originalIndex + 1 : idx + 1;
              const initial =
                (entry.player?.alias || entry.player?.name || "J")[0]?.toUpperCase() || "J";

              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    isMe
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30"
                      : "bg-white/[0.03] border-white/5 hover:border-white/15 hover:bg-white/[0.05]"
                  }`}
                >
                  {/* Ticket Number Badge */}
                  <span className="text-gray-500 font-mono font-bold text-xs w-7 shrink-0 text-center">
                    #{ticketNumber}
                  </span>

                  {/* Avatar */}
                  <Avatar className="w-10 h-10 border border-white/10 shrink-0">
                    <AvatarImage
                      src={entry.player?.image || ""}
                      alt={entry.player?.alias || "Jugador"}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-secondary/30 to-purple-600/30 text-white font-bold text-xs">
                      {initial}
                    </AvatarFallback>
                  </Avatar>

                  {/* Player Names & Date */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white truncate">
                        {entry.player?.alias || entry.player?.name || "Jugador"}
                      </p>
                      {isMe && (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                          Tú
                        </span>
                      )}
                    </div>

                    {entry.player?.alias &&
                      entry.player?.name &&
                      entry.player.alias !== entry.player.name && (
                        <p className="text-[11px] text-gray-400 truncate">
                          {entry.player.name}
                        </p>
                      )}

                    {entry.enteredAt && (
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">
                        {formatEntryTime(entry.enteredAt)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Description / Rules Section */}
      {raffle.description && (
        <div className="bg-zinc-950/80 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-secondary" />
            Descripción, Bases y Condiciones
          </h3>
          <div className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line border-t border-white/5 pt-4">
            {raffle.description}
          </div>
        </div>
      )}
    </div>
  );
}
