"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import {
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowLeft,
  RotateCcw,
  Users,
  Gift,
  Crown,
  CheckCircle,
  ArrowRight,
  Medal,
} from "lucide-react";
import { drawPrizeWinner, resetRaffleDraw } from "@/app/actions/raffles";
import { toast } from "sonner";

export interface LivePrize {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  order: number;
  winnerId: string | null;
  winnerAlias: string | null;
  winnerImage: string | null;
  drawnAt?: Date | string | null;
}

interface Participant {
  id: string;
  alias: string | null;
  name: string | null;
  image: string | null;
}

interface LiveRaffle {
  id: string;
  title: string;
  prize: string;
  prizeImage: string | null;
  status: string;
  winnerId: string | null;
  winnerAlias: string | null;
  winnerImage: string | null;
  prizes?: LivePrize[];
}

type Phase = "LOBBY" | "COUNTDOWN" | "SPINNING" | "PRIZE_WINNER" | "PODIUM";

// Sound Synthesizer via Web Audio API (Zero external audio assets needed)
class SoundFX {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {}

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  playTick(frequency: number = 600) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  playCountdownBeep(high: boolean = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(high ? 880 : 440, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (high ? 0.4 : 0.2));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + (high ? 0.4 : 0.2));
    } catch {}
  }

  playWinnerFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [
        { freq: 523.25, time: 0, dur: 0.15 },
        { freq: 659.25, time: 0.15, dur: 0.15 },
        { freq: 783.99, time: 0.3, dur: 0.2 },
        { freq: 1046.5, time: 0.5, dur: 0.8 },
      ];

      notes.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(n.freq, this.ctx.currentTime + n.time);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + n.time + n.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + n.time);
        osc.stop(this.ctx.currentTime + n.time + n.dur);
      });
    } catch {}
  }
}

export function LiveDrawScreen({
  raffle,
  participants,
}: {
  raffle: LiveRaffle;
  participants: Participant[];
}) {
  // Normalize prizes list
  const initialPrizes: LivePrize[] = useMemo(() => {
    if (raffle.prizes && raffle.prizes.length > 0) {
      return [...raffle.prizes].sort((a, b) => a.order - b.order);
    }
    return [
      {
        id: "legacy",
        title: raffle.prize,
        description: null,
        image: raffle.prizeImage,
        order: 1,
        winnerId: raffle.winnerId,
        winnerAlias: raffle.winnerAlias,
        winnerImage: raffle.winnerImage,
      },
    ];
  }, [raffle]);

  const [prizes, setPrizes] = useState<LivePrize[]>(initialPrizes);

  // Prizes sorted in REVERSE order: from highest place down to 1st place!
  // e.g. 3º Puesto -> 2º Puesto -> 1º Puesto
  const reversePrizes = useMemo(() => {
    return [...prizes].sort((a, b) => b.order - a.order);
  }, [prizes]);

  // Find next prize to draw (first in reverse order that has no winner yet)
  const nextPendingPrize = useMemo(() => {
    return reversePrizes.find((p) => !p.winnerId) || null;
  }, [reversePrizes]);

  // Current active prize being drawn
  const [currentPrize, setCurrentPrize] = useState<LivePrize | null>(
    nextPendingPrize || reversePrizes[0]
  );

  // Current winner of the active draw
  const [lastDrawnWinner, setLastDrawnWinner] = useState<{
    id: string;
    alias: string;
    image: string | null;
  } | null>(null);

  // Initial phase: if all are finished, show PODIUM, else LOBBY
  const allDrawn = useMemo(() => prizes.every((p) => !!p.winnerId), [prizes]);
  const [phase, setPhase] = useState<Phase>(allDrawn ? "PODIUM" : "LOBBY");

  const [countdown, setCountdown] = useState<number>(3);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);

  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const soundRef = useRef<SoundFX | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const spinIntervalRef = useRef<any>(null);

  // Excluded player IDs (players who have already won a prize in this raffle)
  const alreadyWonPlayerIds = useMemo(() => {
    return prizes.filter((p) => !!p.winnerId).map((p) => p.winnerId!);
  }, [prizes]);

  // Eligible participants for the current prize draw (cannot win twice)
  const eligibleParticipants = useMemo(() => {
    const wonSet = new Set(alreadyWonPlayerIds);
    return participants.filter((p) => !wonSet.has(p.id));
  }, [participants, alreadyWonPlayerIds]);

  // Initialize sound synth & resize listener
  useEffect(() => {
    soundRef.current = new SoundFX();
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundRef.current?.setMuted(!next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // START DRAW FOR A PRIZE
  const handleStartDraw = (targetPrize?: LivePrize) => {
    const prizeToDraw = targetPrize || nextPendingPrize || reversePrizes[0];

    if (!prizeToDraw) {
      toast.error("No hay más premios pendientes para sortear.");
      return;
    }

    if (eligibleParticipants.length === 0) {
      toast.error("No hay suficientes participantes restantes para este premio.");
      return;
    }

    setCurrentPrize(prizeToDraw);
    setPhase("COUNTDOWN");
    setCountdown(3);
    soundRef.current?.playCountdownBeep(false);

    let currentCount = 3;
    const countTimer = setInterval(() => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountdown(currentCount);
        soundRef.current?.playCountdownBeep(false);
      } else {
        clearInterval(countTimer);
        soundRef.current?.playCountdownBeep(true);
        executeSpinAndPick(prizeToDraw);
      }
    }, 1000);
  };

  // EXECUTE SPINNING AND REVEAL
  const executeSpinAndPick = async (prizeToDraw: LivePrize) => {
    setPhase("SPINNING");

    const pool = eligibleParticipants;
    const totalPool = pool.length;

    let speed = 50; // ms per tick
    let currentIdx = 0;
    let isDecelerating = false;

    // Call server action to securely determine winner
    const drawPromise = drawPrizeWinner(raffle.id, prizeToDraw.id, alreadyWonPlayerIds);

    // Fast spin timer
    const spinStep = () => {
      currentIdx = (currentIdx + 1) % totalPool;
      setActiveSlotIndex(currentIdx);
      soundRef.current?.playTick(500 + Math.random() * 200);

      if (!isDecelerating) {
        spinIntervalRef.current = setTimeout(spinStep, speed);
      }
    };

    spinIntervalRef.current = setTimeout(spinStep, speed);

    // After 2.5s minimum spin, wait for backend response then begin deceleration
    const [result] = await Promise.all([
      drawPromise,
      new Promise((res) => setTimeout(res, 2500)),
    ]);

    if (!result.success || !result.winner) {
      clearTimeout(spinIntervalRef.current);
      toast.error(result.message || "Error al realizar el sorteo");
      setPhase("LOBBY");
      return;
    }

    const targetWinner = {
      id: result.winner.id,
      alias: result.winner.alias,
      image: result.winner.image,
    };

    isDecelerating = true;
    clearTimeout(spinIntervalRef.current);

    // Update local prize winner
    setPrizes((prev) =>
      prev.map((p) =>
        p.id === prizeToDraw.id
          ? {
              ...p,
              winnerId: targetWinner.id,
              winnerAlias: targetWinner.alias,
              winnerImage: targetWinner.image,
            }
          : p
      )
    );

    // Gradual slowing down steps (anticipation)
    let slowSpeed = 80;
    const targetIndex = pool.findIndex((p) => p.id === targetWinner.id);
    const finalIndex = targetIndex >= 0 ? targetIndex : 0;
    let remainingSteps = 16 + ((finalIndex - currentIdx + totalPool) % totalPool);

    const decelerate = () => {
      currentIdx = (currentIdx + 1) % totalPool;
      setActiveSlotIndex(currentIdx);
      remainingSteps -= 1;

      soundRef.current?.playTick(300 + (20 - Math.min(20, remainingSteps)) * 25);

      if (remainingSteps > 0) {
        slowSpeed += 22;
        setTimeout(decelerate, slowSpeed);
      } else {
        // REVEAL!
        setLastDrawnWinner(targetWinner);
        setActiveSlotIndex(finalIndex);
        setTimeout(() => {
          setPhase("PRIZE_WINNER");
          soundRef.current?.playWinnerFanfare();
        }, 500);
      }
    };

    decelerate();
  };

  // Move from PRIZE_WINNER to next round or PODIUM
  const handleProceedAfterWinner = () => {
    // Check if there are more pending prizes in reverse order
    const next = reversePrizes.find((p) => !p.winnerId && p.id !== currentPrize?.id);
    if (next) {
      setCurrentPrize(next);
      setPhase("LOBBY");
    } else {
      setPhase("PODIUM");
    }
  };

  // Reset entire raffle
  const handleReset = async () => {
    if (!confirm("¿Deseas reiniciar todos los premios y ganadores de este sorteo?")) return;
    const res = await resetRaffleDraw(raffle.id);
    if (res.success) {
      toast.success("Sorteo reiniciado");
      setPrizes((prev) =>
        prev.map((p) => ({
          ...p,
          winnerId: null,
          winnerAlias: null,
          winnerImage: null,
        }))
      );
      setPhase("LOBBY");
      setCurrentPrize(reversePrizes[0]);
      setLastDrawnWinner(null);
    } else {
      toast.error(res.message || "Error al reiniciar");
    }
  };

  const getRankBadge = (order: number) => {
    if (order === 1) return { label: "1º Puesto (Gran Premio)", badge: "bg-yellow-400 text-black shadow-lg", icon: "🥇" };
    if (order === 2) return { label: "2º Puesto", badge: "bg-zinc-200 text-black shadow-md", icon: "🥈" };
    if (order === 3) return { label: "3º Puesto", badge: "bg-amber-600 text-white shadow-md", icon: "🥉" };
    return { label: `${order}º Puesto`, badge: "bg-zinc-800 text-gray-200 border border-zinc-700", icon: "🎖️" };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[90vh] bg-gradient-to-b from-black via-zinc-950 to-black text-white flex flex-col justify-between p-4 md:p-8 rounded-3xl border border-yellow-500/20 shadow-2xl overflow-hidden select-none"
      style={{
        backgroundImage: `radial-gradient(ellipse at top, rgba(234, 179, 8, 0.12) 0%, rgba(0, 0, 0, 0.95) 70%)`,
      }}
    >
      {/* Confetti Explosion on Winner / Podium */}
      {(phase === "PRIZE_WINNER" || phase === "PODIUM") && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={phase === "PODIUM"}
          numberOfPieces={phase === "PODIUM" ? 400 : 250}
          gravity={0.18}
          colors={["#EAB308", "#00F0FF", "#FFFFFF", "#A855F7", "#22C55E", "#F59E0B"]}
        />
      )}

      {/* Background Animated Neon Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* TOP BAR / CONTROLS */}
      <header className="relative z-20 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/admin/raffles/${raffle.id}`}>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-zinc-800 border border-white/20 text-gray-300 hover:text-white text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Panel
            </button>
          </Link>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono uppercase tracking-wider text-gray-300 font-bold">
              SORTEO EN VIVO
            </span>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg md:text-2xl font-black tracking-wider uppercase text-yellow-400 drop-shadow-[0_2px_10px_rgba(234,179,8,0.5)]">
            {raffle.title}
          </h2>
          <p className="text-xs text-gray-400 font-semibold flex items-center justify-center gap-1.5 mt-0.5">
            <Gift className="w-3.5 h-3.5 text-secondary" />
            <span>{prizes.length} {prizes.length === 1 ? "Premio" : "Premios en Juego"}</span>
            <span className="text-white/30">•</span>
            <span className="text-secondary font-bold">Sorteo del Último al Primer Puesto</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            className="p-2 rounded-full text-gray-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 h-9 w-9 flex items-center justify-center transition-colors cursor-pointer"
            title={soundEnabled ? "Silenciar" : "Activar sonido"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-yellow-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-500" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-full text-gray-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 h-9 w-9 flex items-center justify-center transition-colors cursor-pointer"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* MAIN STAGE CONTENT (PHASE SWITCHER) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-6">
        <AnimatePresence mode="wait">
          {/* 1. LOBBY PHASE */}
          {phase === "LOBBY" && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl flex flex-col items-center text-center space-y-8"
            >
              {/* ORDER OF DRAWING BANNER */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-widest text-secondary font-bold px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30">
                  Orden Oficial de Sorteo: Del Último al Primer Puesto
                </span>
                <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow">
                  {nextPendingPrize
                    ? `Próximo: ${getRankBadge(nextPendingPrize.order).label}`
                    : "Todos los premios han sido sorteados"}
                </h1>
              </div>

              {/* PRIZES ROADMAP (Displayed in Reverse Order: Last -> 1st) */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reversePrizes.map((p, idx) => {
                  const rank = getRankBadge(p.order);
                  const isPending = !p.winnerId;
                  const isCurrent = nextPendingPrize?.id === p.id;

                  return (
                    <div
                      key={p.id}
                      className={`rounded-2xl p-5 border text-left flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                        p.winnerId
                          ? "bg-zinc-950/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5 opacity-80"
                          : isCurrent
                          ? "bg-gradient-to-b from-yellow-500/15 via-zinc-950 to-zinc-950 border-2 border-yellow-400 shadow-xl shadow-yellow-500/10 scale-[1.02]"
                          : "bg-zinc-950/70 border-white/10 opacity-70"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black font-mono tracking-wider ${rank.badge}`}
                          >
                            {rank.icon} {rank.label}
                          </span>

                          {p.winnerId ? (
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 font-mono">
                              <CheckCircle className="w-3.5 h-3.5" /> Sorteado
                            </span>
                          ) : isCurrent ? (
                            <span className="text-xs font-bold text-yellow-400 font-mono animate-pulse">
                              ▶ EN TURNO
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 font-mono">Pendiente</span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-white line-clamp-1">{p.title}</h3>
                          {p.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Winner info if already drawn */}
                      {p.winnerId && p.winnerAlias ? (
                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-3">
                          {p.winnerImage ? (
                            <img
                              src={p.winnerImage}
                              alt={p.winnerAlias}
                              className="w-8 h-8 rounded-full object-cover border border-emerald-400"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                              🏆
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold">
                              Ganador
                            </span>
                            <p className="font-bold text-white text-xs">{p.winnerAlias}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-gray-400 font-mono flex items-center justify-between">
                          <span>Ronda {idx + 1} de {reversePrizes.length}</span>
                          <span>{p.order === 1 ? "★ Gran Final" : ""}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Big START Button */}
              <div className="space-y-4 pt-2">
                {nextPendingPrize ? (
                  <button
                    type="button"
                    onClick={() => handleStartDraw(nextPendingPrize)}
                    disabled={eligibleParticipants.length === 0}
                    className="inline-flex items-center justify-center bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black text-xl md:text-2xl font-black py-6 px-10 md:px-14 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.6)] hover:shadow-[0_0_80px_rgba(234,179,8,0.9)] hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-yellow-200 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-7 h-7 mr-3 animate-bounce" />
                    SORTEAR {getRankBadge(nextPendingPrize.order).label.toUpperCase()}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPhase("PODIUM")}
                    className="inline-flex items-center justify-center bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black text-xl md:text-2xl font-black py-6 px-10 rounded-2xl shadow-xl transition-all cursor-pointer"
                  >
                    <Trophy className="w-7 h-7 mr-3" />
                    VER PODIO COMPLETO DE GANADORES
                  </button>
                )}

                <div className="flex items-center justify-center gap-4 text-xs text-gray-400 font-mono">
                  <span>
                    👥 <strong>{eligibleParticipants.length}</strong> participantes elegibles
                  </span>
                  <span>•</span>
                  <span>
                    🏆 <strong>{prizes.filter((p) => !!p.winnerId).length} / {prizes.length}</strong> premios entregados
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. COUNTDOWN PHASE */}
          {phase === "COUNTDOWN" && currentPrize && (
            <motion.div
              key="countdown"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-6 text-center"
            >
              <div className="space-y-1">
                <span className="text-sm uppercase font-mono tracking-widest text-secondary font-bold px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30">
                  {getRankBadge(currentPrize.order).label}
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-white mt-2">
                  {currentPrize.title}
                </h2>
                <p className="text-xs uppercase font-mono tracking-widest text-yellow-400 animate-pulse mt-1">
                  El sorteo comienza en...
                </p>
              </div>

              <motion.div
                key={countdown}
                initial={{ scale: 0.2, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.5, ease: "backOut" }}
                className="w-48 h-48 md:w-60 md:h-60 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-[0_0_100px_rgba(234,179,8,0.8)] border-4 border-white"
              >
                <span className="text-8xl md:text-9xl font-black text-black">
                  {countdown}
                </span>
              </motion.div>
            </motion.div>
          )}

          {/* 3. SPINNING / RULETA SLOT MACHINE PHASE */}
          {phase === "SPINNING" && currentPrize && (
            <motion.div
              key="spinning"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl flex flex-col items-center space-y-6"
            >
              <div className="space-y-1 text-center">
                <span className="text-xs font-mono uppercase tracking-widest text-yellow-400 font-bold px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 animate-pulse inline-flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  SORTEANDO {getRankBadge(currentPrize.order).label.toUpperCase()}
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-white drop-shadow">
                  {currentPrize.title}
                </h3>
              </div>

              {/* SLOT MACHINE VIEWFINDER */}
              <div className="relative w-full max-w-lg bg-zinc-950 border-4 border-yellow-500 rounded-3xl p-6 md:p-8 shadow-[0_0_80px_rgba(234,179,8,0.4)] overflow-hidden">
                <div className="absolute top-1/2 -left-3 -translate-y-1/2 z-30 text-yellow-400 text-lg drop-shadow">
                  ▶
                </div>
                <div className="absolute top-1/2 -right-3 -translate-y-1/2 z-30 text-yellow-400 text-lg drop-shadow">
                  ◀
                </div>

                <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-zinc-950 to-transparent z-20 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-zinc-950 to-transparent z-20 pointer-events-none" />

                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-24 border-2 border-yellow-400 bg-yellow-400/10 rounded-2xl z-10 pointer-events-none shadow-[0_0_20px_rgba(234,179,8,0.3)]" />

                {eligibleParticipants[activeSlotIndex] && (
                  <motion.div
                    key={activeSlotIndex}
                    initial={{ y: 20, opacity: 0.6 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.05 }}
                    className="flex flex-col items-center justify-center py-4 relative z-20"
                  >
                    {eligibleParticipants[activeSlotIndex].image ? (
                      <img
                        src={eligibleParticipants[activeSlotIndex].image!}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400 shadow-xl"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-yellow-500/30 text-yellow-400 flex items-center justify-center text-4xl font-black border-4 border-yellow-400 shadow-xl">
                        {(eligibleParticipants[activeSlotIndex].alias || "J")[0].toUpperCase()}
                      </div>
                    )}
                    <h2 className="text-3xl md:text-4xl font-black text-white mt-4 tracking-wide text-center truncate max-w-full drop-shadow">
                      {eligibleParticipants[activeSlotIndex].alias ||
                        eligibleParticipants[activeSlotIndex].name}
                    </h2>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* 4. SINGLE PRIZE WINNER REVEAL */}
          {phase === "PRIZE_WINNER" && currentPrize && lastDrawnWinner && (
            <motion.div
              key="prize_winner"
              initial={{ scale: 0.6, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-full max-w-3xl flex flex-col items-center text-center space-y-6 relative"
            >
              <div className="space-y-2">
                <span className="px-4 py-1.5 rounded-full text-xs font-black font-mono tracking-widest uppercase bg-yellow-400 text-black shadow-lg shadow-yellow-500/20">
                  {getRankBadge(currentPrize.order).icon} ¡GANADOR DEL {getRankBadge(currentPrize.order).label.toUpperCase()}!
                </span>
              </div>

              {/* Winner Avatar in Gold Ring */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 rounded-full blur-2xl opacity-80 animate-pulse" />
                {lastDrawnWinner.image ? (
                  <img
                    src={lastDrawnWinner.image}
                    alt={lastDrawnWinner.alias}
                    className="relative w-36 h-36 md:w-44 md:h-44 rounded-full object-cover border-8 border-yellow-400 shadow-[0_0_60px_rgba(234,179,8,0.8)]"
                  />
                ) : (
                  <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 text-black flex items-center justify-center text-6xl font-black border-8 border-yellow-400 shadow-[0_0_60px_rgba(234,179,8,0.8)]">
                    {(lastDrawnWinner.alias || "J")[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Title & Winner Name */}
              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300 drop-shadow-[0_5px_25px_rgba(234,179,8,0.6)]">
                  {lastDrawnWinner.alias}
                </h1>
                <p className="text-xl md:text-2xl text-gray-200 font-bold mt-2">
                  ¡Se lleva: <span className="text-yellow-400 underline">{currentPrize.title}</span>!
                </p>
                {currentPrize.description && (
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    {currentPrize.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={handleProceedAfterWinner}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black font-black text-base px-8 py-4 rounded-xl shadow-xl shadow-yellow-500/25 hover:brightness-110 transition-all cursor-pointer"
                >
                  {reversePrizes.some((p) => !p.winnerId) ? (
                    <>
                      <span>Continuar al Siguiente Puesto</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <Trophy className="w-5 h-5" />
                      <span>Ver Podio Completo de Ganadores</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* 5. GRAND FINALE / WINNER PODIUM PHASE */}
          {phase === "PODIUM" && (
            <motion.div
              key="podium"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-4xl flex flex-col items-center text-center space-y-8"
            >
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="space-y-2"
              >
                <Crown className="w-16 h-16 text-yellow-400 mx-auto drop-shadow-[0_0_30px_rgba(234,179,8,0.9)] animate-bounce" />
                <span className="text-xs font-mono uppercase tracking-widest text-secondary font-bold">
                  Sorteo Oficial Finalizado
                </span>
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300 drop-shadow">
                  ¡PODIO DE GANADORES!
                </h1>
              </motion.div>

              {/* Winners Table / Cards (Ordered 1st, 2nd, 3rd...) */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...prizes]
                  .sort((a, b) => a.order - b.order)
                  .map((p) => {
                    const rank = getRankBadge(p.order);
                    return (
                      <div
                        key={p.id}
                        className={`rounded-2xl p-5 border text-center flex flex-col items-center justify-between space-y-4 relative ${
                          p.order === 1
                            ? "bg-gradient-to-b from-yellow-500/20 via-zinc-950 to-zinc-950 border-2 border-yellow-400 shadow-2xl shadow-yellow-500/15"
                            : "bg-zinc-950/80 border-white/10"
                        }`}
                      >
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black font-mono tracking-wider ${rank.badge}`}
                        >
                          {rank.icon} {rank.label}
                        </span>

                        <div className="relative">
                          {p.winnerImage ? (
                            <img
                              src={p.winnerImage}
                              alt={p.winnerAlias || "Ganador"}
                              className={`w-20 h-20 rounded-full object-cover border-4 ${
                                p.order === 1 ? "border-yellow-400 shadow-xl" : "border-zinc-500"
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black border-4 ${
                                p.order === 1
                                  ? "bg-yellow-400 text-black border-yellow-300"
                                  : "bg-zinc-800 text-white border-zinc-600"
                              }`}
                            >
                              {(p.winnerAlias || "J")[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-xl font-black text-white">{p.winnerAlias || "Sin ganador"}</p>
                          <p className="text-xs text-yellow-400 font-bold mt-1">🎁 {p.title}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-gray-300 hover:text-white border border-zinc-700 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reiniciar Sorteo
                </button>

                <Link href={`/admin/raffles/${raffle.id}`}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-black hover:bg-yellow-400 text-sm font-bold shadow-lg shadow-yellow-500/20 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Finalizar y Volver al Panel
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER TICKER */}
      <footer className="relative z-20 border-t border-white/10 pt-4 flex items-center justify-between text-xs text-gray-400">
        <span className="font-mono">CHIMUCHECK RAFFLES • LIVE SYSTEM</span>
        <span>
          {participants.length} participante(s) en bolillero
        </span>
      </footer>
    </div>
  );
}
