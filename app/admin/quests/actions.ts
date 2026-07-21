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

  if (!title || !description || !Number.isFinite(points) || points <= 0) return

  await supabase.from('Quest').insert({
    title,
    description,
    points,
    achievementId: achievementIdOrNull(formData),
    // New quests start inactive so a code can be generated and printed before
    // students are able to claim it.
    isActive: false,
  })

  revalidate()
}

export async function updateQuest(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const points = parseInt(String(formData.get('points') || '0'), 10)

  if (!id || !title || !description || !Number.isFinite(points) || points <= 0) return

  // qrToken is deliberately untouched: editing a quest's wording or points must
  // not invalidate codes already printed and posted. complete_quest reads the
  // points from the row at scan time, so an edit takes effect immediately on
  // the existing code.
  await supabase
    .from('Quest')
    .update({
      title,
      description,
      points,
      achievementId: achievementIdOrNull(formData),
    })
    .eq('id', id)

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
