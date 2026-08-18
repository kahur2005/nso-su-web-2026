import { supabase } from '@/lib/supabase'
import { isQuestType, questWindowState, type QuestType } from '@/lib/quests'

export type StudentQuest = {
  id: string
  title: string
  description: string
  points: number
  type: QuestType
  isActive: boolean
  isDeleted: boolean
  availableFrom: string | null
  availableUntil: string | null
  achievementId: string | null
}

export type QuestOpenResult =
  | { ok: true; quest: StudentQuest }
  | { ok: false; error: string; status: number }

/** Verify quest availability and active status for a student. */
export async function assertQuestOpenForStudent(
  questId: string,
): Promise<QuestOpenResult> {
  const { data, error } = await supabase
    .from('Quest')
    .select(
      'id, title, description, points, type, isActive, isDeleted, availableFrom, availableUntil, achievementId',
    )
    .eq('id', questId)
    .maybeSingle()

  if (error) {
    console.error('assertQuestOpenForStudent:', error)
    return { ok: false, error: 'Server error', status: 500 }
  }

  if (!data || data.isDeleted) {
    return { ok: false, error: 'Quest not found', status: 404 }
  }

  if (!data.isActive) {
    return {
      ok: false,
      error: 'This quest is not active right now.',
      status: 410,
    }
  }

  const { isLocked, isExpired } = questWindowState(
    data.availableFrom,
    data.availableUntil,
  )

  if (isLocked) {
    return {
      ok: false,
      error: 'This quest is not open yet.',
      status: 403,
    }
  }

  if (isExpired) {
    return {
      ok: false,
      error: 'This quest window has closed.',
      status: 410,
    }
  }

  const type = isQuestType(data.type) ? data.type : 'qr'

  return {
    ok: true,
    quest: {
      id: data.id,
      title: data.title,
      description: data.description,
      points: data.points,
      type,
      isActive: data.isActive,
      isDeleted: data.isDeleted,
      availableFrom: data.availableFrom ?? null,
      availableUntil: data.availableUntil ?? null,
      achievementId: data.achievementId ?? null,
    },
  }
}
