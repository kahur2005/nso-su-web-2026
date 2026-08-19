import QRCode from 'qrcode'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { isDivisionId } from '@/lib/divisions'
import { normalizeInstagram } from '@/lib/instagram'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { npcId, validFrom, validUntil } = body

  let npc: any

  if (npcId) {
    const { data: existingNpc, error: fetchError } = await supabase
      .from('NPC')
      .select('*')
      .eq('id', npcId)
      .maybeSingle()

    if (fetchError) {
      console.error(fetchError)
      return NextResponse.json({ error: 'Could not look up NPC' }, { status: 500 })
    }
    if (!existingNpc) {
      return NextResponse.json({ error: 'NPC not found' }, { status: 404 })
    }
    npc = existingNpc
  } else {
    const { committeeName, role, division, instagram, funFact, points } = body

    if (!division || !isDivisionId(division)) {
      return NextResponse.json({ error: 'Division is required' }, { status: 400 })
    }

    const { data: createdNpc, error: createError } = await supabase
      .from('NPC')
      .insert({
        committeeName,
        role,
        division,
        instagram: normalizeInstagram(instagram),
        funFact,
        points: typeof points === 'number' ? points : 3,
      })
      .select()
      .single()

    if (createError || !createdNpc) {
      console.error(createError)
      return NextResponse.json({ error: 'Could not create NPC' }, { status: 500 })
    }
    npc = createdNpc
  }

  const payload: Record<string, unknown> = {
    npcId: npc.id,
    points: npc.points,
  }
  if (validFrom) payload.validFrom = validFrom
  if (validUntil) payload.validUntil = validUntil

  const token = jwt.sign(payload, process.env.QR_SECRET_KEY!, { expiresIn: '7d' })

  const scanUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/scan?token=${token}`
  const qrCodeImage = await QRCode.toDataURL(scanUrl, {
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
  })

  const { data: updatedNpc, error: updateError } = await supabase
    .from('NPC')
    .update({ qrToken: token, qrCode: qrCodeImage })
    .eq('id', npc.id)
    .select()
    .single()

  if (updateError) {
    console.error(updateError)
    return NextResponse.json({ error: 'Could not save QR code' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    npc: updatedNpc ?? npc,
    qrCode: qrCodeImage,
    scanUrl,
    validFrom: validFrom ?? null,
    validUntil: validUntil ?? null,
  })
}