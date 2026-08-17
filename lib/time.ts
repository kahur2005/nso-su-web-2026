// App-wide wall-clock zone. Postgres timestamptz stays UTC; we only pin
// display and datetime-local parse/format to Asia/Jakarta (WIB, UTC+7, no DST).

export const APP_TIME_ZONE = 'Asia/Jakarta'
export const APP_TIME_ZONE_LABEL = 'WIB'

type Instant = string | number | Date

function asDate(value: Instant): Date {
  return value instanceof Date ? value : new Date(value)
}

function partsInJakarta(value: Instant) {
  const d = asDate(value)
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const bag = Object.fromEntries(
    fmt
      .formatToParts(d)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value])
  ) as Record<string, string>
  // Some engines emit "24" for midnight; normalize to "00".
  if (bag.hour === '24') bag.hour = '00'
  return bag
}

/** Calendar day key (YYYY-MM-DD) in Jakarta. */
export function jakartaDayKey(value: Instant = new Date()): string {
  const p = partsInJakarta(value)
  return `${p.year}-${p.month}-${p.day}`
}

/** True when both instants fall on the same Jakarta calendar day. */
export function isSameJakartaDay(a: Instant, b: Instant = new Date()): boolean {
  return jakartaDayKey(a) === jakartaDayKey(b)
}

/** Start of the Jakarta calendar day containing `value`, as a Date (UTC instant). */
export function startOfJakartaDay(value: Instant = new Date()): Date {
  return new Date(`${jakartaDayKey(value)}T00:00:00+07:00`)
}

/**
 * `<input type="datetime-local">` value in Jakarta wall time.
 * Returns '' for null/invalid so the input stays empty.
 */
export function toJakartaInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = partsInJakarta(d)
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

/**
 * Parse a datetime-local string as Jakarta wall time → UTC ISO.
 * Accepts `YYYY-MM-DDTHH:mm` or with seconds.
 */
export function jakartaLocalInputToIso(localValue: string): string | null {
  const raw = localValue.trim()
  if (!raw) return null
  const m = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::\d{2})?$/.exec(raw)
  if (!m) return null
  const d = new Date(`${m[1]}:00+07:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

const JAKARTA_OPTS = { timeZone: APP_TIME_ZONE } as const

export function formatJakartaDateTime(
  value: Instant,
  options?: Intl.DateTimeFormatOptions
): string {
  return asDate(value).toLocaleString('en-GB', { ...JAKARTA_OPTS, ...options })
}

export function formatJakartaDate(
  value: Instant,
  options?: Intl.DateTimeFormatOptions
): string {
  return asDate(value).toLocaleDateString('en-GB', { ...JAKARTA_OPTS, ...options })
}

export function formatJakartaTime(
  value: Instant,
  options?: Intl.DateTimeFormatOptions
): string {
  return asDate(value).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    ...JAKARTA_OPTS,
    ...options,
  })
}
