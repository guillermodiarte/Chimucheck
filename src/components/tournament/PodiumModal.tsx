"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, Crown, PartyPopper, Share2 } from "lucide-react";
import Confetti from "react-confetti";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PodiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  winners: {
    alias: string;
    image: string | null;
    score: number;
    position: number;
    players?: { id: string; alias?: string; name?: string }[];
  }[];
}

export function PodiumModal({ isOpen, onClose, winners }: PodiumModalProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [confettiKey, setConfettiKey] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setConfettiKey(prev => prev + 1);
      const interval = setInterval(() => {
        setConfettiKey(prev => prev + 1);
      }, 10000); // Repeat confetti every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const top3 = winners.slice(0, 3);
  // Reorder for visual podium: 2nd, 1st, 3rd
  const podiumOrder = [
    top3.find(w => w.position === 2),
    top3.find(w => w.position === 1),
    top3.find(w => w.position === 3),
  ].filter(Boolean);

  const handleShare = async () => {
    const shareData = {
      title: "ChimuCheck - ¡Torneo Finalizado!",
      text: `🏆 Resultados del torneo:\n${top3.map(w => `${w?.position}º ${w?.alias}`).join('\n')}\n\n¡Mirá la tabla completa acá! 👇`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error al compartir", err);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      toast.success("¡Enlace copiado al portapapeles!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-3xl max-h-[95vh] h-auto pt-6 pb-10 bg-black/95 border-none flex flex-col items-center justify-center overflow-y-auto z-[110]">
        <VisuallyHidden><DialogTitle>Torneo Finalizado</DialogTitle></VisuallyHidden>
        
        {/* The key prop re-mounts the Confetti component to restart the animation */}
        {isOpen && <Confetti key={confettiKey} width={windowSize.width} height={windowSize.height} numberOfPieces={400} recycle={false} />}

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className="text-center mb-10 mt-2"
        >
          <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 uppercase tracking-tighter drop-shadow-lg">
            ¡Torneo Finalizado!
          </h2>
          <p className="text-xl md:text-2xl text-white mt-4 font-light">
            Felicitaciones a los ganadores
          </p>
        </motion.div>

        <div className="flex items-end justify-center gap-1 md:gap-3 w-full px-2">
          {podiumOrder.map((winner, index) => {
            const isFirst = winner?.position === 1;
            const isSecond = winner?.position === 2;
            const isThird = winner?.position === 3;

            if (!winner) return null;

            const maxVisible = isFirst ? 6 : isSecond ? 4 : 3;
            const needsScroll = winner.players && winner.players.length > maxVisible;

            return (
              <motion.div
                key={winner.alias}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2 + 0.5, type: "spring" }}
                className="flex flex-col items-center w-full max-w-[110px] md:max-w-[170px]"
              >
                {/* Avatar */}
                <div className={`relative mb-4 ${isFirst ? "mb-8 scale-110 md:scale-125" : "scale-90 md:scale-100"}`}>
                  <Avatar className={`w-20 h-20 md:w-24 md:h-24 border-4 ${isFirst ? "border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]" :
                    isSecond ? "border-zinc-300" :
                      "border-orange-600"
                    }`}>
                    <AvatarImage src={winner.image || ""} />
                    <AvatarFallback>{winner.alias[0]}</AvatarFallback>
                  </Avatar>
                  {isFirst && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                      <Crown size={48} className="text-yellow-400 fill-yellow-400 animate-bounce" />
                    </div>
                  )}
                </div>

                {/* Bar */}
                <div className={`w-full rounded-t-lg flex flex-col items-center justify-start pt-4 text-black font-bold uppercase tracking-widest ${isFirst ? "h-64 md:h-72 bg-gradient-to-b from-yellow-400 to-yellow-600" :
                  isSecond ? "h-48 md:h-56 bg-gradient-to-b from-zinc-300 to-zinc-500" :
                    "h-36 md:h-44 bg-gradient-to-b from-orange-400 to-orange-700"
                  }`}>
                  <span className="text-3xl md:text-4xl opacity-50 mb-2">{winner.position}°</span>
                  <span className="text-xs md:text-sm px-1 md:px-2 text-center leading-tight w-full break-words">
                    {winner.alias}
                  </span>
                  
                  {(() => {
                    const threshold = isFirst ? 10 : isSecond ? 6 : 4;
                    const shouldScroll = winner.players && winner.players.length > threshold;
                    return winner.players && winner.players.length > 0 && (
                      <div className="w-full flex-1 overflow-hidden relative mt-2 mb-2 flex flex-col items-center justify-start">
                        <style>{`
                          @keyframes scroll-vertical {
                            0% { transform: translateY(0); }
                            100% { transform: translateY(-50%); }
                          }
                          .animate-scroll-v {
                            animation: scroll-vertical linear infinite;
                          }
                        `}</style>
                        <div
                          className={`flex flex-col items-center gap-[2px] w-full ${shouldScroll ? "animate-scroll-v" : "justify-center h-full"}`}
                          style={{ animationDuration: shouldScroll ? `${winner.players.length * 1.5}s` : undefined }}
                        >
                          {winner.players.map((p: any) => (
                            <span key={p.id} className="text-[9px] md:text-[10px] text-black/80 font-bold truncate max-w-full px-2 text-center leading-tight">
                              {p.alias || p.name}
                            </span>
                          ))}
                          {shouldScroll && winner.players.map((p: any) => (
                            <span key={`dup-${p.id}`} className="text-[9px] md:text-[10px] text-black/80 font-bold truncate max-w-full px-2 text-center leading-tight">
                              {p.alias || p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  
                  <span className="mb-4 bg-black/20 px-3 py-1 rounded-full text-white text-xs whitespace-nowrap">
                    {winner.score} PTS
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 1.5 }}
           className="mt-6 mb-2 relative z-50 text-center flex gap-4"
        >
          <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20 border-white/20 font-bold" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartir Resultado
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
