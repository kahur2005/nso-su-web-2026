// lib/scan/npc.ts
// The fun-fact half of the QR scan flow: a student scans a committee member's
// code and collects their fun fact. Extracted from app/api/qr/scan/route.ts
// when quest QRs were added, so that route stays a thin dispatcher.
// Points awarded come from the NPC row at scan time, not from the JWT.
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
  token: string,
  isLiveToken?: boolean
): Promise<ScanOutcome> {
  const { data: npc, error: npcError } = await supabase
    .from('NPC')
    .select('isActive, qrToken, scanCount, maxScans, points')
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
  // Max scans check
  if (npc.maxScans !== null && npc.maxScans !== undefined && npc.scanCount >= npc.maxScans) {
    return {
      body: { success: false, error: 'This QR code has reached its maximum scan limit.' },
      status: 410,
    }
  }
  // For static QRs: verify the token presented matches the current active printed token in DB.
  // For live 1-time QRs (isLiveToken = true): the JWT signature has already been verified
  // statelessly by jwt.verify in the scan dispatcher.
  if (!isLiveToken && (!npc.qrToken || npc.qrToken !== token)) {
    return {
      body: {
        success: false,
        error: 'This QR code has been replaced. Please scan the current code.',
      },
      status: 410,
    }
  }

  // Atomic: duplicate guard, ScanLog insert, and all the point/xp/counter
  // increments happen inside the RPC. Points come from the NPC row at scan
  // time (not the JWT), mirroring quest scan behaviour.
  const points =
    typeof npc.points === 'number' && Number.isFinite(npc.points) ? npc.points : 0

  const { data: result, error } = await supabase.rpc('scan_npc', {
    p_student_id: studentInternalId,
    p_npc_id: npcId,
    p_points: points,
  })

  if (error) {
    console.error('scan/npc: scan_npc rpc failed:', error)
    return { body: { success: false, error: 'Server error' }, status: 500 }
  }

  // Auto-deactivate NPC if maxScans limit reached after this scan
  if (npc.maxScans !== null && npc.maxScans !== undefined && (npc.scanCount + 1) >= npc.maxScans) {
    await supabase.from('NPC').update({ isActive: false }).eq('id', npcId)
  }

  return { body: { ...result, kind: 'npc' } }
}
