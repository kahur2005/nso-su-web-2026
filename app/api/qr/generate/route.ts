// app/api/qr/generate/route.ts
import QRCode from 'qrcode'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { isDivisionId } from '@/lib/divisions'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { committeeName, role, division, instagram, funFact, points } = await request.json()

  // division is nullable on NPC -- allow it to be absent/empty, but reject
  // anything present that isn't one of the known division ids.
  if (division && !isDivisionId(division)) {
    return NextResponse.json({ error: 'Invalid division' }, { status: 400 })
  }

  // Create NPC
  const { data: npc, error: createError } = await supabase
    .from('NPC')
    .insert({
      committeeName,
      role,
      division: division || null,
      instagram: instagram || null,
      funFact,
      points,
    })
    .select()
    .single()

  if (createError || !npc) {
    console.error(createError)
    return NextResponse.json({ error: 'Could not create NPC' }, { status: 500 })
  }

  // Generate JWT token
  const token = jwt.sign(
    { npcId: npc.id, points },
    process.env.QR_SECRET_KEY!,
    { expiresIn: '7d' }
  )

  // Generate QR Code
  const scanUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/scan?token=${token}`
  const qrCodeImage = await QRCode.toDataURL(scanUrl, {
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' }
  })

  // Save token & QR
  await supabase
    .from('NPC')
    .update({ qrToken: token, qrCode: qrCodeImage })
    .eq('id', npc.id)

  return NextResponse.json({
    success: true,
    npc,
    qrCode: qrCodeImage,
    scanUrl
  })
}