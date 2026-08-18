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

export async function assignStudentToGroup(formData: FormData) {
  await requireAdmin()

  const input = String(formData.get('studentId') || '').trim()
  const groupId = String(formData.get('groupId') || '')

  if (!input || !groupId) return

  let student: { id: string; studentId: string } | null = null

  const { data: byStudentId } = await supabase
    .from('Student')
    .select('id, studentId')
    .eq('studentId', input)
    .maybeSingle()
  student = byStudentId

  if (!student) {
    const { data: byId } = await supabase
      .from('Student')
      .select('id, studentId')
      .eq('id', input)
      .maybeSingle()
    student = byId
  }

  if (!student) {
    const { data: byName } = await supabase
      .from('Student')
      .select('id, studentId')
      .ilike('name', input)
      .maybeSingle()
    student = byName
  }

  if (!student) return

  await supabase
    .from('Student')
    .update({ groupId })
    .eq('id', student.id)

  revalidatePath('/admin/groups')
  revalidatePath('/leaderboard')
  revalidatePath('/dashboard')
  revalidatePath('/profile')
}

export async function unassignStudent(formData: FormData) {
  await requireAdmin()

  const input = String(formData.get('studentId') || '').trim()
  if (!input) return

  let student: { id: string; studentId: string } | null = null

  const { data: byStudentId } = await supabase
    .from('Student')
    .select('id, studentId')
    .eq('studentId', input)
    .maybeSingle()
  student = byStudentId

  if (!student) {
    const { data: byId } = await supabase
      .from('Student')
      .select('id, studentId')
      .eq('id', input)
      .maybeSingle()
    student = byId
  }

  if (!student) {
    const { data: byName } = await supabase
      .from('Student')
      .select('id, studentId')
      .ilike('name', input)
      .maybeSingle()
    student = byName
  }

  if (!student) return

  await supabase
    .from('Student')
    .update({ groupId: null })
    .eq('id', student.id)

  revalidatePath('/admin/groups')
  revalidatePath('/leaderboard')
  revalidatePath('/dashboard')
  revalidatePath('/profile')
}

export async function adjustPoints(formData: FormData) {
  await requireAdmin()

  const studentId = String(formData.get('studentId') || '').trim()
  const amount = parseInt(String(formData.get('amount') || '0'), 10)
  const reason = String(formData.get('reason') || '').trim()

  if (!studentId || !amount) return

  const { data: student } = await supabase
    .from('Student')
    .select('id, name')
    .eq('studentId', studentId)
    .maybeSingle()
  if (!student) return

  await supabase.rpc('adjust_points', {
    p_student_id: student.id,
    p_amount: amount,
  })

  const reasonSuffix = reason ? ` (${reason})` : ''
  await supabase.from('Announcement').insert({
    title: `Points ${amount > 0 ? 'Awarded' : 'Deducted'}`,
    content: `${amount > 0 ? '+' : ''}${amount} points ${amount > 0 ? 'awarded to' : 'deducted from'} ${student.name ?? 'a student'}${reasonSuffix}`,
    type: 'points',
  })

  revalidatePath('/admin/points')
}

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
  revalidatePath('/admin/committee')
  revalidatePath('/info/committee')
}

export type ClubFormState = { warning: string | null }

function revalidateClubs() {
  revalidatePath('/admin/clubs')
  revalidatePath('/info/clubs')
}

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

  const files = formData.getAll('images').filter(
    (f): f is File => f instanceof File && f.size > 0
  )
  const uploaded = await Promise.all(files.map((f) => uploadImage('club-images', f)))
  const images = uploaded.filter((url): url is string => Boolean(url))
  const failedCount = files.length - images.length

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

export type CommitteeFormState = { warning: string | null }

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
