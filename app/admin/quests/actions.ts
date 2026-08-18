'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { isQuestType } from '@/lib/quests'
import { resolveStudentDbId } from '@/lib/lunch-data'
import { jakartaLocalInputToIso } from '@/lib/time'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    throw new Error('Unauthorized')
  }
  return session
}

function revalidate() {
  revalidatePath('/admin/quests')
  revalidatePath('/admin/quests/submissions')
  revalidatePath('/quests')
}

function achievementIdOrNull(formData: FormData): string | null {
  const value = String(formData.get('achievementId') || '').trim()
  return value || null
}

type QuestionDraft = {
  prompt: string
  points: number
  options: { label: string; isCorrect: boolean }[]
}

function validateQuestionDrafts(drafts: QuestionDraft[]): string | null {
  if (!Array.isArray(drafts) || drafts.length === 0) {
    return 'Add at least one question.'
  }
  for (const d of drafts) {
    if (!String(d.prompt || '').trim()) return 'Each question needs a prompt.'
    if (!Number.isFinite(d.points) || d.points <= 0) {
      return 'Each question needs positive points.'
    }
    if (!Array.isArray(d.options) || d.options.length < 2) {
      return 'Each question needs at least 2 options.'
    }
    const correctCount = d.options.filter((o) => o.isCorrect).length
    if (correctCount !== 1) {
      return 'Each question must have exactly one correct option.'
    }
    for (const o of d.options) {
      if (!String(o.label || '').trim()) return 'Each option needs a label.'
    }
  }
  return null
}

export async function createQuest(formData: FormData) {
  await requireAdmin()

  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const typeRaw = String(formData.get('type') || 'qr')
  const type = isQuestType(typeRaw) ? typeRaw : 'qr'
  const points =
    type === 'quiz' ? 0 : parseInt(String(formData.get('points') || '0'), 10)
  const fromRaw = String(formData.get('availableFrom') || '').trim()
  const untilRaw = String(formData.get('availableUntil') || '').trim()
  const availableFrom = fromRaw ? jakartaLocalInputToIso(fromRaw) : null
  const availableUntil = untilRaw ? jakartaLocalInputToIso(untilRaw) : null

  if (!title || !description) return
  if (type !== 'quiz' && (!Number.isFinite(points) || points <= 0)) return

  const payload: any = {
    title,
    description,
    points,
    type,
    achievementId: achievementIdOrNull(formData),
    isActive: false,
  }
  if (availableFrom) payload.availableFrom = availableFrom
  if (availableUntil) payload.availableUntil = availableUntil

  const { error } = await supabase.from('Quest').insert(payload)
  if (error) {
    delete payload.availableFrom
    delete payload.availableUntil
    delete payload.type
    await supabase.from('Quest').insert(payload)
  }

  revalidate()
}

export async function updateQuest(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const points = parseInt(String(formData.get('points') || '0'), 10)
  const fromRaw = String(formData.get('availableFrom') || '').trim()
  const untilRaw = String(formData.get('availableUntil') || '').trim()
  const availableFrom = fromRaw ? jakartaLocalInputToIso(fromRaw) : null
  const availableUntil = untilRaw ? jakartaLocalInputToIso(untilRaw) : null

  if (!id || !title || !description) return

  const { data: existing } = await supabase
    .from('Quest')
    .select('type')
    .eq('id', id)
    .maybeSingle()

  const questType = isQuestType(existing?.type) ? existing.type : 'qr'

  if (questType !== 'quiz' && (!Number.isFinite(points) || points <= 0)) return

  const payload: any = {
    title,
    description,
    achievementId: achievementIdOrNull(formData),
  }
  if (questType !== 'quiz') payload.points = points
  if (availableFrom !== undefined) payload.availableFrom = availableFrom
  if (availableUntil !== undefined) payload.availableUntil = availableUntil

  const { error } = await supabase.from('Quest').update(payload).eq('id', id)
  if (error) {
    delete payload.availableFrom
    delete payload.availableUntil
    await supabase.from('Quest').update(payload).eq('id', id)
  }

  revalidate()
}

export async function saveQuestQuestions(
  formData: FormData,
): Promise<{ error?: string } | void> {
  await requireAdmin()

  const questId = String(formData.get('questId') || '').trim()
  const questionsRaw = String(formData.get('questions') || '')

  if (!questId) return { error: 'Missing quest ID.' }

  let drafts: QuestionDraft[]
  try {
    drafts = JSON.parse(questionsRaw)
  } catch {
    return { error: 'Invalid questions data.' }
  }

  const validationError = validateQuestionDrafts(drafts)
  if (validationError) return { error: validationError }

  const { data: quest, error: questError } = await supabase
    .from('Quest')
    .select('id, type, isDeleted')
    .eq('id', questId)
    .maybeSingle()

  if (questError || !quest || quest.isDeleted) {
    return { error: 'Quest not found.' }
  }
  if (quest.type !== 'quiz') {
    return { error: 'Only quiz quests have questions.' }
  }

  const { data: existingQuestions } = await supabase
    .from('QuestQuestion')
    .select('id')
    .eq('questId', questId)

  const questionIds = (existingQuestions ?? []).map((q) => q.id)

  if (questionIds.length > 0) {
    const { count } = await supabase
      .from('QuestAnswer')
      .select('id', { count: 'exact', head: true })
      .in('questionId', questionIds)

    if (count && count > 0) {
      return { error: 'Questions are frozen after students answer.' }
    }
  }

  const { error: deleteError } = await supabase
    .from('QuestQuestion')
    .delete()
    .eq('questId', questId)

  if (deleteError) {
    return { error: 'Failed to update questions.' }
  }

  let totalPoints = 0

  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i]
    const { data: question, error: qError } = await supabase
      .from('QuestQuestion')
      .insert({
        questId,
        prompt: d.prompt.trim(),
        points: d.points,
        sortOrder: i,
      })
      .select('id')
      .single()

    if (qError || !question) {
      return { error: 'Failed to save questions.' }
    }

    totalPoints += d.points

    const optionRows = d.options.map((o, j) => ({
      questionId: question.id,
      label: o.label.trim(),
      isCorrect: o.isCorrect,
      sortOrder: j,
    }))

    const { error: oError } = await supabase.from('QuestQuestionOption').insert(optionRows)
    if (oError) {
      return { error: 'Failed to save options.' }
    }
  }

  await supabase.from('Quest').update({ points: totalPoints }).eq('id', questId)

  revalidate()
}

export async function toggleQuestActive(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  const isActive = String(formData.get('isActive') || '') === 'true'
  if (!id) return

  await supabase.from('Quest').update({ isActive: !isActive }).eq('id', id)
  revalidate()
}

/** Soft delete quest by ID. */
export async function deleteQuest(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  await supabase.from('Quest').update({ isDeleted: true, isActive: false }).eq('id', id)
  revalidate()
}

type QuestReviewRow = {
  id: string
  points: number
  type: string
  isActive: boolean
  isDeleted: boolean
  achievementId: string | null
}

function relationOne<T>(value: unknown): T | null {
  if (value == null) return null
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null
  return value as T
}

export async function approveQuestSubmission(formData: FormData) {
  const session = await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  const reviewedBy = await resolveStudentDbId(session)
  if (!reviewedBy) return

  const { data: sub } = await supabase
    .from('QuestSubmission')
    .select('id, studentId, questId, status, quest:Quest(id, points, type, isActive, isDeleted, achievementId)')
    .eq('id', id)
    .maybeSingle()

  if (!sub || sub.status !== 'awaiting_approval') return

  const quest = relationOne<QuestReviewRow>(sub.quest)
  if (!quest || quest.type !== 'submission' || quest.isDeleted || !quest.isActive) return

  const { data: updated } = await supabase
    .from('QuestSubmission')
    .update({
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy,
    })
    .eq('id', id)
    .eq('status', 'awaiting_approval')
    .select('id')
    .maybeSingle()

  if (!updated) return

  const { error: rpcError } = await supabase.rpc('adjust_points', {
    p_student_id: sub.studentId,
    p_amount: quest.points,
  })

  if (rpcError) {
    console.error('approveQuestSubmission adjust_points:', rpcError)
    await supabase
      .from('QuestSubmission')
      .update({
        status: 'awaiting_approval',
        reviewedAt: null,
        reviewedBy: null,
      })
      .eq('id', id)
      .eq('status', 'approved')
    await supabase.from('QuestProgress').upsert(
      {
        studentId: sub.studentId,
        questId: sub.questId,
        status: 'in_progress',
        completedAt: null,
      },
      { onConflict: 'studentId,questId' },
    )
    throw new Error('Could not award points for this submission. Approval was rolled back.')
  }

  const { error: progressError } = await supabase.from('QuestProgress').upsert(
    {
      studentId: sub.studentId,
      questId: sub.questId,
      status: 'completed',
      completedAt: new Date().toISOString(),
    },
    { onConflict: 'studentId,questId' },
  )
  if (progressError) {
    console.error('approveQuestSubmission QuestProgress:', progressError)
    await supabase.rpc('adjust_points', {
      p_student_id: sub.studentId,
      p_amount: -quest.points,
    })
    await supabase
      .from('QuestSubmission')
      .update({
        status: 'awaiting_approval',
        reviewedAt: null,
        reviewedBy: null,
      })
      .eq('id', id)
      .eq('status', 'approved')
    throw new Error('Could not update quest progress. Approval was rolled back.')
  }

  if (quest.achievementId) {
    const { error: achError } = await supabase.from('StudentAchievement').upsert(
      { studentId: sub.studentId, achievementId: quest.achievementId },
      { onConflict: 'studentId,achievementId', ignoreDuplicates: true },
    )
    if (achError) console.error('approveQuestSubmission StudentAchievement:', achError)
  }

  revalidate()
}

export async function rejectQuestSubmission(formData: FormData) {
  const session = await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  const reviewedBy = await resolveStudentDbId(session)
  if (!reviewedBy) return

  const { data: sub } = await supabase
    .from('QuestSubmission')
    .select('id, studentId, questId, status, quest:Quest(type, isDeleted, isActive)')
    .eq('id', id)
    .maybeSingle()

  if (!sub || sub.status !== 'awaiting_approval') return

  const quest = relationOne<{ type: string; isDeleted: boolean; isActive: boolean }>(sub.quest)
  if (!quest || quest.type !== 'submission' || quest.isDeleted || !quest.isActive) return

  const { data: updated } = await supabase
    .from('QuestSubmission')
    .update({
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy,
    })
    .eq('id', id)
    .eq('status', 'awaiting_approval')
    .select('id')
    .maybeSingle()

  if (!updated) return

  await supabase.from('QuestProgress').upsert(
    {
      studentId: sub.studentId,
      questId: sub.questId,
      status: 'in_progress',
      completedAt: null,
    },
    { onConflict: 'studentId,questId' },
  )

  revalidate()
}
