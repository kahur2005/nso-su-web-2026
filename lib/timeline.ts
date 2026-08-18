export type TimelineDayMeta = {
  key: string
  tabLabel: string
  headerTitle: string
  date: string
}

export const TIMELINE_DAYS: TimelineDayMeta[] = [
  { key: 'tm', tabLabel: 'TM', headerTitle: 'TECHNICAL MEETING (ONLINE)', date: '14 Aug 2026' },
  { key: '1', tabLabel: '1', headerTitle: 'DAY 1', date: '18 Aug 2026' },
  { key: '2', tabLabel: '2', headerTitle: 'DAY 2', date: '19 Aug 2026' },
  { key: '3', tabLabel: '3', headerTitle: 'DAY 3', date: '20 Aug 2026' },
  { key: '4', tabLabel: '4', headerTitle: 'DAY 4', date: '21 Aug 2026' },
  { key: '5', tabLabel: '5', headerTitle: 'DAY 5', date: '22 Aug 2026' },
]

export const TIMELINE_DAY_KEYS = TIMELINE_DAYS.map((d) => d.key)

export function isTimelineDayKey(key: string): boolean {
  return TIMELINE_DAY_KEYS.includes(key)
}

export type AgendaRow = {
  id: string
  time: string
  activity: string
  sortOrder: number
}

export type TimelineDay = TimelineDayMeta & { agenda: AgendaRow[] }
