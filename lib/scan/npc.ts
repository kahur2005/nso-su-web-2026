// lib/scan/npc.ts
// The fun-fact half of the QR scan flow: a student scans a committee member's
// code and collects their fun fact. Extracted from app/api/qr/scan/route.ts
// when quest QRs were added, so that route stays a thin dispatcher.
import { supabase } from '@/lib/supabase'

export interface ScanOutcome {
  /** Response body to return to the client. */
  body: any
  /** HTTP status; omit for 200. */
  status?: number
}

/**
 * Award a fun-fact scan.
 *
 * The guards here are the ONLY gate: the `scan_npc` Postgres function checks
 * neither `isActive` nor `qrToken`. Soft-deleting a member (see
 * `deactivateCommitteeMember`) and regenerating their QR both leave the
 * previously issued JWT signed, unexpired and otherwise valid. Any future
 * caller of `scan_npc` must repeat these checks.
 */
export async function completeNpcScan(
  studentInternalId: string,
  npcId: string,
  points: number,
  token: string
): Promise<ScanOutcome> {
  const { data: npc, error: npcError } = await supabase
    .from('NPC')
    .select('isActive, qrToken')
    .eq('id', npcId)
    .maybeSingle()

  if (npcError) {
    console.error('scan/npc: lookup failed:', npcError)
    return { body: { success: false, error: 'Server error' }, status: 500 }
  }
  if (!npc) {
    return { body: { success: false, error: 'Invalid QR Code!' }, status: 404 }
  }
  if (!npc.isActive) {
    return {
      body: { success: false, error: 'This code is no longer active.' },
      status: 410,
    }
  }
  // A null qrToken means no QR was ever generated, so no presented token can be
  // valid. A mismatch means this printout has been superseded by a regenerate.
  if (!npc.qrToken || npc.qrToken !== token) {
    return {
      body: {
        success: false,
        error: 'This QR code has been replaced. Please scan the current code.',
      },
      status: 410,
    }
  }

  // Atomic: duplicate guard, ScanLog insert, and all the point/xp/counter
  // increments happen inside the RPC.
  const { data: result, error } = await supabase.rpc('scan_npc', {
    p_student_id: studentInternalId,
    p_npc_id: npcId,
    p_points: points,
  })

  if (error) {
    console.error('scan/npc: scan_npc rpc failed:', error)
    return { body: { success: false, error: 'Server error' }, status: 500 }
  }

  return { body: { ...result, kind: 'npc' } }
}
