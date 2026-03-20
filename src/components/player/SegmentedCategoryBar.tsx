"use client";

import { getRankProgress } from "@/lib/rank-progress";

const CATEGORY_DISPLAY: Record<string, string> = {
  SHOOTER: "Shooter",
  RACING: "Racing",
  KOMBAT: "Kombat",
  SPORTS: "Sports",
  BOARD_GAME: "Board Game",
};

const CATEGORY_ICON: Record<string, string> = {
  SHOOTER: "🎯",
  RACING: "🏎️",
  KOMBAT: "🥊",
  SPORTS: "⚽",
  BOARD_GAME: "♟️",
};

interface SegmentedCategoryBarProps {
  /** Category key: "SHOOTER" | "RACING" | "KOMBAT" | "SPORTS" | "BOARD_GAME" */
  category: string;
  /** MMR points 0-100 */
  points: number;
}

export function SegmentedCategoryBar({ category, points }: SegmentedCategoryBarProps) {
  const {
    progressPercentage,
    barColorClass,
    glowClass,
    textColorClass,
    currentLevelName,
    pointsToNextLevel,
    nextLevelName,
    breakpoints,
  } = getRankProgress(points);

  const displayName = CATEGORY_DISPLAY[category] ?? category;
  const icon = CATEGORY_ICON[category] ?? "🎮";

  return (
    <div className="group relative w-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
          <span>{icon}</span>
          {displayName}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${textColorClass}`}>
          {currentLevelName}
        </span>
      </div>

      {/* ── Barra Principal ── */}
      <div className="relative w-full h-3.5 bg-zinc-800/80 rounded-sm overflow-hidden border border-white/5">

        {/* Fill coloreado con transición */}
        <div
          className={`absolute left-0 top-0 h-full rounded-sm transition-all duration-700 ease-out ${barColorClass} ${glowClass}`}
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Capa de separadores (14 líneas verticales superpuestas) */}
        <div className="absolute inset-0 pointer-events-none">
          {breakpoints.map((bp, i) => (
            <div
              key={i}
              className="absolute top-0 h-full w-px bg-zinc-900/70"
              style={{ left: `${bp}%` }}
            />
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-zinc-500 font-mono">
          <span className={`font-bold ${textColorClass}`}>{points}</span>
          <span className="text-zinc-600"> / 100 PTS</span>
        </span>
        {points < 100 ? (
          <span className="text-[10px] text-zinc-600">
            Faltan{" "}
            <span className="text-zinc-400 font-semibold">{pointsToNextLevel} pts</span>
            {" "}para{" "}
            <span className="text-zinc-400 font-semibold">{nextLevelName}</span>
          </span>
        ) : (
          <span className={`text-[10px] font-bold ${textColorClass}`}>⭐ Rango Máximo</span>
        )}
      </div>
    </div>
  );
}
