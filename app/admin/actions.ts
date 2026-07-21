// app/admin/actions.ts
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

// --- Quests ---

export async function createQuest(formData: FormData) {
  await requireAdmin()

  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const type = String(formData.get('type') || 'side')
  const points = parseInt(String(formData.get('points') || '0'), 10)
  const deadline = String(formData.get('deadline') || '')

  if (!title || !description || !points) return

  await supabase.from('Quest').insert({
    title,
    description,
    type,
    points,
    isHidden: type === 'hidden',
    deadline: deadline ? new Date(deadline).toISOString() : null,
  })

  revalidatePath('/admin/quests')
}

export async function toggleQuestActive(questId: string) {
  await requireAdmin()

  const { data: quest } = await supabase
    .from('Quest')
    .select('isActive')
    .eq('id', questId)
    .maybeSingle()
  if (!quest) return

  await supabase
    .from('Quest')
    .update({ isActive: !quest.isActive })
    .eq('id', questId)

  revalidatePath('/admin/quests')
}

// --- Groups ---

export async function assignStudentToGroup(formData: FormData) {
  await requireAdmin()

  const studentId = String(formData.get('studentId') || '').trim()
  const groupId = String(formData.get('groupId') || '')

  if (!studentId || !groupId) return

  await supabase
    .from('Student')
    .update({ groupId })
    .eq('studentId', studentId)

  revalidatePath('/admin/groups')
}

export async function unassignStudent(formData: FormData) {
  await requireAdmin()

  const studentId = String(formData.get('studentId') || '').trim()
  if (!studentId) return

  await supabase
    .from('Student')
    .update({ groupId: null })
    .eq('studentId', studentId)

  revalidatePath('/admin/groups')
}

// --- Points ---

export async function adjustPoints(formData: FormData) {
  await requireAdmin()

  const studentId = String(formData.get('studentId') || '').trim()
  const amount = parseInt(String(formData.get('amount') || '0'), 10)

  if (!studentId || !amount) return

  const { data: student } = await supabase
    .from('Student')
    .select('id')
    .eq('studentId', studentId)
    .maybeSingle()
  if (!student) return

  // Atomic: updates the student's points/xp and keeps the group total in sync.
  await supabase.rpc('adjust_points', {
    p_student_id: student.id,
    p_amount: amount,
  })

  revalidatePath('/admin/points')
}

// --- Announcements ---

export async function createAnnouncement(formData: FormData) {
  await requireAdmin()

  const title = String(formData.get('title') || '').trim()
  const content = String(formData.get('content') || '').trim()

  if (!title || !content) return

  await supabase.from('Announcement').insert({ title, content })

  revalidatePath('/admin/announcements')
}

export async function toggleAnnouncement(announcementId: string) {
  await requireAdmin()

  const { data: announcement } = await supabase
    .from('Announcement')
    .select('isActive')
    .eq('id', announcementId)
    .maybeSingle()
  if (!announcement) return

  await supabase
    .from('Announcement')
    .update({ isActive: !announcement.isActive })
    .eq('id', announcementId)

  revalidatePath('/admin/announcements')
}

// --- NPCs ---

export async function toggleNpcActive(npcId: string) {
  await requireAdmin()

  const { data: npc } = await supabase
    .from('NPC')
    .select('isActive')
    .eq('id', npcId)
    .maybeSingle()
  if (!npc) return

  await supabase
    .from('NPC')
    .update({ isActive: !npc.isActive })
    .eq('id', npcId)

  revalidatePath('/admin/qr')
}

// --- Clubs ---

export type ClubFormState = { warning: string | null }

// Signature required by React's `useActionState`: previous state first, then
// FormData (see node_modules/next/dist/docs/01-app/02-guides/forms.md:194).
export async function createClub(
  _prevState: ClubFormState,
  formData: FormData
): Promise<ClubFormState> {
  await requireAdmin()

  const name = String(formData.get('name') || '').trim()
  const category = String(formData.get('category') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const instagram = String(formData.get('instagram') || '').trim() || null
  const registrationUrl = String(formData.get('registrationUrl') || '').trim() || null

  if (!name || !category || !description) return { warning: null }

  // Unlimited carousel images; upload in parallel. uploadImage() never throws —
  // a failed upload just returns null, so we track which ones dropped and
  // surface that instead of silently inserting a club with fewer images than
  // the operator selected.
  const files = formData.getAll('images').filter(
    (f): f is File => f instanceof File && f.size > 0
  )
  const uploaded = await Promise.all(files.map((f) => uploadImage('club-images', f)))
  const images = uploaded.filter((url): url is string => Boolean(url))
  const failedCount = files.length - images.length

  await supabase.from('Club').insert({
    name, category, description, instagram, registrationUrl, images,
  })

  revalidatePath('/admin/clubs')
  revalidatePath('/map/clubs')

  if (failedCount > 0) {
    return { warning: `${failedCount} of ${files.length} image(s) failed to upload and were skipped.` }
  }

  return { warning: null }
}

export async function deleteClub(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  await supabase.from('Club').delete().eq('id', id)

  revalidatePath('/admin/clubs')
  revalidatePath('/map/clubs')
}
