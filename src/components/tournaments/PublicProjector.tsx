"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Minimize2, Maximize2, Image as ImageIcon, X, Crown, Share2 } from "lucide-react";
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
  isTeamBased?: boolean;
  teams?: any[];
}

export function PublicProjector({
  registrations,
  status,
  tournamentId,
  bannerImages,
  isTeamBased = false,
  teams = [],
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

  const displayItems = useMemo(() => {
    let items = [];

    if (isTeamBased && teams && teams.length > 0) {
      items = teams.map(team => {
        const teamPlayerIds = new Set(team.players.map((p: any) => p.id));
        const teamRegs = registrations.filter(r => teamPlayerIds.has(r.playerId));
        const totalScore = teamRegs.length > 0 ? Math.max(...teamRegs.map(r => r.score)) : 0;
        
        return {
          id: team.id,
          name: team.name,
          image: team.image || null, // Bugfix 2: Avatar de Equipo vs Jugador
          score: totalScore,
          subtitle: team.players.map((p: any) => p.alias || p.name).join(", "),
          players: team.players,
        };
      });
    } else {
      items = registrations.map(reg => ({
        id: reg.playerId,
        name: reg.player.alias || reg.player.name || "Jugador",
        image: reg.player.image || null,
        score: reg.score,
        subtitle: null
      }));
    }

    return items.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });
  }, [registrations, isTeamBased, teams]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: '¡Resultados del Torneo!',
          text: `¡Revisa las posiciones finales del Torneo!`,
          url
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("¡Enlace copiado al portapapeles!");
    }
  };

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
            {displayItems.map((item, index) => {
              const itemName = item.name;
              const uniqueScores = Array.from(new Set(displayItems.map(i => i.score))).sort((a, b) => b - a);
              let rankIndex = index;
              if (status === "FINALIZADO" || status === "EN_JUEGO") {
                rankIndex = uniqueScores.indexOf(item.score);
              }
              const isFirst = rankIndex === 0;
              const isSecond = rankIndex === 1;
              const isThird = rankIndex === 2;
              const isFinished = status === "FINALIZADO";
              const isTop3 = isFinished && (isFirst || isSecond || isThird);

              let borderClass = "border-white/10";
              let bgClass = "bg-black/40";
              let textClass = "text-white";
              let rankContent: React.ReactNode = <span className="text-gray-400">{rankIndex + 1}</span>;

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
                  key={item.id}
                  className={`flex items-center justify-between p-4 md:p-5 rounded-xl border ${borderClass} ${bgClass} backdrop-blur-md`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 border ${borderClass} bg-black/30 text-lg font-bold`}>
                      {rankContent}
                    </div>

                    {/* Avatar */}
                    <Avatar className={`w-10 h-10 md:w-12 md:h-12 border-2 ${isFinished && isFirst ? "border-yellow-500/50" : "border-gray-700"}`}>
                      <AvatarImage src={item.image || ""} alt={itemName} className="object-cover" />
                      <AvatarFallback className="bg-gray-800 text-gray-400 text-lg">{itemName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>

                    {/* Name */}
                    <div className="flex flex-col">
                      <span className={`font-bold text-xl md:text-2xl ${textClass}`}>
                        {itemName}
                      </span>
                      {item.subtitle && (
                        <span className="text-xs md:text-sm text-gray-400 font-normal">{item.subtitle}</span>
                      )}
                    </div>
                  </div>

                  {/* Score + Trophy */}
                  <div className="flex items-center gap-3">
                    {isTop3 && (
                      <Trophy className={`w-6 h-6 ${isFirst ? "text-yellow-500" : isSecond ? "text-gray-400" : "text-orange-500"}`} />
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl md:text-4xl font-black ${textClass}`}>
                        {item.score}
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
              <p className="text-2xl text-white mt-4 font-light mb-6">
                Felicitaciones a los ganadores
              </p>
              <Button
                onClick={handleShare}
                className="bg-primary/20 hover:bg-primary/40 text-primary border border-primary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(var(--primary-color-rgb),0.3)] transition-all"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Compartir Podio
              </Button>
            </motion.div>

            <div className="flex items-end justify-center gap-2 md:gap-12">
              {(() => {
                const top3 = displayItems.slice(0, 3).map((item: any, i) => ({
                  alias: item.name,
                  image: item.image,
                  score: item.score,
                  position: i + 1,
                  players: item.players,
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
                        <span className="text-[10px] md:text-sm px-1 text-center break-words whitespace-normal leading-tight w-full max-w-[120px]">{winner.alias}</span>
                        {(() => {
                          const threshold = isFirst ? 8 : isSecond ? 5 : 3;
                          const shouldScroll = winner.players && winner.players.length > threshold;
                          return winner.players && winner.players.length > 0 && (
                            <div className="w-full flex-[1_1_0%] overflow-hidden relative mt-2 mb-2 flex flex-col items-center justify-start">
                              <style>{`
                                @keyframes scroll-vertical-proj {
                                  0% { transform: translateY(0); }
                                  100% { transform: translateY(-50%); }
                                }
                                .animate-scroll-v-proj {
                                  animation: scroll-vertical-proj linear infinite;
                                }
                              `}</style>
                              <div
                                className={`flex flex-col items-center gap-[2px] w-full ${shouldScroll ? "animate-scroll-v-proj" : "justify-center h-full"}`}
                                style={{ animationDuration: shouldScroll ? `${winner.players.length * 1.5}s` : undefined }}
                              >
                                {winner.players.map((p: any) => (
                                  <span key={p.id} className="text-[9px] md:text-xs text-black/70 font-semibold truncate max-w-full px-2 text-center leading-tight">
                                    {p.alias || p.name}
                                  </span>
                                ))}
                                {shouldScroll && winner.players.map((p: any) => (
                                  <span key={`dup-${p.id}`} className="text-[9px] md:text-xs text-black/70 font-semibold truncate max-w-full px-2 text-center leading-tight">
                                    {p.alias || p.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                        <div className="flex-none" />
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
