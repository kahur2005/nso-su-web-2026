import { supabase } from '@/lib/supabase'
import { TIMELINE_DAYS, type AgendaRow, type TimelineDay } from '@/lib/timeline'

/** Get event days with sorted agenda items. */
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
