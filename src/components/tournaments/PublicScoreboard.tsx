"use client";

import { useEffect, useMemo } from "react";
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
  tournamentId,
  isTeamBased = false,
  teams = []
}: {
  registrations: Registration[],
  status: string,
  tournamentId: string,
  isTeamBased?: boolean,
  teams?: any[]
}) {
  const router = useRouter();

  // Auto-refresh the page data every 10s if live, or 60s if finished, so it detects reactivation
  useEffect(() => {
    if (status !== "EN_JUEGO" && status !== "FINALIZADO") return;
    const intervalTime = status === "EN_JUEGO" ? 10000 : 60000;
    const interval = setInterval(() => {
      router.refresh();
    }, intervalTime);
    return () => clearInterval(interval);
  }, [status, router]);

  const isLiveOrFinished = status === "EN_JUEGO" || status === "FINALIZADO";

  // Normalize into standard items depending on Team or Solo mode
  const displayItems = useMemo(() => {
    let items = [];

    if (isTeamBased && teams && teams.length > 0) {
      items = teams.map(team => {
        const teamPlayerIds = new Set(team.players.map((p: any) => p.id));
        const teamRegs = registrations.filter(r => teamPlayerIds.has(r.playerId));
        const totalScore = teamRegs.reduce((sum, r) => sum + r.score, 0);
        
        return {
          id: team.id,
          name: team.name,
          image: team.image || null, // Team Avatar
          score: totalScore,
          subtitle: team.players.map((p: any) => p.alias || p.name).join(", ")
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

    // Sort by score if live/finished, else by name
    return items.sort((a, b) => {
      if (isLiveOrFinished) {
        if (b.score !== a.score) return b.score - a.score;
      }
      return a.name.localeCompare(b.name);
    });
  }, [registrations, isTeamBased, teams, isLiveOrFinished]);

  if (registrations.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-900/50 border border-white/10 rounded-2xl">
        <Users className="w-8 h-8 mx-auto text-gray-500 mb-2" />
        <p className="text-gray-400">Aún no hay jugadores inscriptos.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <AnimatePresence>
        {displayItems.map((item, index) => {
          const itemName = item.name;
          const isFirst = index === 0;
          const isSecond = index === 1;
          const isThird = index === 2;

          let rankBadge = (
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0">
              {index + 1}
            </div>
          );

          if (status === "FINALIZADO") {
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
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${status === "FINALIZADO" && isFirst ? "bg-yellow-900/10 border-yellow-500/30" : "bg-black/20 border-white/5"
                }`}
            >
              <div className="flex items-center gap-3">
                {isLiveOrFinished && rankBadge}

                <Avatar className={`border ${status === "FINALIZADO" && isFirst ? "border-yellow-500/50" : "border-gray-700"}`}>
                  <AvatarImage src={item.image || ""} alt={itemName} className="object-cover" />
                  <AvatarFallback className="bg-gray-800 text-gray-400">{itemName[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <span className={`font-bold ${status === "FINALIZADO" && isFirst ? "text-yellow-400" : "text-white"}`}>
                    {itemName}
                  </span>
                  {item.subtitle && (
                    <span className="text-xs text-gray-400 font-normal">{item.subtitle}</span>
                  )}
                </div>
              </div>

              {isLiveOrFinished && (
                <div className="flex items-center gap-1">
                  <span className={`text-xl font-black ${status === "FINALIZADO" && isFirst ? "text-yellow-500" : "text-white"}`}>
                    {item.score}
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
