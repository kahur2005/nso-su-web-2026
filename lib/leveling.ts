// Progressive leveling. The XP cost to go from level L to L+1 doubles each
// level: 10, 20, 40, 80, 160, ... (BASE_XP * 2^(L-1)).
//
// Total XP required to *reach* level L is the sum of those steps:
//   xpForLevel(L) = BASE_XP * (2^(L-1) - 1)
//   -> L1: 0, L2: 10, L3: 30, L4: 70, L5: 150, L6: 310, ...

export const BASE_XP = 10

/** Total accumulated XP needed to have reached `level` (level 1 = 0 XP). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return BASE_XP * (2 ** (level - 1) - 1)
}

/** XP cost of the single step from `level` to `level + 1`. */
export function xpToNextLevel(level: number): number {
  return BASE_XP * 2 ** (level - 1)
}

/** Current level for a given total XP. */
export function levelFromXp(xp: number): number {
  if (!xp || xp < BASE_XP) return 1
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  return level
}

/**
 * Display helper. Given total XP, returns the current level plus progress
 * within that level (how much of the current step is filled).
 */
export function levelProgress(xp: number) {
  const safeXp = Math.max(0, xp || 0)
  const level = levelFromXp(safeXp)
  const floor = xpForLevel(level) // XP at the start of this level
  const span = xpToNextLevel(level) // XP needed to clear this level
  const into = safeXp - floor // XP earned into the current level
  return { level, into, span, floor, nextLevelXp: floor + span }
}
