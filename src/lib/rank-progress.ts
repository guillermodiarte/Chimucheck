/**
 * Módulo 1: Lógica de Progreso de Rango (HUD Segmentado)
 *
 * 15 sub-niveles totales: Amateur 1-5 | Semi-Pro 1-5 | Profesional 1-5
 * Cada sub-nivel = 100 / 15 ≈ 6.667 puntos
 * 14 breakpoints (divisores entre los 15 segmentos)
 */

const TOTAL_LEVELS = 15;
const SEGMENT_SIZE = 100 / TOTAL_LEVELS; // ≈ 6.6667

export type TierColor = "green" | "blue" | "gold";

interface LevelInfo {
  tier: "Amateur" | "Semi-Pro" | "Profesional";
  level: number; // 1-5
}

function getLevelInfo(segmentIndex: number): LevelInfo {
  if (segmentIndex < 5) return { tier: "Amateur", level: segmentIndex + 1 };
  if (segmentIndex < 10) return { tier: "Semi-Pro", level: (segmentIndex - 5) + 1 };
  return { tier: "Profesional", level: (segmentIndex - 10) + 1 };
}

function getLevelName(segmentIndex: number): string {
  if (segmentIndex >= TOTAL_LEVELS) return "Profesional 5 (Máx)";
  const { tier, level } = getLevelInfo(segmentIndex);
  return `${tier} ${level}`;
}

export interface RankProgress {
  /** Porcentaje de llenado de la barra (0–100) */
  progressPercentage: number;
  /** Color del tier actual */
  tierColor: TierColor;
  /** Clases Tailwind para el fill de la barra */
  barColorClass: string;
  /** Clases Tailwind para glow del fill */
  glowClass: string;
  /** Clases Tailwind para el color del texto del rango */
  textColorClass: string;
  /** Nombre del rango actual, ej. "Amateur 3" */
  currentLevelName: string;
  /** Puntos para llegar al siguiente breakpoint (0 si está en el máximo) */
  pointsToNextLevel: number;
  /** Nombre del siguiente sub-nivel, ej. "Semi-Pro 1" */
  nextLevelName: string;
  /** 14 posiciones (como porcentaje 0-100) para dibujar los separadores */
  breakpoints: number[];
}

export function getRankProgress(points: number): RankProgress {
  const p = Math.max(0, Math.min(100, points));

  // --- Segmento actual ---
  const currentSegment = Math.min(Math.floor(p / SEGMENT_SIZE), TOTAL_LEVELS - 1);

  // --- Colores según tier ---
  let tierColor: TierColor;
  let barColorClass: string;
  let glowClass: string;
  let textColorClass: string;

  if (currentSegment < 5) {
    tierColor = "green";
    barColorClass = "bg-green-500";
    glowClass = "shadow-[0_0_12px_rgba(34,197,94,0.6)]";
    textColorClass = "text-green-400";
  } else if (currentSegment < 10) {
    tierColor = "blue";
    barColorClass = "bg-sky-400";
    glowClass = "shadow-[0_0_12px_rgba(56,189,248,0.6)]";
    textColorClass = "text-sky-400";
  } else {
    tierColor = "gold";
    barColorClass = "bg-yellow-400";
    glowClass = "shadow-[0_0_12px_rgba(250,204,21,0.6)]";
    textColorClass = "text-yellow-400";
  }

  // --- Nombres de nivel ---
  const currentLevelName = getLevelName(currentSegment);
  const nextLevelName = getLevelName(currentSegment + 1);

  // --- Puntos al siguiente breakpoint ---
  const nextBreakpointValue = (currentSegment + 1) * SEGMENT_SIZE;
  const pointsToNextLevel =
    p >= 100 ? 0 : Math.max(0, Math.ceil((nextBreakpointValue - p) * 10) / 10);

  // --- 14 breakpoints como porcentajes ---
  const breakpoints = Array.from(
    { length: TOTAL_LEVELS - 1 },
    (_, i) => ((i + 1) / TOTAL_LEVELS) * 100
  );

  return {
    progressPercentage: p,
    tierColor,
    barColorClass,
    glowClass,
    textColorClass,
    currentLevelName,
    pointsToNextLevel,
    nextLevelName,
    breakpoints,
  };
}
