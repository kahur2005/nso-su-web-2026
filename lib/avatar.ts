// lib/avatar.ts
// Shared helper for the `avatarConfig` JSONB column on `Student`.
// All consumer components (PixelAvatar, BottomNav, Navbar, Leaderboard, Profile)
// import parseAvatarConfig / hairKey from here — never flatten the object manually.

export interface AvatarConfig {
  skin?: string | null
  hair?: string | null
  /** Colour suffix appended to hair key, e.g. '' | '.2' | '.3' */
  hairColor?: string | null
  eyes?: string | null
  brows?: string | null
  mouth?: string | null
}

/** Parsed, defaulted avatar config. Every field is guaranteed non-undefined. */
export interface ParsedAvatar {
  skin: string
  hair: string | null
  hairColor: string
  eyes: string | null
  brows: string | null
  mouth: string | null
}

/**
 * Read an `avatarConfig` value from Supabase (unknown / jsonb) and fill in
 * safe defaults. Returns a fully typed object ready for PixelAvatar props.
 */
export function parseAvatarConfig(raw: unknown): ParsedAvatar {
  const c = (typeof raw === 'object' && raw !== null ? raw : {}) as AvatarConfig
  return {
    skin:      c.skin      || 'skin1',
    hair:      c.hair      || null,
    hairColor: c.hairColor || '',
    eyes:      c.eyes      || null,
    brows:     c.brows     || null,
    mouth:     c.mouth     || null,
  }
}

/**
 * Returns the combined hair key for `PixelAvatar.hair` prop.
 * e.g. hair='hairb1' + hairColor='.2' → 'hairb1.2'
 *      hair=null → null (bald)
 */
export function hairKey(config: Pick<ParsedAvatar, 'hair' | 'hairColor'>): string | null {
  return config.hair ? `${config.hair}${config.hairColor}` : null
}
