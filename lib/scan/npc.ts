import { supabase } from '@/lib/supabase'

export interface ScanOutcome {
  body: any
  status?: number
}

/** Award points for scanning a committee member QR code. */
export async function completeNpcScan(
  studentInternalId: string,
  npcId: string,
  points: number,
  token: string,
  isLiveToken?: boolean
): Promise<ScanOutcome> {
  const { data: npc, error: npcError } = await supabase
    .from('NPC')
    .select('isActive, qrToken, scanCount, maxScans')
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

  // Validate maximum scan limit.
  if (npc.maxScans !== null && npc.maxScans !== undefined && npc.scanCount >= npc.maxScans) {
    return {
      body: { success: false, error: 'This QR code has reached its maximum scan limit.' },
      status: 410,
    }
  }

  // Verify token matches current active token in database for static codes.
  if (!isLiveToken && (!npc.qrToken || npc.qrToken !== token)) {
    return {
      body: {
        success: false,
        error: 'This QR code has been replaced. Please scan the current code.',
      },
      status: 410,
    }
  }

  const { data: result, error } = await supabase.rpc('scan_npc', {
    p_student_id: studentInternalId,
    p_npc_id: npcId,
    p_points: points,
  })

  if (error) {
    console.error('scan/npc: scan_npc rpc failed:', error)
    return { body: { success: false, error: 'Server error' }, status: 500 }
  }

  // Deactivate QR code if scan count reaches maximum limit.
  if (npc.maxScans !== null && npc.maxScans !== undefined && (npc.scanCount + 1) >= npc.maxScans) {
    await supabase.from('NPC').update({ isActive: false }).eq('id', npcId)
  }

  return { body: { ...result, kind: 'npc' } }
}
