'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// Updates student profile data.
export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions)
  const studentId = (session?.user as any)?.studentId
  if (!studentId) throw new Error('Unauthorized')

  const name      = String(formData.get('name')      || '').trim()
  const instagram = String(formData.get('instagram') || '').trim()

  const update: Record<string, unknown> = {
    instagram: instagram || null,
  }
  if (name) update.name = name

  await supabase.from('Student').update(update).eq('studentId', studentId)

  revalidatePath('/profile')
  revalidatePath('/dashboard')
}
