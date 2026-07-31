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

  const input = String(formData.get('studentId') || '').trim()
  const groupId = String(formData.get('groupId') || '')

  if (!input || !groupId) return

  // Resolve student by studentId, UUID id, or exact name
  const { data: student } = await supabase
    .from('Student')
    .select('id, studentId')
    .or(`studentId.eq."${input}",id.eq."${input}",name.ilike."${input}"`)
    .maybeSingle()

  const targetId = student?.studentId ?? input

  await supabase
    .from('Student')
    .update({ groupId })
    .or(`studentId.eq."${targetId}",id.eq."${targetId}"`)

  revalidatePath('/admin/groups')
  revalidatePath('/leaderboard')
  revalidatePath('/dashboard')
  revalidatePath('/profile')
}

export async function unassignStudent(formData: FormData) {
  await requireAdmin()

  const input = String(formData.get('studentId') || '').trim()
  if (!input) return

  const { data: student } = await supabase
    .from('Student')
    .select('id, studentId')
    .or(`studentId.eq."${input}",id.eq."${input}",name.ilike."${input}"`)
    .maybeSingle()

  const targetId = student?.studentId ?? input

  await supabase
    .from('Student')
    .update({ groupId: null })
    .or(`studentId.eq."${targetId}",id.eq."${targetId}"`)

  revalidatePath('/admin/groups')
  revalidatePath('/leaderboard')
  revalidatePath('/dashboard')
  revalidatePath('/profile')
}

// --- Points ---

export async function adjustPoints(formData: FormData) {
  await requireAdmin()

  const studentId = String(formData.get('studentId') || '').trim()
  const amount = parseInt(String(formData.get('amount') || '0'), 10)

  if (!studentId || !amount) return

  const { data: student } = await supabase
    .from('Student')
    .select('id, name')
    .eq('studentId', studentId)
    .maybeSingle()
  if (!student) return

  // Atomic: updates the student's points/xp and keeps the group total in sync.
  await supabase.rpc('adjust_points', {
    p_student_id: student.id,
    p_amount: amount,
  })

  await supabase.from('Announcement').insert({
    title: `Points ${amount > 0 ? 'Awarded' : 'Deducted'}`,
    content: `${amount > 0 ? '+' : ''}${amount} points ${amount > 0 ? 'awarded to' : 'deducted from'} ${student.name ?? 'a student'}`,
    type: 'points',
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
  // visibility on /info/committee.
  revalidatePath('/admin/qr')
  revalidatePath('/admin/committee')
  revalidatePath('/info/committee')
}

// --- Clubs ---

export type ClubFormState = { warning: string | null }

// /info/clubs is the page students reach from the nav. (/map/clubs is now just a
// redirect to it, so there is nothing there to revalidate.)
function revalidateClubs() {
  revalidatePath('/admin/clubs')
  revalidatePath('/info/clubs')
}

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

  // The club's tile icon on /info/clubs. Optional — a club without one falls
  // back to the bundled pixel art keyed by name.
  const iconFile = formData.get('icon')
  const iconUrl = iconFile instanceof File
    ? await uploadImage('club-icons', iconFile)
    : null

  await supabase.from('Club').insert({
    name, category, description, instagram, registrationUrl, images, iconUrl,
  })

  revalidateClubs()

  const warnings: string[] = []
  if (failedCount > 0) {
    warnings.push(`${failedCount} of ${files.length} carousel image(s) failed to upload and were skipped.`)
  }
  if (iconFile instanceof File && iconFile.size > 0 && !iconUrl) {
    warnings.push('The icon failed to upload — the club was created without one.')
  }

  return { warning: warnings.length > 0 ? warnings.join(' ') : null }
}

// Replaces just the tile icon on an existing club, so a club created before
// icon uploads existed (or with the wrong art) can be fixed without re-entering
// the whole record.
export async function updateClubIcon(
  _prevState: ClubFormState,
  formData: FormData
): Promise<ClubFormState> {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  const file = formData.get('icon')
  if (!id || !(file instanceof File) || file.size === 0) return { warning: null }

  const iconUrl = await uploadImage('club-icons', file)
  if (!iconUrl) return { warning: 'Icon upload failed — the club is unchanged.' }

  await supabase.from('Club').update({ iconUrl }).eq('id', id)

  revalidateClubs()
  return { warning: null }
}

export async function deleteClub(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  await supabase.from('Club').delete().eq('id', id)

  revalidateClubs()
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
  revalidatePath('/info/committee')

  return { warning: null }
}

// Soft delete: hard-deleting the NPC (and its ScanLog rows, to satisfy the FK)
// would destroy the audit trail behind students' points/xp/funFactsCollected
// and, if the member were ever re-added, would let the ScanLog unique
// constraint award the same student a second time for the same person.
// Deactivating instead just hides the member from /info/committee (filtered
// via app/api/committee/route.ts .eq('isActive', true)) while preserving
// everything.
export async function deactivateCommitteeMember(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  await supabase.from('NPC').update({ isActive: false }).eq('id', id)

  revalidatePath('/admin/committee')
  revalidatePath('/admin/qr')
  revalidatePath('/info/committee')
}

export async function updateCommitteeMemberPhoto(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  const photoUrlInput = String(formData.get('photoUrl') || '').trim()
  const image = formData.get('image')

  if (!id) return

  let avatarUrl: string | null = photoUrlInput || null

  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadImage('committee-photos', image)
    if (uploaded) avatarUrl = uploaded
  }

  await supabase.from('NPC').update({ avatarUrl }).eq('id', id)

  revalidatePath('/admin/committee')
  revalidatePath('/admin/qr')
  revalidatePath('/info/committee')
}

export async function updateCommitteeMember(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  const committeeName = String(formData.get('name') || '').trim()
  const role = String(formData.get('role') || '').trim()
  const division = String(formData.get('division') || '')
  const funFact = String(formData.get('funFact') || '').trim()
  const pointsRaw = formData.get('points')
  const photoUrlInput = String(formData.get('photoUrl') || '').trim()
  const image = formData.get('image')

  const updatePayload: Record<string, any> = {}

  if (committeeName) updatePayload.committeeName = committeeName
  if (role) updatePayload.role = role
  if (division && isDivisionId(division)) updatePayload.division = division
  if (funFact) updatePayload.funFact = funFact

  if (pointsRaw !== null && pointsRaw !== undefined && pointsRaw !== '') {
    const pts = parseInt(String(pointsRaw), 10)
    if (!isNaN(pts)) updatePayload.points = pts
  }

  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadImage('committee-photos', image)
    if (uploaded) updatePayload.avatarUrl = uploaded
  } else if (photoUrlInput !== '') {
    updatePayload.avatarUrl = photoUrlInput || null
  }

  if (Object.keys(updatePayload).length > 0) {
    await supabase.from('NPC').update(updatePayload).eq('id', id)
  }

  revalidatePath('/admin/committee')
  revalidatePath('/admin/qr')
  revalidatePath('/info/committee')
}
