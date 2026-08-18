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

  const imageUrl = await uploadImage('achievements', formData.get('image') as File | null)
  if (imageUrl) patch.imageUrl = imageUrl

  await supabase.from('Achievement').update(patch).eq('id', id)
  revalidate()
}

/** Delete achievement by ID. */
export async function deleteAchievement(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  await supabase.from('Achievement').delete().eq('id', id)
  revalidate()
}
