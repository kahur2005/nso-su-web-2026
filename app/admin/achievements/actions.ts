// app/admin/achievements/actions.ts
// Admin writes for achievements. Co-located with the page rather than added to
// app/admin/actions.ts, which is already ~290 lines covering five unrelated
// areas; the CLAUDE.md guidance is to prefer server actions over new API
// routes, which this still follows.
'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { uploadImage } from '@/lib/storage'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    throw new Error('Unauthorized')
  }
}

function revalidate() {
  revalidatePath('/admin/achievements')
  revalidatePath('/admin/quests')
  revalidatePath('/profile')
}

export async function createAchievement(formData: FormData) {
  await requireAdmin()

  const name = String(formData.get('name') || '').trim()
  const description = String(formData.get('description') || '').trim()
  if (!name || !description) return

  const imageUrl = await uploadImage('achievements', formData.get('image') as File | null)

  await supabase.from('Achievement').insert({ name, description, imageUrl })
  revalidate()
}

export async function updateAchievement(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const description = String(formData.get('description') || '').trim()
  if (!id || !name || !description) return

  const patch: Record<string, unknown> = { name, description }

  // Only overwrite the art when a new file was actually chosen — an empty file
  // input must not wipe the existing badge.
  const imageUrl = await uploadImage('achievements', formData.get('image') as File | null)
  if (imageUrl) patch.imageUrl = imageUrl

  await supabase.from('Achievement').update(patch).eq('id', id)
  revalidate()
}

/**
 * Achievements are hard-deleted: unlike a quest, an achievement carries no
 * scan history of its own. `StudentAchievement` cascades (students lose the
 * badge) and `Quest.achievementId` is `on delete set null`, so quests that
 * granted it survive and simply stop granting anything.
 */
export async function deleteAchievement(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  await supabase.from('Achievement').delete().eq('id', id)
  revalidate()
}
