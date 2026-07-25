// app/admin/quests/actions.ts
// Admin writes for QR quests. See the note in ../achievements/actions.ts on why
// these live beside their page rather than in app/admin/actions.ts.
'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    throw new Error('Unauthorized')
  }
}

function revalidate() {
  revalidatePath('/admin/quests')
  revalidatePath('/quests')
}

/** '' from an unselected <select> must become null, not the empty string. */
function achievementIdOrNull(formData: FormData): string | null {
  const value = String(formData.get('achievementId') || '').trim()
  return value || null
}

export async function createQuest(formData: FormData) {
  await requireAdmin()

  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const points = parseInt(String(formData.get('points') || '0'), 10)
  const fromRaw = String(formData.get('availableFrom') || '').trim()
  const untilRaw = String(formData.get('availableUntil') || '').trim()
  const availableFrom = fromRaw ? new Date(fromRaw).toISOString() : null
  const availableUntil = untilRaw ? new Date(untilRaw).toISOString() : null

  if (!title || !description || !Number.isFinite(points) || points <= 0) return

  const payload: any = {
    title,
    description,
    points,
    achievementId: achievementIdOrNull(formData),
    isActive: false,
  }
  if (availableFrom) payload.availableFrom = availableFrom
  if (availableUntil) payload.availableUntil = availableUntil

  const { error } = await supabase.from('Quest').insert(payload)
  if (error) {
    delete payload.availableFrom
    delete payload.availableUntil
    await supabase.from('Quest').insert(payload)
  }

  revalidate()
}

export async function updateQuest(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const points = parseInt(String(formData.get('points') || '0'), 10)
  const fromRaw = String(formData.get('availableFrom') || '').trim()
  const untilRaw = String(formData.get('availableUntil') || '').trim()
  const availableFrom = fromRaw ? new Date(fromRaw).toISOString() : null
  const availableUntil = untilRaw ? new Date(untilRaw).toISOString() : null

  if (!id || !title || !description || !Number.isFinite(points) || points <= 0) return

  const payload: any = {
    title,
    description,
    points,
    achievementId: achievementIdOrNull(formData),
  }
  if (availableFrom !== undefined) payload.availableFrom = availableFrom
  if (availableUntil !== undefined) payload.availableUntil = availableUntil

  const { error } = await supabase.from('Quest').update(payload).eq('id', id)
  if (error) {
    delete payload.availableFrom
    delete payload.availableUntil
    await supabase.from('Quest').update(payload).eq('id', id)
  }

  revalidate()
}

/** Activate/deactivate. A deactivated quest stays listed for admins and keeps
 *  its QR, but lib/scan/quest.ts refuses new scans against it. */
export async function toggleQuestActive(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  const isActive = String(formData.get('isActive') || '') === 'true'
  if (!id) return

  await supabase.from('Quest').update({ isActive: !isActive }).eq('id', id)
  revalidate()
}

/**
 * Soft delete, matching `deactivateCommitteeMember`. `QuestProgress` cascades
 * on a real delete, which would erase students' completion history while
 * leaving the points they earned unexplained. Flipping isDeleted hides the
 * quest everywhere and stops scans, but the record survives.
 */
export async function deleteQuest(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  await supabase.from('Quest').update({ isDeleted: true, isActive: false }).eq('id', id)
  revalidate()
}
