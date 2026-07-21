// The six NSO 2026 committee divisions. Order and colours follow the Figma
// bookmark ribbon (top to bottom); Mainboards is always first. This is the
// single source of truth -- the public committee page, the committee API, and
// the admin panel all import from here.

export type DivisionId =
  | 'mainboard'
  | 'itlog'
  | 'pubdoc'
  | 'event'
  | 'creative'
  | 'groupleader'

export interface Division {
  id: DivisionId
  name: string
  /** bookmark + banner colour */
  color: string
}

export const DIVISIONS: Division[] = [
  { id: 'mainboard', name: 'Mainboards', color: '#a83fbf' },
  { id: 'itlog', name: 'IT & Logistics', color: '#331f8f' },
  { id: 'pubdoc', name: 'PubDoc', color: '#22998f' },
  { id: 'event', name: 'Event', color: '#cc0505' },
  { id: 'creative', name: 'Creative', color: '#f5187a' },
  { id: 'groupleader', name: 'Group Leader', color: '#7fa510' },
]

export const DIVISION_IDS = DIVISIONS.map((d) => d.id)

/** True when `id` is one of the six known divisions. */
export function isDivisionId(id: unknown): id is DivisionId {
  return typeof id === 'string' && (DIVISION_IDS as string[]).includes(id)
}

/** Display name for a stored division id; falls back for null/unknown values. */
export function divisionName(id: string | null): string {
  return DIVISIONS.find((d) => d.id === id)?.name ?? 'Unassigned'
}
