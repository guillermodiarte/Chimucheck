"use client";

import { Instagram, Heart, User } from "lucide-react";

interface PodiumEntry {
  id: string;
  imageUrl: string;
  instagramAccount: string | null;
  authorName: string | null;
  voteCount: number;
}

interface VotingPodiumProps {
  top3: PodiumEntry[];
}

const PODIUM_CONFIG = [
  {
    rank: 1,
    emoji: "🥇",
    label: "1er Lugar",
    height: "h-40",
    glow: "shadow-[0_0_40px_rgba(255,215,0,0.5)]",
    border: "border-yellow-400",
    bg: "bg-gradient-to-b from-yellow-400/20 to-yellow-900/10",
    text: "text-yellow-400",
    barBg: "bg-gradient-to-t from-yellow-600 to-yellow-400",
    barHeight: "h-32",
    order: "order-2",
    imageSize: "w-28 h-28",
    zIndex: "z-10",
  },
  {
    rank: 2,
    emoji: "🥈",
    label: "2do Lugar",
    height: "h-28",
    glow: "shadow-[0_0_30px_rgba(192,192,192,0.4)]",
    border: "border-gray-300",
    bg: "bg-gradient-to-b from-gray-300/15 to-gray-700/10",
    text: "text-gray-300",
    barBg: "bg-gradient-to-t from-gray-500 to-gray-300",
    barHeight: "h-20",
    order: "order-1",
    imageSize: "w-24 h-24",
    zIndex: "z-0",
  },
  {
    rank: 3,
    emoji: "🥉",
    label: "3er Lugar",
    height: "h-20",
    glow: "shadow-[0_0_25px_rgba(205,127,50,0.4)]",
    border: "border-amber-600",
    bg: "bg-gradient-to-b from-amber-600/15 to-amber-900/10",
    text: "text-amber-500",
    barBg: "bg-gradient-to-t from-amber-800 to-amber-600",
    barHeight: "h-12",
    order: "order-3",
    imageSize: "w-20 h-20",
    zIndex: "z-0",
  },
];

export function VotingPodium({ top3 }: VotingPodiumProps) {
  if (top3.length === 0) return null;

  // Arrange: 2nd, 1st, 3rd
  const display = [
    top3[1] ? { ...top3[1], config: PODIUM_CONFIG[1] } : null,
    top3[0] ? { ...top3[0], config: PODIUM_CONFIG[0] } : null,
    top3[2] ? { ...top3[2], config: PODIUM_CONFIG[2] } : null,
  ].filter(Boolean) as Array<PodiumEntry & { config: typeof PODIUM_CONFIG[0] }>;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-400 text-xs font-bold uppercase tracking-wider">
          🏆 Resultados Finales
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
          Las <span className="text-yellow-400 drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">Ganadoras</span>
        </h2>
        <p className="text-gray-400 text-sm">Las imágenes más votadas por la comunidad</p>
      </div>

      {/* Podium stage */}
      <div className="relative max-w-2xl mx-auto">
        {/* Ambient glow behind */}
        <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
          <div className="w-2/3 h-32 bg-yellow-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative flex items-end justify-center gap-3 md:gap-6 pb-2">
          {display.map((item) => {
            const cfg = item.config;
            return (
              <div
                key={item.id}
                className={`flex flex-col items-center gap-3 ${cfg.order} ${cfg.zIndex}`}
              >
                {/* Image card */}
                <div className={`relative ${cfg.imageSize} rounded-2xl overflow-hidden border-2 ${cfg.border} ${cfg.glow} transition-all duration-500 group`}>
                  <img
                    src={item.imageUrl}
                    alt={item.authorName || cfg.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Rank emoji badge */}
                  <div className="absolute -top-2 -right-2 text-2xl drop-shadow-lg z-10">
                    {cfg.emoji}
                  </div>
                </div>

                {/* Author info */}
                <div className="text-center space-y-0.5 max-w-[120px]">
                  {item.instagramAccount && (
                    <p className={`text-xs font-bold flex items-center justify-center gap-1 ${cfg.text}`}>
                      <Instagram className="w-3 h-3" />
                      <span className="truncate">{item.instagramAccount}</span>
                    </p>
                  )}
                  {item.authorName && (
                    <p className="text-gray-300 text-xs truncate">{item.authorName}</p>
                  )}
                  <div className="flex items-center justify-center gap-1 pt-1">
                    <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                    <span className="text-white text-xs font-black">{item.voteCount}</span>
                    <span className="text-gray-500 text-xs">votos</span>
                  </div>
                </div>

                {/* Podium bar */}
                <div className={`w-20 md:w-28 ${cfg.barHeight} ${cfg.barBg} rounded-t-xl flex items-start justify-center pt-2 shadow-lg`}>
                  <span className={`text-xl md:text-2xl font-black ${cfg.rank === 1 ? "text-yellow-900" : cfg.rank === 2 ? "text-gray-600" : "text-amber-900"}`}>
                    {cfg.rank}°
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Base platform */}
        <div className="h-3 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
      </div>

      {/* Full ranking list (all entries beyond top 3) */}
    </div>
  );
}
