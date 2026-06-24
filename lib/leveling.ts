/**
 * Cognara Leveling & XP Utilities
 * 
 * Arithmetic Progression XP curve:
 * - Cumulative XP for Level L = 50 * (L - 1) * L
 * - XP required to level up from L to L+1 = L * 100
 */

export interface LevelInfo {
  level: number;
  xpWithinLevel: number;
  xpNeededForLevelUp: number;
  progressPercentage: number;
  rankName: string;
  rankColor: string;
}

export const RANKS = [
  { minLevel: 1, maxLevel: 5, name: 'Novice', color: '#8B95B3' },
  { minLevel: 6, maxLevel: 15, name: 'Thinker', color: '#5B8EFF' },
  { minLevel: 16, maxLevel: 30, name: 'Scholar', color: '#A78BFA' },
  { minLevel: 31, maxLevel: 50, name: 'Polymath', color: '#F59E0B' },
  { minLevel: 51, maxLevel: 9999, name: 'Master', color: '#34D399' }
];

export function getRankInfo(level: number) {
  const rank = RANKS.find(r => level >= r.minLevel && level <= r.maxLevel);
  return rank || { name: 'Novice', color: '#8B95B3' };
}

export function getLevelInfo(totalXp: number): LevelInfo {
  const xp = Math.max(0, totalXp);
  let level = 1;
  
  // Calculate level using cumulative threshold formula
  while (xp >= 50 * level * (level + 1)) {
    level++;
  }
  
  const xpForCurrentLevelStart = 50 * (level - 1) * level;
  const xpForNextLevelStart = 50 * level * (level + 1);
  const xpWithinLevel = xp - xpForCurrentLevelStart;
  const xpNeededForLevelUp = xpForNextLevelStart - xpForCurrentLevelStart; // level * 100
  
  const progressPercentage = Math.min(100, Math.max(0, (xpWithinLevel / xpNeededForLevelUp) * 100));
  const rank = getRankInfo(level);
  
  return {
    level,
    xpWithinLevel,
    xpNeededForLevelUp,
    progressPercentage,
    rankName: rank.name,
    rankColor: rank.color
  };
}
