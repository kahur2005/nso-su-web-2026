// app/api/qr/generate/route.ts
import QRCode from 'qrcode'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { committeeName, role, funFact, rarity, points } = await request.json()

  // Create NPC
  const npc = await prisma.nPC.create({
    data: { committeeName, role, funFact, rarity, points }
  })

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
  await prisma.nPC.update({
    where: { id: npc.id },
    data: { qrToken: token, qrCode: qrCodeImage }
  })

  return NextResponse.json({
    success: true,
    npc,
    qrCode: qrCodeImage,
    scanUrl
  })
}