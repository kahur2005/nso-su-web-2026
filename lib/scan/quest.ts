import { supabase } from '@/lib/supabase'
import type { ScanOutcome } from './npc'

/** Complete a quest scan for a student and award points. */
export async function completeQuestScan(
  studentInternalId: string,
  questId: string,
  token: string
): Promise<ScanOutcome> {
  const { data: quest, error: questError } = await supabase
    .from('Quest')
    .select('isActive, isDeleted, qrToken, type')
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
  if (quest.type && quest.type !== 'qr') {
    return {
      body: { success: false, error: 'This quest is not completed by scanning.' },
      status: 400,
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
