import { randomUUID } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse, type NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { buildDynamicQris } from '@/lib/qris'
import { isLunchDayKey, isDayOrderable } from '@/lib/lunch'
import {
  getLunchDay,
  getQrisStatic,
  getStudentOrders,
  resolveStudentDbId,
} from '@/lib/lunch-data'
import { APP_TIME_ZONE_LABEL, formatJakartaDateTime } from '@/lib/time'

function newOrderCode(): string {
  return `LNC-${randomUUID().slice(0, 8).toUpperCase()}`
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const studentDbId = await resolveStudentDbId(session)
  if (!studentDbId) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  return NextResponse.json({ orders: await getStudentOrders(studentDbId) })
}

interface IncomingLine {
  menuItemId?: unknown
  quantity?: unknown
  addOnIds?: unknown
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const studentDbId = await resolveStudentDbId(session)
  if (!studentDbId) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  let body: {
    dayKey?: unknown
    restaurantId?: unknown
    lines?: unknown
    note?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const dayKey = String(body.dayKey ?? '')
  const restaurantId = String(body.restaurantId ?? '')
  const rawLines = Array.isArray(body.lines) ? (body.lines as IncomingLine[]) : []
  const note = String(body.note ?? '').trim().slice(0, 300) || null

  if (!isLunchDayKey(dayKey)) {
    return NextResponse.json({ error: 'Unknown day' }, { status: 400 })
  }
  if (!restaurantId) {
    return NextResponse.json({ error: 'No restaurant selected' }, { status: 400 })
  }
  if (rawLines.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
  }

  // 1. Verify day is open and deadline has not passed (WIB-authored deadline).
  const day = await getLunchDay(dayKey)
  if (!isDayOrderable(day ?? undefined)) {
    const closedByDeadline =
      day?.isOpen && day.orderDeadline && !isDayOrderable(day)
    return NextResponse.json(
      {
        error: closedByDeadline
          ? `The ordering deadline for that day has passed (${formatJakartaDateTime(day.orderDeadline!, {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })} ${APP_TIME_ZONE_LABEL}).`
          : 'Ordering is not open for that day.',
      },
      { status: 403 }
    )
  }

  // 2. Verify restaurant is active.
  const { data: restaurant, error: restaurantError } = await supabase
    .from('LunchRestaurant')
    .select('id, name')
    .eq('id', restaurantId)
    .eq('isActive', true)
    .eq('isDeleted', false)
    .maybeSingle()

  if (restaurantError) {
    console.error('lunch orders: restaurant lookup failed:', restaurantError)
    return NextResponse.json({ error: 'Could not place the order' }, { status: 500 })
  }
  if (!restaurant) {
    return NextResponse.json(
      { error: 'That restaurant is no longer available.' },
      { status: 400 }
    )
  }

  // 3. Fetch items and add-ons from database and recalculate totals.
  const requestedItemIds = [...new Set(rawLines.map((l) => String(l.menuItemId ?? '')))]
  const requestedAddOnIds = [
    ...new Set(
      rawLines.flatMap((l) =>
        Array.isArray(l.addOnIds) ? l.addOnIds.map((a) => String(a)) : []
      )
    ),
  ]

  const { data: items, error: itemError } = await supabase
    .from('LunchMenuItem')
    .select('id, name, price, restaurantId')
    .in('id', requestedItemIds)
    .eq('restaurantId', restaurantId)
    .eq('isActive', true)
    .eq('isDeleted', false)

  if (itemError) {
    console.error('lunch orders: menu item lookup failed:', itemError)
    return NextResponse.json({ error: 'Could not place the order' }, { status: 500 })
  }

  const itemById = new Map((items ?? []).map((i) => [i.id, i]))

  let addOnById = new Map<string, { id: string; name: string; price: number; menuItemId: string }>()
  if (requestedAddOnIds.length > 0) {
    const { data: addOns, error: addOnError } = await supabase
      .from('LunchAddOn')
      .select('id, name, price, menuItemId')
      .in('id', requestedAddOnIds)
      .eq('isActive', true)

    if (addOnError) {
      console.error('lunch orders: add-on lookup failed:', addOnError)
      return NextResponse.json({ error: 'Could not place the order' }, { status: 500 })
    }
    addOnById = new Map((addOns ?? []).map((a) => [a.id, a]))
  }

  interface ResolvedLine {
    menuItemId: string
    nameSnapshot: string
    unitPrice: number
    quantity: number
    lineTotal: number
    addOns: { addOnId: string; nameSnapshot: string; price: number }[]
  }

  const resolved: ResolvedLine[] = []

  for (const raw of rawLines) {
    const item = itemById.get(String(raw.menuItemId ?? ''))
    if (!item) {
      return NextResponse.json(
        { error: 'One of the items in your cart is no longer available.' },
        { status: 400 }
      )
    }

    const quantity = Number(raw.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return NextResponse.json({ error: 'Invalid quantity.' }, { status: 400 })
    }

    const addOnIds = Array.isArray(raw.addOnIds)
      ? [...new Set(raw.addOnIds.map((a) => String(a)))]
      : []
    const addOns = []
    for (const id of addOnIds) {
      const addOn = addOnById.get(id)
      if (!addOn || addOn.menuItemId !== item.id) {
        return NextResponse.json(
          { error: 'One of the add-ons in your cart is no longer available.' },
          { status: 400 }
        )
      }
      addOns.push({ addOnId: addOn.id, nameSnapshot: addOn.name, price: addOn.price })
    }

    const perUnit = item.price + addOns.reduce((n, a) => n + a.price, 0)
    resolved.push({
      menuItemId: item.id,
      nameSnapshot: item.name,
      unitPrice: item.price,
      quantity,
      lineTotal: perUnit * quantity,
      addOns,
    })
  }

  const subtotal = resolved.reduce((n, l) => n + l.lineTotal, 0)
  if (subtotal <= 0) {
    return NextResponse.json({ error: 'Order total must be above zero.' }, { status: 400 })
  }

  // 4. Generate dynamic QRIS payload.
  const qrisStatic = await getQrisStatic()
  if (!qrisStatic) {
    return NextResponse.json(
      { error: 'Payment is not configured yet. Please contact the committee.' },
      { status: 503 }
    )
  }

  let qrisPayload: string
  try {
    qrisPayload = buildDynamicQris(qrisStatic, subtotal)
  } catch (err) {
    console.error('lunch orders: QRIS generation failed:', err)
    return NextResponse.json(
      { error: 'Payment is not configured correctly. Please contact the committee.' },
      { status: 503 }
    )
  }

  // 5. Insert order and line items.
  const { data: order, error: orderError } = await supabase
    .from('LunchOrder')
    .insert({
      orderCode: newOrderCode(),
      studentId: studentDbId,
      dayKey,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      subtotal,
      status: 'pending_payment',
      qrisPayload,
      note,
    })
    .select('id, orderCode')
    .single()

  if (orderError || !order) {
    console.error('lunch orders: order insert failed:', orderError)
    return NextResponse.json({ error: 'Could not place the order' }, { status: 500 })
  }

  async function rollback(reason: string, err: unknown) {
    console.error(`lunch orders: ${reason}:`, err)
    await supabase.from('LunchOrder').delete().eq('id', order!.id)
  }

  const { data: insertedItems, error: itemsInsertError } = await supabase
    .from('LunchOrderItem')
    .insert(
      resolved.map((l) => ({
        orderId: order.id,
        menuItemId: l.menuItemId,
        nameSnapshot: l.nameSnapshot,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
      }))
    )
    .select('id')

  if (itemsInsertError || !insertedItems || insertedItems.length !== resolved.length) {
    await rollback('order item insert failed', itemsInsertError)
    return NextResponse.json({ error: 'Could not place the order' }, { status: 500 })
  }

  const addOnRows = resolved.flatMap((l, i) =>
    l.addOns.map((a) => ({
      orderItemId: insertedItems[i].id,
      addOnId: a.addOnId,
      nameSnapshot: a.nameSnapshot,
      price: a.price,
    }))
  )

  if (addOnRows.length > 0) {
    const { error: addOnInsertError } = await supabase
      .from('LunchOrderItemAddOn')
      .insert(addOnRows)

    if (addOnInsertError) {
      await rollback('order add-on insert failed', addOnInsertError)
      return NextResponse.json({ error: 'Could not place the order' }, { status: 500 })
    }
  }

  return NextResponse.json({ orderId: order.id, orderCode: order.orderCode, subtotal })
}
