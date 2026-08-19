import QRCode from 'qrcode'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { getLunchDay, getOrder, resolveStudentDbId } from '@/lib/lunch-data'
import { isDayOrderable } from '@/lib/lunch'

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const order = await getOrder(id)
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const isAdmin = Boolean((session.user as any)?.isAdmin)
  const studentDbId = await resolveStudentDbId(session)
  if (!isAdmin && order.studentId !== studentDbId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const day = await getLunchDay(order.dayKey)
  const paymentOpen = isDayOrderable(day ?? undefined)

  let qrCodeImage: string | null = null
  if (
    paymentOpen &&
    order.status === 'pending_payment' &&
    order.qrisPayload
  ) {
    qrCodeImage = await QRCode.toDataURL(order.qrisPayload, {
      width: 512,
      margin: 2,
    })
  }

  return NextResponse.json({
    order,
    qrCodeImage,
    paymentOpen,
    orderDeadline: day?.orderDeadline ?? null,
  })
}
