// lib/quests.ts
export type QuestType = 'qr' | 'submission' | 'quiz'

export const QUEST_TYPE_LABEL: Record<QuestType, string> = {
  qr: 'QR',
  submission: 'Submit',
  quiz: 'Quiz',
}

export function isQuestType(v: unknown): v is QuestType {
  return v === 'qr' || v === 'submission' || v === 'quiz'
}

export function questWindowState(
  availableFrom: string | null | undefined,
  availableUntil: string | null | undefined,
  now = new Date(),
) {
  const from = availableFrom ? new Date(availableFrom) : null
  const until = availableUntil ? new Date(availableUntil) : null
  return {
    isLocked: !!(from && now < from),
    isExpired: !!(until && now > until),
  }
}
