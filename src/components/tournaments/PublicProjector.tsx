"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Minimize2, Maximize2, Image as ImageIcon, X, Crown } from "lucide-react";
import Confetti from "react-confetti";

type Registration = {
  playerId: string;
  score: number;
  player: {
    alias: string | null;
    name: string | null;
    image: string | null;
  };
};

interface PublicProjectorProps {
  registrations: Registration[];
  status: string;
  tournamentId: string;
  bannerImages: string[];
}

export function PublicProjector({
  registrations,
  status,
  tournamentId,
  bannerImages,
}: PublicProjectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showBg, setShowBg] = useState(true);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [showPodium, setShowPodium] = useState(false);
  const prevStatusRef = useRef(status);

  // Show podium animation when opening projector on a finished tournament
  const handleOpen = () => {
    setIsOpen(true);
    if (status === "FINALIZADO") {
      setShowPodium(true);
    }
  };

  // Auto-show podium when status changes to FINALIZADO while projector is open
  useEffect(() => {
    if (prevStatusRef.current !== "FINALIZADO" && status === "FINALIZADO" && isOpen) {
      setShowPodium(true);
    }
    prevStatusRef.current = status;
  }, [status, isOpen]);

  // Lock body scroll when projector is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Auto-refresh scores every 10s when live
  useEffect(() => {
    if (!isOpen || status !== "EN_JUEGO") return;
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [isOpen, status, router]);

  // Carousel for banner images
  useEffect(() => {
    if (!showBg || bannerImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % bannerImages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [showBg, bannerImages.length]);

  const sortedRegistrations = [...registrations].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const nameA = a.player.alias || a.player.name || "";
    const nameB = b.player.alias || b.player.name || "";
    return nameA.localeCompare(nameB);
  });

  if (!isOpen) {
    return (
      <Button
        onClick={handleOpen}
        variant="ghost"
        className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-bold text-xs uppercase tracking-wider"
      >
        <Maximize2 className="w-4 h-4 mr-1.5" />
        Ver
      </Button>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Background */}
      <div className="absolute inset-0 bg-black">
        <AnimatePresence mode="wait">
          {showBg && bannerImages.length > 0 && (
            <motion.div
              key={currentBgIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 bg-cover bg-center blur-sm"
              style={{ backgroundImage: `url('${bannerImages[currentBgIndex]}')` }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col pt-8 px-4 md:px-[4%] xl:px-[6%] overflow-auto">
        {/* Top bar */}
        <div className="flex items-center justify-end gap-3 mb-6">
          <Button
            variant="ghost"
            onClick={() => setShowBg(!showBg)}
            className={`border ${showBg ? "bg-blue-900/40 text-blue-400 border-blue-500/30" : "bg-zinc-800 text-white border-white/10"}`}
            title={showBg ? "Quitar fondo" : "Mostrar fondo"}
          >
            <ImageIcon className="w-5 h-5 mr-2" />
            Fondo
          </Button>

          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10"
          >
            <Minimize2 className="w-5 h-5 mr-2" />
            Cerrar
          </Button>
        </div>

        {/* Scores */}
        <div className="flex flex-col gap-4 md:gap-5 w-full">
          <AnimatePresence>
            {sortedRegistrations.map((reg, index) => {
              const playerName = reg.player.alias || reg.player.name || "Jugador";
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              const isFinished = status === "FINALIZADO";
              const isTop3 = isFinished && (isFirst || isSecond || isThird);

              let borderClass = "border-white/10";
              let bgClass = "bg-black/40";
              let textClass = "text-white";
              let rankContent: React.ReactNode = <span className="text-gray-400">{index + 1}</span>;

              if (isFinished && isFirst) {
                borderClass = "border-yellow-500/40";
                bgClass = "bg-yellow-900/20";
                textClass = "text-yellow-400";
                rankContent = <span className="text-yellow-500">👑</span>;
              } else if (isFinished && isSecond) {
                borderClass = "border-gray-400/30";
                bgClass = "bg-gray-500/10";
                rankContent = <span>🥈</span>;
              } else if (isFinished && isThird) {
                borderClass = "border-orange-500/30";
                bgClass = "bg-orange-900/10";
                textClass = "text-orange-400";
                rankContent = <span>🥉</span>;
              }

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={reg.playerId}
                  className={`flex items-center justify-between p-4 md:p-5 rounded-xl border ${borderClass} ${bgClass} backdrop-blur-md`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 border ${borderClass} bg-black/30 text-lg font-bold`}>
                      {rankContent}
                    </div>

                    {/* Avatar */}
                    <Avatar className={`w-10 h-10 md:w-12 md:h-12 border-2 ${isFinished && isFirst ? "border-yellow-500/50" : "border-gray-700"}`}>
                      <AvatarImage src={reg.player.image || ""} alt={playerName} className="object-cover" />
                      <AvatarFallback className="bg-gray-800 text-gray-400 text-lg">{playerName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>

                    {/* Name */}
                    <span className={`font-bold text-xl md:text-2xl ${textClass}`}>
                      {playerName}
                    </span>
                  </div>

                  {/* Score + Trophy */}
                  <div className="flex items-center gap-3">
                    {isTop3 && (
                      <Trophy className={`w-6 h-6 ${isFirst ? "text-yellow-500" : isSecond ? "text-gray-400" : "text-orange-500"}`} />
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl md:text-4xl font-black ${textClass}`}>
                        {reg.score}
                      </span>
                      <span className="text-sm text-gray-500 font-bold uppercase">PTS</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Inline Podium Animation */}
      {showPodium && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90">
          <Confetti width={typeof window !== 'undefined' ? window.innerWidth : 0} height={typeof window !== 'undefined' ? window.innerHeight : 0} numberOfPieces={500} recycle={false} />

          <button onClick={() => setShowPodium(false)} className="absolute top-4 right-4 text-white/60 hover:text-white z-10">
            <X className="w-8 h-8" />
          </button>

          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
              className="text-center mb-12"
            >
              <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 uppercase tracking-tighter drop-shadow-lg">
                ¡Torneo Finalizado!
              </h2>
              <p className="text-2xl text-white mt-4 font-light">
                Felicitaciones a los ganadores
              </p>
            </motion.div>

            <div className="flex items-end justify-center gap-4 md:gap-12">
              {(() => {
                const top3 = sortedRegistrations.slice(0, 3).map((r, i) => ({
                  alias: r.player.alias || r.player.name || "Jugador",
                  image: r.player.image,
                  score: r.score,
                  position: i + 1,
                }));
                const podiumOrder = [
                  top3.find(w => w.position === 2),
                  top3.find(w => w.position === 1),
                  top3.find(w => w.position === 3),
                ].filter(Boolean);

                return podiumOrder.map((winner, index) => {
                  if (!winner) return null;
                  const isFirst = winner.position === 1;
                  const isSecond = winner.position === 2;

                  return (
                    <motion.div
                      key={winner.alias}
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.2 + 0.5, type: "spring" }}
                      className="flex flex-col items-center"
                    >
                      <div className={`relative mb-4 ${isFirst ? "mb-8 scale-125" : ""}`}>
                        <Avatar className={`w-24 h-24 border-4 ${isFirst ? "border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]" : isSecond ? "border-zinc-300" : "border-orange-600"}`}>
                          <AvatarImage src={winner.image || ""} />
                          <AvatarFallback>{winner.alias[0]}</AvatarFallback>
                        </Avatar>
                        {isFirst && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                            <Crown size={48} className="text-yellow-400 fill-yellow-400 animate-bounce" />
                          </div>
                        )}
                      </div>

                      <div className={`w-32 rounded-t-lg flex flex-col items-center justify-start pt-4 text-black font-bold uppercase tracking-widest ${isFirst ? "h-64 bg-gradient-to-b from-yellow-400 to-yellow-600" : isSecond ? "h-48 bg-gradient-to-b from-zinc-300 to-zinc-500" : "h-32 bg-gradient-to-b from-orange-400 to-orange-700"}`}>
                        <span className="text-4xl opacity-50 mb-2">{winner.position}°</span>
                        <span className="text-sm px-2 text-center line-clamp-1 w-full">{winner.alias}</span>
                        <span className="mt-auto mb-4 bg-black/20 px-3 py-1 rounded-full text-white text-xs">
                          {winner.score} PTS
                        </span>
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
