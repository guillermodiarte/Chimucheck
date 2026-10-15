"use client";

import { Instagram, Heart, User } from "lucide-react";

export interface PodiumEntry {
  id: string;
  imageUrl: string;
  instagramAccount: string | null;
  authorName: string | null;
  voteCount: number;
  hasVoted?: boolean;
  voters?: any[];
}

interface VotingPodiumProps {
  top3: PodiumEntry[];
  onSelectEntry?: (entry: PodiumEntry) => void;
  compact?: boolean;
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
    barHeightCompact: "h-22 sm:h-26",
    barWidth: "w-20 md:w-28",
    barWidthCompact: "w-20 sm:w-24",
    order: "order-2",
    imageSize: "w-28 h-28",
    imageSizeCompact: "w-20 h-20 sm:w-24 sm:h-24",
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
    barHeightCompact: "h-14 sm:h-18",
    barWidth: "w-20 md:w-28",
    barWidthCompact: "w-18 sm:w-20",
    order: "order-1",
    imageSize: "w-24 h-24",
    imageSizeCompact: "w-16 h-16 sm:w-20 sm:h-20",
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
    barHeightCompact: "h-9 sm:h-11",
    barWidth: "w-20 md:w-28",
    barWidthCompact: "w-16 sm:w-18",
    order: "order-3",
    imageSize: "w-20 h-20",
    imageSizeCompact: "w-14 h-14 sm:w-16 sm:h-16",
    zIndex: "z-0",
  },
];

export function VotingPodium({ top3, onSelectEntry, compact = false }: VotingPodiumProps) {
  if (top3.length === 0) return null;

  // Arrange: 2nd, 1st, 3rd
  const display = [
    top3[1] ? { ...top3[1], config: PODIUM_CONFIG[1] } : null,
    top3[0] ? { ...top3[0], config: PODIUM_CONFIG[0] } : null,
    top3[2] ? { ...top3[2], config: PODIUM_CONFIG[2] } : null,
  ].filter(Boolean) as Array<PodiumEntry & { config: typeof PODIUM_CONFIG[0] }>;

  return (
    <div className={compact ? "space-y-4 w-full" : "space-y-8"}>
      {/* Title */}
      <div className={`text-center ${compact ? "space-y-1 pb-1" : "space-y-2"}`}>
        <div className={`inline-flex items-center gap-1.5 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-400 font-bold uppercase tracking-wider ${
          compact ? "px-3 py-1 text-[11px]" : "px-4 py-1.5 text-xs"
        }`}>
          🏆 Resultados Finales
        </div>
        <h2 className={`font-black text-white tracking-tight ${
          compact ? "text-2xl sm:text-3xl" : "text-4xl md:text-5xl"
        }`}>
          Las <span className="text-yellow-400 drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">Ganadoras</span>
        </h2>
        <p className={`text-gray-400 ${compact ? "text-xs" : "text-sm"}`}>
          Las imágenes más votadas por la comunidad
        </p>
      </div>

      {/* Podium stage */}
      <div className="relative max-w-2xl mx-auto w-full">
        {/* Ambient glow behind */}
        <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
          <div className="w-2/3 h-32 bg-yellow-400/10 rounded-full blur-3xl" />
        </div>

        <div className={`relative flex items-end justify-center pb-2 ${compact ? "gap-2 sm:gap-3" : "gap-3 md:gap-6"}`}>
          {display.map((item) => {
            const cfg = item.config;
            const imgSize = compact ? cfg.imageSizeCompact : cfg.imageSize;
            const barH = compact ? cfg.barHeightCompact : cfg.barHeight;
            const barW = compact ? cfg.barWidthCompact : cfg.barWidth;

            return (
              <div
                key={item.id}
                className={`flex flex-col items-center ${compact ? "gap-2" : "gap-3"} ${cfg.order} ${cfg.zIndex}`}
              >
                {/* Image card */}
                <div
                  onClick={() => onSelectEntry?.(item)}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`relative ${imgSize} rounded-2xl overflow-hidden border-2 ${cfg.border} ${cfg.glow} transition-all duration-500 group select-none ${
                    onSelectEntry ? "cursor-pointer hover:scale-105 active:scale-95" : ""
                  }`}
                  title={onSelectEntry ? "Clic para ver en detalle y ver votantes" : undefined}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.authorName || cfg.label}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Rank emoji badge */}
                  <div className={`absolute -top-2 -right-2 drop-shadow-lg z-10 ${compact ? "text-xl" : "text-2xl"}`}>
                    {cfg.emoji}
                  </div>
                </div>

                {/* Author info */}
                <div className={`text-center space-y-0.5 ${compact ? "max-w-[100px]" : "max-w-[120px]"}`}>
                  {item.instagramAccount && (
                    <p className={`font-bold flex items-center justify-center gap-1 ${cfg.text} ${compact ? "text-[11px]" : "text-xs"}`}>
                      <Instagram className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.instagramAccount}</span>
                    </p>
                  )}
                  {item.authorName && (
                    <p className={`text-gray-300 truncate ${compact ? "text-[11px]" : "text-xs"}`}>
                      {item.authorName}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-1 pt-0.5">
                    <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                    <span className="text-white text-xs font-black">{item.voteCount}</span>
                    <span className="text-gray-500 text-[11px]">votos</span>
                  </div>
                </div>

                {/* Podium bar */}
                <div className={`${barW} ${barH} ${cfg.barBg} rounded-t-xl flex items-start justify-center pt-2 shadow-lg`}>
                  <span className={`font-black ${compact ? "text-lg sm:text-xl" : "text-xl md:text-2xl"} ${
                    cfg.rank === 1 ? "text-yellow-900" : cfg.rank === 2 ? "text-gray-600" : "text-amber-900"
                  }`}>
                    {cfg.rank}°
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Base platform */}
        <div className="h-2.5 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
      </div>

      {/* Full ranking list (all entries beyond top 3) */}
    </div>
  );
}
