// lib/timeline-data.ts
// SERVER ONLY — imports the service-role Supabase client. Never pull this into
// a client component; take the resolved days as props instead.
import { supabase } from '@/lib/supabase'
import { TIMELINE_DAYS, type AgendaRow, type TimelineDay } from '@/lib/timeline'

/**
 * The six fixed days, each carrying its stored agenda rows in sortOrder.
 *
 * Days with no rows come back with an empty agenda rather than being dropped,
 * so the calendar always renders all six tabs. If the TimelineEvent table is
 * missing (migration not applied) every day is simply empty — the pad still
 * draws, which is a better failure than a blank page.
 */
export async function getTimelineDays(): Promise<TimelineDay[]> {
  const { data, error } = await supabase
    .from('TimelineEvent')
    .select('id, dayKey, time, activity, sortOrder')
    .order('sortOrder', { ascending: true })

  if (error) {
    console.error('getTimelineDays:', error)
  }

  const byDay = new Map<string, AgendaRow[]>()
  for (const row of data ?? []) {
    const list = byDay.get(row.dayKey) ?? []
    list.push({
      id: row.id,
      time: row.time,
      activity: row.activity,
      sortOrder: row.sortOrder,
    })
    byDay.set(row.dayKey, list)
  }

  return TIMELINE_DAYS.map((day) => ({
    ...day,
    agenda: byDay.get(day.key) ?? [],
  }))
}
