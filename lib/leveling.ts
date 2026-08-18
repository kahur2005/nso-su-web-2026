export const BASE_XP = 10

/** Calculate total XP required to reach a level. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return BASE_XP * (2 ** (level - 1) - 1)
}

/** Calculate XP required to advance from level to level + 1. */
export function xpToNextLevel(level: number): number {
  return BASE_XP * 2 ** (level - 1)
}

/** Calculate current level from total XP. */
export function levelFromXp(xp: number): number {
  if (!xp || xp < BASE_XP) return 1
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  return level
}

/** Calculate current level and XP progress. */
export function levelProgress(xp: number) {
  const safeXp = Math.max(0, xp || 0)
  const level = levelFromXp(safeXp)
  const floor = xpForLevel(level)
  const span = xpToNextLevel(level)
  const into = safeXp - floor
  return { level, into, span, floor, nextLevelXp: floor + span }
}

export const GROUP_POINTS_PER_LEVEL = 10

/** Calculate group level from total points (1 level per 10 points). */
export function groupLevel(totalPoints: number): number {
  const pts = Math.max(0, totalPoints || 0)
  return Math.floor(pts / GROUP_POINTS_PER_LEVEL) + 1
}
