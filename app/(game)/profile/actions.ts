'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// Lets the logged-in student update their own name and Instagram handle.
// Avatar customisation is set once at registration; the legacy avatarUrl
// photo upload path has been removed (the pixel avatar system is the only
// display now).
export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions)
  const studentId = (session?.user as any)?.studentId
  if (!studentId) throw new Error('Unauthorized')

  const name      = String(formData.get('name')      || '').trim()
  const instagram = String(formData.get('instagram') || '').trim()

  const update: Record<string, unknown> = {
    instagram: instagram || null,
  }
  if (name) update.name = name // name is required — ignore blank submissions

  await supabase.from('Student').update(update).eq('studentId', studentId)

  revalidatePath('/profile')
  revalidatePath('/dashboard')
}
