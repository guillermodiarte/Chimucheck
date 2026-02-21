"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, Crown, PartyPopper } from "lucide-react";
import Confetti from "react-confetti";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PodiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  winners: {
    alias: string;
    image: string | null;
    score: number;
    position: number;
  }[];
}

export function PodiumModal({ isOpen, onClose, winners }: PodiumModalProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  const top3 = winners.slice(0, 3);
  // Reorder for visual podium: 2nd, 1st, 3rd
  const podiumOrder = [
    top3.find(w => w.position === 2),
    top3.find(w => w.position === 1),
    top3.find(w => w.position === 3),
  ].filter(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] h-[90vh] bg-black/90 border-none flex flex-col items-center justify-center overflow-hidden z-[110]">
        {isOpen && <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={500} recycle={false} />}

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
          {podiumOrder.map((winner, index) => {
            const isFirst = winner?.position === 1;
            const isSecond = winner?.position === 2;
            const isThird = winner?.position === 3;

            if (!winner) return null;

            return (
              <motion.div
                key={winner.alias}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2 + 0.5, type: "spring" }}
                className="flex flex-col items-center"
              >
                {/* Avatar */}
                <div className={`relative mb-4 ${isFirst ? "mb-8 scale-125" : ""}`}>
                  <Avatar className={`w-24 h-24 border-4 ${isFirst ? "border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]" :
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
                <div className={`w-32 rounded-t-lg flex flex-col items-center justify-start pt-4 text-black font-bold uppercase tracking-widest ${isFirst ? "h-64 bg-gradient-to-b from-yellow-400 to-yellow-600" :
                  isSecond ? "h-48 bg-gradient-to-b from-zinc-300 to-zinc-500" :
                    "h-32 bg-gradient-to-b from-orange-400 to-orange-700"
                  }`}>
                  <span className="text-4xl opacity-50 mb-2">{winner.position}°</span>
                  <span className="text-sm px-2 text-center line-clamp-1 w-full">{winner.alias}</span>
                  <span className="mt-auto mb-4 bg-black/20 px-3 py-1 rounded-full text-white text-xs">
                    {winner.score} PTS
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
