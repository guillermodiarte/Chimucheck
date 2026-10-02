"use client";

import { useState } from "react";
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
} from "lucide-react";
import { enterRaffle, leaveRaffle } from "@/app/actions/raffles";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PlayerRaffleDetail {
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

export function RaffleDetailPlayerView({
  raffle: initialRaffle,
  isLoggedIn = true,
}: {
  raffle: PlayerRaffleDetail;
  isLoggedIn?: boolean;
}) {
  const router = useRouter();
  const [raffle, setRaffle] = useState<PlayerRaffleDetail>(initialRaffle);
  const [loadingAction, setLoadingAction] = useState(false);

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
      setRaffle((prev) => ({
        ...prev,
        isEntered: true,
        _count: { entries: prev._count.entries + 1 },
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
        myEntryDate: null,
      }));
      router.refresh();
    } else {
      toast.error(res.message || "Error al retirarse");
    }
  };

  const backUrl = isLoggedIn ? "/player/dashboard/raffles" : "/sorteos";

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
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
              <div className="bg-black/50 border border-white/5 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-secondary" /> Participantes
                </span>
                <p className="text-2xl font-black text-white">
                  {raffle._count.entries}
                  {raffle.maxEntries && (
                    <span className="text-xs text-gray-400 font-normal"> / {raffle.maxEntries}</span>
                  )}
                </p>
                {raffle.maxEntries && (
                  <p className="text-[11px] text-gray-500">
                    Cupo limitado
                  </p>
                )}
              </div>

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
