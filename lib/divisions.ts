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

/** Return true if id is a valid DivisionId. */
export function isDivisionId(id: unknown): id is DivisionId {
  return typeof id === 'string' && (DIVISION_IDS as string[]).includes(id)
}

/** Get division display name by id. */
export function divisionName(id: string | null): string {
  return DIVISIONS.find((d) => d.id === id)?.name ?? 'Unassigned'
}
