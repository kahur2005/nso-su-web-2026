export interface AvatarConfig {
  skin?: string | null
  clothes?: string | null
  hair?: string | null
  hairColor?: string | null
  hijab?: string | null
  eyes?: string | null
  brows?: string | null
  mouth?: string | null
}

export interface ParsedAvatar {
  skin: string
  clothes: string | null
  hair: string | null
  hairColor: string
  hijab: string | null
  eyes: string | null
  brows: string | null
  mouth: string | null
}

/** Parse avatar configuration from raw data and apply default values. */
export function parseAvatarConfig(raw: unknown): ParsedAvatar {
  const c = (typeof raw === 'object' && raw !== null ? raw : {}) as AvatarConfig
  return {
    skin:      c.skin      || 'skin1',
    clothes:   c.clothes   || null,
    hair:      c.hair      || null,
    hairColor: c.hairColor || '',
    hijab:     c.hijab     || null,
    eyes:      c.eyes      || null,
    brows:     c.brows     || null,
    mouth:     c.mouth     || null,
  }
}

/** Combine hair style and color suffix into a hair key. */
export function hairKey(config: Pick<ParsedAvatar, 'hair' | 'hairColor'>): string | null {
  return config.hair ? `${config.hair}${config.hairColor}` : null
}
