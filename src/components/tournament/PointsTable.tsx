"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Crown } from "lucide-react";

type RankingItem = {
  playerId: string;
  alias: string;
  name: string;
  image: string | null;
  score: number;
  position: number;
};

interface PointsTableProps {
  data: RankingItem[];
}

export default function PointsTable({ data }: PointsTableProps) {
  // Sort data by score just in case, though parent should provide sorted data
  const sortedData = [...data].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-2">
      <div className="flex justify-between px-4 py-2 text-zinc-500 text-xs font-bold uppercase tracking-wider">
        <span>Posición</span>
        <span>Jugador</span>
        <span>Puntaje</span>
      </div>

      <div className="space-y-2 relative min-h-[400px]">
        <AnimatePresence>
          {sortedData.map((player, index) => (
            <motion.div
              key={player.playerId}
              layoutId={player.playerId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className={`
                flex items-center justify-between p-4 rounded-xl border 
                ${index === 0 ? "bg-gradient-to-r from-yellow-900/40 to-black border-yellow-500/50" :
                  index === 1 ? "bg-gradient-to-r from-zinc-800 to-black border-zinc-400/50" :
                    index === 2 ? "bg-gradient-to-r from-orange-900/30 to-black border-orange-600/50" :
                      "bg-zinc-900/50 border-white/5"}
                backdrop-blur-sm shadow-lg
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  flex items-center justify-center w-8 h-8 font-black text-lg
                  ${index === 0 ? "text-yellow-400" :
                    index === 1 ? "text-gray-300" :
                      index === 2 ? "text-orange-400" : "text-zinc-600"}
                `}>
                  {index + 1}
                </div>

                <div className="relative">
                  <Avatar className={`h-12 w-12 border-2 ${index === 0 ? "border-yellow-400" :
                      index === 1 ? "border-zinc-300" :
                        index === 2 ? "border-orange-500" : "border-white/10"
                    }`}>
                    <AvatarImage src={player.image || ""} />
                    <AvatarFallback>{player.alias[0]}</AvatarFallback>
                  </Avatar>
                  {index === 0 && (
                    <div className="absolute -top-3 -right-2 text-yellow-500 drop-shadow-lg animate-bounce duration-1000">
                      <Crown size={20} fill="currentColor" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className={`font-bold text-lg ${index === 0 ? "text-yellow-100" : "text-white"}`}>
                    {player.alias}
                  </span>
                  <span className="text-xs text-zinc-500 uppercase">{player.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-3xl font-black tracking-tighter text-white">
                  {player.score}
                </span>
                <span className="text-xs text-zinc-500 font-bold self-end mb-2">PTS</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
