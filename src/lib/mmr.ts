/**
 * Logic for MMR (Matchmaking Rating) and Rank Categories
 */

// --- Module 1 Enums & Types ---

export const CATEGORIES = [
  "SHOOTER",
  "RACING",
  "KOMBAT",
  "PUZZLE",
  "BOARD_GAME"
] as const;

export type TournamentCategory = typeof CATEGORIES[number];

export const RANK_TIERS = {
  AMATEUR: "AMATEUR",
  SEMI_PRO: "SEMI_PRO",
  PRO: "PRO"
} as const;

export type RankTier = keyof typeof RANK_TIERS;

export const MMR_CONSTANTS = {
  MAX_POINTS: 100,
  MIN_POINTS: 0,
  POINTS_1ST: 15,
  POINTS_2ND: 10,
  POINTS_3RD: 5,
  POINTS_LOSS: -5,
};

// --- Module 2: Range Math Logic ---

export interface RankResult {
  tier: RankTier;
  level: number;
  label: string; // e.g. "Amateur 1", "Profesional 5"
}

/**
 * Calculates Rank Tier and Level based on 0-100 MMR points.
 * Amateur: 0-33 (levels 1-5)
 * Semi-Pro: 34-66 (levels 1-5)
 * Pro: 67-100 (levels 1-5)
 */
export function calculateRank(points: number): RankResult {
  const p = Math.max(0, Math.min(100, points));

  // Amateur (0-33)
  if (p <= 33) {
    let level = 1;
    if (p >= 28) level = 5;
    else if (p >= 21) level = 4;
    else if (p >= 14) level = 3;
    else if (p >= 7) level = 2;
    return { tier: RANK_TIERS.AMATEUR, level, label: `Amateur ${level}` };
  }

  // Semi-Pro (34-66)
  if (p <= 66) {
    let level = 1;
    if (p >= 61) level = 5;
    else if (p >= 55) level = 4;
    else if (p >= 48) level = 3;
    else if (p >= 41) level = 2;
    return { tier: RANK_TIERS.SEMI_PRO, level, label: `Semi-Pro ${level}` };
  }

  // Profesional (67-100)
  let level = 1;
  if (p >= 95) level = 5;
  else if (p >= 88) level = 4;
  else if (p >= 81) level = 3;
  else if (p >= 74) level = 2;
  return { tier: RANK_TIERS.PRO, level, label: `Profesional ${level}` };
}

/**
 * Validates if a player matches the required tournament rank tier.
 * AMATEUR can play in AMATEUR, SEMI_PRO, PRO.
 * SEMI_PRO can play in SEMI_PRO, PRO.
 * PRO can play ONLY in PRO.
 */
export function canJoinTournament(playerTier: RankTier, requiredTier: RankTier): boolean {
  const rankWeights = {
    [RANK_TIERS.AMATEUR]: 1,
    [RANK_TIERS.SEMI_PRO]: 2,
    [RANK_TIERS.PRO]: 3,
  };

  const pWeight = rankWeights[playerTier];
  const tWeight = rankWeights[requiredTier];

  return pWeight <= tWeight;
}
