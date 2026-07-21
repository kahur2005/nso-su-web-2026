// lib/scan/quest.ts
// The quest half of the QR scan flow: a student scans a quest's code, the quest
// is marked complete in their library, points are awarded, and — if the admin
// linked one — an achievement unlocks.
//
// Unlike a fun-fact QR, a quest code is not tied to a person. One printed code
// is scanned by every student; `QuestProgress`'s unique (studentId, questId)
// constraint is what stops anyone claiming it twice.
import { supabase } from '@/lib/supabase'
import type { ScanOutcome } from './npc'

/**
 * Complete a quest for a student.
 *
 * Mirrors the NPC path's guards, and for the same reason: `complete_quest`
 * validates the quest is active and not deleted, but it cannot know whether the
 * token presented is the *current* one. Regenerating a quest's QR only
 * overwrites the stored `qrToken`; the old JWT stays signed and unexpired, so
 * the token match below is the only thing that retires an old printout.
 */
export async function completeQuestScan(
  studentInternalId: string,
  questId: string,
  token: string
): Promise<ScanOutcome> {
  const { data: quest, error: questError } = await supabase
    .from('Quest')
    .select('isActive, isDeleted, qrToken')
    .eq('id', questId)
    .maybeSingle()

  if (questError) {
    console.error('scan/quest: lookup failed:', questError)
    return { body: { success: false, error: 'Server error' }, status: 500 }
  }
  if (!quest || quest.isDeleted) {
    return { body: { success: false, error: 'Invalid QR Code!' }, status: 404 }
  }
  if (!quest.isActive) {
    return {
      body: { success: false, error: 'This quest is not active right now.' },
      status: 410,
    }
  }
  if (!quest.qrToken || quest.qrToken !== token) {
    return {
      body: {
        success: false,
        error: 'This QR code has been replaced. Please scan the current code.',
      },
      status: 410,
    }
  }

  // Atomic: duplicate guard, QuestProgress insert, points/xp/level, and the
  // StudentAchievement insert all happen inside the RPC. Points come from the
  // Quest row in there, not from the token.
  const { data: result, error } = await supabase.rpc('complete_quest', {
    p_student_id: studentInternalId,
    p_quest_id: questId,
  })

  if (error) {
    console.error('scan/quest: complete_quest rpc failed:', error)
    return { body: { success: false, error: 'Server error' }, status: 500 }
  }

  return { body: { ...result, kind: 'quest' } }
}
