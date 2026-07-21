// app/admin/actions.ts
'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { uploadImage } from '@/lib/storage'
import { isDivisionId } from '@/lib/divisions'
import { normalizeInstagram } from '@/lib/instagram'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    throw new Error('Unauthorized')
  }
}

// --- Quests ---
// Quest writes moved to app/admin/quests/actions.ts when quests became
// QR-completed; achievements live in app/admin/achievements/actions.ts.

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

  // Reachable from both /admin/qr and /admin/committee (used there to
  // reactivate a deactivated member), and it always affects student-facing
  // visibility on /map/committee.
  revalidatePath('/admin/qr')
  revalidatePath('/admin/committee')
  revalidatePath('/map/committee')
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

// --- Committee (stored as NPC rows; see docs plan 2) ---

export type CommitteeFormState = { warning: string | null }

// Signature required by React's `useActionState`: previous state first, then
// FormData (see node_modules/next/dist/docs/01-app/02-guides/forms.md:194).
export async function createCommitteeMember(
  _prevState: CommitteeFormState,
  formData: FormData
): Promise<CommitteeFormState> {
  await requireAdmin()

  const committeeName = String(formData.get('name') || '').trim()
  const role = String(formData.get('role') || '').trim()
  const division = String(formData.get('division') || '')
  const funFact = String(formData.get('funFact') || '').trim()
  const instagram = normalizeInstagram(String(formData.get('instagram') || ''))

  if (!committeeName || !role || !funFact || !isDivisionId(division)) {
    return { warning: 'Please fill in name, role, fun fact, and a valid division.' }
  }

  const image = formData.get('image')
  const avatarUrl =
    image instanceof File && image.size > 0
      ? await uploadImage('committee-photos', image)
      : null

  await supabase.from('NPC').insert({
    committeeName, role, division, funFact, instagram, avatarUrl,
  })

  revalidatePath('/admin/committee')
  revalidatePath('/admin/qr')
  revalidatePath('/map/committee')

  return { warning: null }
}

// Soft delete: hard-deleting the NPC (and its ScanLog rows, to satisfy the FK)
// would destroy the audit trail behind students' points/xp/funFactsCollected
// and, if the member were ever re-added, would let the ScanLog unique
// constraint award the same student a second time for the same person.
// Deactivating instead just hides the member from /map/committee (filtered
// via app/api/committee/route.ts .eq('isActive', true)) while preserving
// everything.
export async function deactivateCommitteeMember(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  await supabase.from('NPC').update({ isActive: false }).eq('id', id)

  revalidatePath('/admin/committee')
  revalidatePath('/admin/qr')
  revalidatePath('/map/committee')
}
