"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Medal, Sparkles, ChevronRight, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface TopPlayerItem {
  id: string;
  rank: number;
  name: string;
  alias?: string | null;
  avatar?: string | null;
  score: number;
  formattedScore?: string;
  medal?: string;
  winsFirst?: number;
}

interface TopPlayersBannerSlideProps {
  players: TopPlayerItem[];
}

const RANK_THEMES = [
  {
    rank: 1,
    badgeText: "#1",
    badgeClass: "bg-amber-400 text-black shadow-[0_0_16px_rgba(251,191,36,0.8)]",
    borderClass: "border-amber-400/90 group-hover:border-amber-300",
    glowClass: "shadow-[0_0_30px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_45px_rgba(245,158,11,0.6)]",
    cardBg: "from-amber-950/30 via-gray-900/90 to-black/95",
    accentColor: "#fbbf24",
    accentText: "text-amber-400",
    pedestalFill: "rgba(245, 158, 11, 0.28)",
    pedestalStroke: "rgba(251, 191, 36, 0.7)",
    ringColor: "ring-amber-400",
    medalIcon: "🥇",
    label: "Líder",
  },
  {
    rank: 2,
    badgeText: "#2",
    badgeClass: "bg-cyan-400 text-black shadow-[0_0_16px_rgba(34,211,238,0.8)]",
    borderClass: "border-cyan-400/90 group-hover:border-cyan-300",
    glowClass: "shadow-[0_0_30px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_45px_rgba(6,182,212,0.6)]",
    cardBg: "from-cyan-950/30 via-gray-900/90 to-black/95",
    accentColor: "#22d3ee",
    accentText: "text-cyan-400",
    pedestalFill: "rgba(6, 182, 212, 0.28)",
    pedestalStroke: "rgba(34, 211, 238, 0.7)",
    ringColor: "ring-cyan-400",
    medalIcon: "🥈",
    label: "Top 2",
  },
  {
    rank: 3,
    badgeText: "#3",
    badgeClass: "bg-purple-500 text-white shadow-[0_0_16px_rgba(168,85,247,0.8)]",
    borderClass: "border-purple-400/90 group-hover:border-purple-300",
    glowClass: "shadow-[0_0_30px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_45px_rgba(168,85,247,0.6)]",
    cardBg: "from-purple-950/30 via-gray-900/90 to-black/95",
    accentColor: "#c084fc",
    accentText: "text-purple-400",
    pedestalFill: "rgba(168, 85, 247, 0.28)",
    pedestalStroke: "rgba(192, 132, 252, 0.7)",
    ringColor: "ring-purple-400",
    medalIcon: "🥉",
    label: "Top 3",
  },
  {
    rank: 4,
    badgeText: "#4",
    badgeClass: "bg-rose-500 text-white shadow-[0_0_16px_rgba(244,63,94,0.8)]",
    borderClass: "border-rose-400/90 group-hover:border-rose-300",
    glowClass: "shadow-[0_0_30px_rgba(244,63,94,0.3)] group-hover:shadow-[0_0_45px_rgba(244,63,94,0.6)]",
    cardBg: "from-rose-950/30 via-gray-900/90 to-black/95",
    accentColor: "#fb7185",
    accentText: "text-rose-400",
    pedestalFill: "rgba(244, 63, 94, 0.28)",
    pedestalStroke: "rgba(251, 113, 133, 0.7)",
    ringColor: "ring-rose-400",
    medalIcon: "🎖️",
    label: "Top 4",
  },
  {
    rank: 5,
    badgeText: "#5",
    badgeClass: "bg-emerald-400 text-black shadow-[0_0_16px_rgba(52,211,153,0.8)]",
    borderClass: "border-emerald-400/90 group-hover:border-emerald-300",
    glowClass: "shadow-[0_0_30px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_45px_rgba(16,185,129,0.6)]",
    cardBg: "from-emerald-950/30 via-gray-900/90 to-black/95",
    accentColor: "#34d399",
    accentText: "text-emerald-400",
    pedestalFill: "rgba(16, 185, 129, 0.28)",
    pedestalStroke: "rgba(52, 211, 153, 0.7)",
    ringColor: "ring-emerald-400",
    medalIcon: "⚡",
    label: "Top 5",
  },
];

export default function TopPlayersBannerSlide({ players }: TopPlayersBannerSlideProps) {
  // Ensure we always have 5 slots represented
  const slots = [1, 2, 3, 4, 5].map((rank) => {
    const player = players.find((p) => p.rank === rank) || null;
    const theme = RANK_THEMES[rank - 1];
    return { rank, player, theme };
  });

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#050914] via-[#070d1d] to-[#03060c] pt-20 pb-16 px-4 select-none">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* Title & decorative gold accent bar (as in reference image) */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Ranking Oficial de Temporada
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase drop-shadow-[0_0_35px_rgba(255,255,255,0.3)]">
            TOP MEJORES JUGADORES
          </h2>

          {/* Golden underline bar inspired by reference */}
          <div className="w-32 sm:w-48 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full mx-auto mt-3 shadow-[0_0_15px_rgba(245,158,11,0.85)]" />
        </motion.div>

        {/* 5 Cards Row */}
        <div className="w-full">
          {/* Desktop & Tablet grid: 5 columns / Mobile: Horizontal smooth scroll */}
          <div className="flex md:grid md:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 overflow-x-auto md:overflow-visible pb-4 md:pb-0 px-2 scrollbar-none snap-x snap-mandatory">
            {slots.map(({ rank, player, theme }, index) => {
              const playerName = player
                ? (player.alias || player.name || `Jugador ${rank}`).toUpperCase()
                : `JUGADOR ${rank}`;
              const scoreText = player
                ? `${player.score.toLocaleString("es-AR")} Chimucoins`
                : "Sin puntaje";
              const avatarInitials = player
                ? (player.name || player.alias || "CH").slice(0, 2).toUpperCase()
                : `${rank}`;

              const cardContent = (
                <div
                  className={`relative w-[210px] sm:w-[220px] md:w-auto shrink-0 snap-center rounded-2xl border-2 ${theme.borderClass} ${theme.glowClass} bg-gradient-to-b ${theme.cardBg} backdrop-blur-xl p-4 sm:p-5 flex flex-col items-center text-center transition-all duration-300 group hover:-translate-y-2 hover:scale-[1.02] cursor-pointer`}
                >
                  {/* Top Rank Badge (centered on top border like reference) */}
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-md font-black text-xs sm:text-sm tracking-wider uppercase ${theme.badgeClass} z-20`}
                  >
                    {theme.badgeText}
                  </div>

                  {/* Character Illustration / Avatar Container inspired by reference */}
                  <div className="relative w-full aspect-[4/3.8] max-w-[170px] mt-2 mb-3 flex flex-col items-center justify-end">
                    {/* Background dome/arch behind avatar like reference */}
                    <div
                      className="absolute inset-0 rounded-t-[50px] rounded-b-2xl border border-white/5 opacity-80"
                      style={{
                        background: `radial-gradient(ellipse at center top, ${theme.accentColor}25 0%, #0d1424 70%)`,
                      }}
                    />

                    {/* Circular Avatar with neon glowing ring */}
                    <div className="relative z-10 -mb-2">
                      <div
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 ring-2 ${theme.ringColor} shadow-[0_0_20px_${theme.accentColor}50] bg-gray-950 flex items-center justify-center`}
                      >
                        {player?.avatar ? (
                          <Avatar className="w-full h-full">
                            <AvatarImage
                              src={player.avatar}
                              alt={playerName}
                              className="object-cover"
                            />
                            <AvatarFallback
                              className="font-black text-lg bg-gray-800 text-white"
                            >
                              {avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-gray-950 flex items-center justify-center text-white/90 font-black text-base sm:text-lg">
                            {player ? avatarInitials : <User className="w-7 h-7 text-gray-500" />}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stylized Pedestal/Body Trapeze from reference */}
                    <div className="relative z-0 w-full flex justify-center">
                      <svg
                        viewBox="0 0 140 55"
                        className="w-28 sm:w-32 h-auto drop-shadow-md"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polygon
                          points="25,4 115,4 135,52 5,52"
                          fill={theme.pedestalFill}
                          stroke={theme.pedestalStroke}
                          strokeWidth="2"
                        />
                        {/* Inner cyber highlight line */}
                        <line
                          x1="38"
                          y1="12"
                          x2="102"
                          y2="12"
                          stroke={theme.accentColor}
                          strokeWidth="2"
                          strokeLinecap="round"
                          opacity="0.8"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Player Name */}
                  <h3
                    className="w-full font-black text-white text-sm sm:text-base tracking-wide uppercase truncate px-1 drop-shadow-sm group-hover:text-yellow-300 transition-colors"
                    title={playerName}
                  >
                    {playerName}
                  </h3>

                  {/* Score & Chimucoins Badge */}
                  <div className="mt-2 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-xs font-semibold text-gray-200">
                    <span className="text-yellow-400">🪙</span>
                    <span className={`font-mono font-bold ${theme.accentText}`}>
                      {player ? player.score.toLocaleString("es-AR") : "0"}
                    </span>
                    <span className="text-[10px] text-gray-400">pts</span>
                  </div>

                  {/* Rank tag / View profile hint */}
                  <div className="mt-3 flex items-center justify-center gap-1 text-[11px] font-medium text-gray-400 group-hover:text-white transition-colors">
                    <span>{theme.label}</span>
                    <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );

              return (
                <motion.div
                  key={rank}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="w-full"
                >
                  {player?.id ? (
                    <Link href={`/jugador/${player.id}`} className="block h-full">
                      {cardContent}
                    </Link>
                  ) : (
                    cardContent
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile scroll indicator hint */}
        <p className="md:hidden text-xs text-gray-400 mt-3 text-center flex items-center gap-1">
          <span>👈 Desliza para ver el Top 5 completo 👉</span>
        </p>
      </div>
    </div>
  );
}
