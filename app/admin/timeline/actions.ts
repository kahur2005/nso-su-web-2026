'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { isTimelineDayKey } from '@/lib/timeline'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    throw new Error('Unauthorized')
  }
}

function revalidateTimeline() {
  revalidatePath('/admin/timeline')
  revalidatePath('/info/timeline')
  revalidatePath('/map/timeline')
}

export async function createTimelineEvent(formData: FormData) {
  await requireAdmin()

  const dayKey = String(formData.get('dayKey') || '')
  const time = String(formData.get('time') || '').trim()
  const activity = String(formData.get('activity') || '').trim()

  if (!isTimelineDayKey(dayKey) || !time || !activity) return

  const { data: last } = await supabase
    .from('TimelineEvent')
    .select('sortOrder')
    .eq('dayKey', dayKey)
    .order('sortOrder', { ascending: false })
    .limit(1)
    .maybeSingle()

  await supabase.from('TimelineEvent').insert({
    dayKey,
    time,
    activity,
    sortOrder: (last?.sortOrder ?? 0) + 1,
  })

  revalidateTimeline()
}

export async function updateTimelineEvent(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  const time = String(formData.get('time') || '').trim()
  const activity = String(formData.get('activity') || '').trim()
  const sortOrderRaw = String(formData.get('sortOrder') || '').trim()

  if (!id || !time || !activity) return

  const sortOrder = Number.parseInt(sortOrderRaw, 10)

  await supabase
    .from('TimelineEvent')
    .update({
      time,
      activity,
      ...(Number.isFinite(sortOrder) ? { sortOrder } : {}),
    })
    .eq('id', id)

  revalidateTimeline()
}

export async function deleteTimelineEvent(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  await supabase.from('TimelineEvent').delete().eq('id', id)

  revalidateTimeline()
}
