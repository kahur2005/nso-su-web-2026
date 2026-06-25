'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/lib/storage'
import { revalidatePath } from 'next/cache'

// Lets the logged-in student update their own name, Instagram, and profile
// picture. Only touches the row identified by the session's studentId.
export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions)
  const studentId = (session?.user as any)?.studentId
  if (!studentId) throw new Error('Unauthorized')

  const name = String(formData.get('name') || '').trim()
  const instagram = String(formData.get('instagram') || '').trim()
  const avatarImage = formData.get('avatarImage') as File | null

  const update: Record<string, unknown> = {
    instagram: instagram || null,
  }
  if (name) update.name = name // name is required — ignore blank submissions

  const avatarUrl = await uploadImage('avatars', avatarImage)
  if (avatarUrl) update.avatarUrl = avatarUrl // only replace when a new file was sent

  await supabase.from('Student').update(update).eq('studentId', studentId)

  revalidatePath('/profile')
  revalidatePath('/dashboard')
}
