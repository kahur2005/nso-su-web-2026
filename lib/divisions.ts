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
  /** Display name, also the text on the division ribbon. */
  name: string
  /**
   * The division's identity colour, sampled from its bookmark sprite in
   * `public/images/committee/bookmark-<id>.png`. Used anywhere the division is
   * tinted in CSS; the committee page itself renders pre-tinted sprites rather
   * than colouring them at runtime.
   */
  color: string
}

export const DIVISIONS: Division[] = [
  { id: 'mainboard', name: 'Mainboards', color: '#ab47bc' },
  { id: 'itlog', name: 'IT & Logistics', color: '#311b92' },
  { id: 'pubdoc', name: 'PubDoc', color: '#26a69a' },
  { id: 'event', name: 'Event', color: '#d50000' },
  { id: 'creative', name: 'Creative', color: '#ff0084' },
  { id: 'groupleader', name: 'Group Leader', color: '#72a300' },
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
