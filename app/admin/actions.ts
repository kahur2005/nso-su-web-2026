// app/admin/actions.ts
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

const EMBLEM_BUCKET = 'group-emblems'

// Uploads a group emblem image to a public Storage bucket and returns its public
// URL. Returns null when no usable file is provided or the upload fails (the
// group still gets created, just with the emoji emblem as fallback).
async function uploadEmblem(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null

  // Idempotent: create the public bucket if it doesn't exist yet.
  await supabase.storage.createBucket(EMBLEM_BUCKET, { public: true })

  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(EMBLEM_BUCKET)
    .upload(path, file, { contentType: file.type || 'image/png', upsert: false })

  if (error) {
    console.error('Emblem upload failed:', error)
    return null
  }

  const { data } = supabase.storage.from(EMBLEM_BUCKET).getPublicUrl(path)
  return data.publicUrl
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

export async function createGroup(formData: FormData) {
  await requireAdmin()

  const name = String(formData.get('name') || '').trim()
  const emblem = String(formData.get('emblem') || '🛡️').trim()
  const color = String(formData.get('color') || '#4CAF50')
  const emblemImage = formData.get('emblemImage') as File | null

  if (!name) return

  const emblemUrl = await uploadEmblem(emblemImage)

  await supabase.from('Group').insert({ name, emblem, color, emblemUrl })

  revalidatePath('/admin/groups')
}

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

  revalidatePath('/admin/npc')
}
