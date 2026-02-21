"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users } from "lucide-react";

type Registration = {
  playerId: string;
  score: number;
  player: {
    alias: string | null;
    name: string | null;
    image: string | null;
  };
};

export function PublicScoreboard({
  registrations,
  status,
  tournamentId
}: {
  registrations: Registration[],
  status: string,
  tournamentId: string
}) {
  const router = useRouter();

  // Auto-refresh the page data every 10 seconds if the tournament is LIVE
  useEffect(() => {
    if (status !== "EN_JUEGO") return;
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [status, router]);

  if (registrations.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-900/50 border border-white/10 rounded-2xl">
        <Users className="w-8 h-8 mx-auto text-gray-500 mb-2" />
        <p className="text-gray-400">Aún no hay jugadores inscriptos.</p>
      </div>
    );
  }

  const isLiveOrFinished = status === "EN_JUEGO" || status === "FINALIZADO";

  // If live or finished, sort by score descending. Else, keep insertion order (or alphabetical).
  const sortedRegistrations = [...registrations].sort((a, b) => {
    if (isLiveOrFinished) {
      if (b.score !== a.score) return b.score - a.score;
    }
    const nameA = a.player.alias || a.player.name || "";
    const nameB = b.player.alias || b.player.name || "";
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="grid gap-2">
      <AnimatePresence>
        {sortedRegistrations.map((reg, index) => {
          const playerName = reg.player.alias || reg.player.name || "Jugador";
          const isFirst = index === 0;
          const isSecond = index === 1;
          const isThird = index === 2;

          let rankBadge = (
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0">
              {index + 1}
            </div>
          );

          if (isLiveOrFinished) {
            if (isFirst) {
              rankBadge = (
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
              );
            } else if (isSecond) {
              rankBadge = (
                <div className="w-9 h-9 rounded-full bg-gray-400/10 border border-gray-400/30 flex items-center justify-center shrink-0">
                  <span className="text-lg">🥈</span>
                </div>
              );
            } else if (isThird) {
              rankBadge = (
                <div className="w-9 h-9 rounded-full bg-orange-900/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <span className="text-lg">🥉</span>
                </div>
              );
            }
          }

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={reg.playerId}
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isLiveOrFinished && isFirst ? "bg-yellow-900/10 border-yellow-500/30" : "bg-black/20 border-white/5"
                }`}
            >
              <div className="flex items-center gap-3">
                {isLiveOrFinished && rankBadge}

                <Avatar className={`border ${isLiveOrFinished && isFirst ? "border-yellow-500/50" : "border-gray-700"}`}>
                  <AvatarImage src={reg.player.image || ""} alt={playerName} className="object-cover" />
                  <AvatarFallback className="bg-gray-800 text-gray-400">{playerName[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>

                <span className={`font-bold ${isLiveOrFinished && isFirst ? "text-yellow-400" : "text-white"}`}>
                  {playerName}
                </span>
              </div>

              {isLiveOrFinished && (
                <div className="flex items-center gap-1">
                  <span className={`text-xl font-black ${isFirst ? "text-yellow-500" : "text-white"}`}>
                    {reg.score}
                  </span>
                  <span className="text-xs text-gray-500 font-bold uppercase mt-1">PTS</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
