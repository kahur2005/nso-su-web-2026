// lib/timeline.ts
// The six NSO 2026 event days. Fixed on purpose: the dates and the day names
// are settled, so they live in code and are NOT editable from the admin panel.
// Only each day's agenda rows are data — see supabase/migrations/
// 20260727_timeline_events.sql and app/admin/timeline.
//
// No Supabase import here, so this file is safe for client components. The
// query lives in ./timeline-data.ts, which is server-only.

export type TimelineDayMeta = {
  /** Stored in TimelineEvent.dayKey — changing one orphans that day's rows. */
  key: string
  /** Short label on the calendar tab. */
  tabLabel: string
  /** Banner headline on the red pad header. */
  headerTitle: string
  /** Fixed event date. */
  date: string
}

export const TIMELINE_DAYS: TimelineDayMeta[] = [
  { key: 'tm', tabLabel: 'TM', headerTitle: 'TECHNICAL MEETING (ONLINE)', date: '11 Aug 2026' },
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

/** A day plus whatever agenda rows are stored against it. */
export type TimelineDay = TimelineDayMeta & { agenda: AgendaRow[] }
