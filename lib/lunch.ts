import { TIMELINE_DAYS, type TimelineDayMeta } from '@/lib/timeline'
import { APP_TIME_ZONE, isBeforeDeadline } from '@/lib/time'

/** On-campus days available for lunch pre-orders. */
export const LUNCH_DAYS: TimelineDayMeta[] = TIMELINE_DAYS.filter(
  (d) => d.key !== 'tm'
)

export const LUNCH_DAY_KEYS = LUNCH_DAYS.map((d) => d.key)

export function isLunchDayKey(key: string): boolean {
  return LUNCH_DAY_KEYS.includes(key)
}

export function lunchDayMeta(key: string): TimelineDayMeta | undefined {
  return LUNCH_DAYS.find((d) => d.key === key)
}

/** Format currency amount as Indonesian Rupiah string. */
export function formatRupiah(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID')
}

export interface LunchAddOn {
  id: string
  name: string
  price: number
  sortOrder: number
  isActive: boolean
}

export interface LunchMenuItem {
  id: string
  restaurantId: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
  addOns: LunchAddOn[]
}

export interface LunchRestaurant {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
  menuItems?: LunchMenuItem[]
}

export interface LunchDay {
  dayKey: string
  isOpen: boolean
  orderDeadline: string | null
}

export type LunchOrderStatus =
  | 'pending_payment'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'

export const LUNCH_STATUS_LABEL: Record<LunchOrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  awaiting_approval: 'Checking payment',
  approved: 'Approved',
  rejected: 'Rejected',
}

export interface LunchOrderItemAddOn {
  id: string
  nameSnapshot: string
  price: number
}

export interface LunchOrderItem {
  id: string
  menuItemId: string | null
  nameSnapshot: string
  unitPrice: number
  quantity: number
  lineTotal: number
  addOns: LunchOrderItemAddOn[]
}

export interface LunchOrder {
  id: string
  orderCode: string
  studentId: string
  dayKey: string
  restaurantId: string | null
  restaurantName: string
  subtotal: number
  status: LunchOrderStatus
  qrisPayload: string | null
  paymentProofUrl: string | null
  rejectionReason: string | null
  note: string | null
  createdAt: string
  submittedAt: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  items: LunchOrderItem[]
}

export interface CartLine {
  key: string
  menuItemId: string
  name: string
  unitPrice: number
  quantity: number
  addOns: { id: string; name: string; price: number }[]
}

/** Calculate line total price including add-ons and quantity. */
export function cartLineTotal(line: CartLine): number {
  const perUnit = line.unitPrice + line.addOns.reduce((n, a) => n + a.price, 0)
  return perUnit * line.quantity
}

/** Calculate subtotal for all cart lines. */
export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + cartLineTotal(l), 0)
}

/** Scope definitions for order recap reports. */
export const LUNCH_RECAP_SCOPES = {
  paid: {
    label: 'Approved + still checking',
    statuses: ['approved', 'awaiting_approval'],
    hint: 'Includes approved and pending verification orders.',
  },
  approved: {
    label: 'Approved only',
    statuses: ['approved'],
    hint: 'Includes verified orders only.',
  },
  all: {
    label: 'Every order',
    statuses: ['approved', 'awaiting_approval', 'pending_payment', 'rejected'],
    hint: 'Includes all orders.',
  },
} as const

export type LunchRecapScope = keyof typeof LUNCH_RECAP_SCOPES

export function isLunchRecapScope(value: string): value is LunchRecapScope {
  return value in LUNCH_RECAP_SCOPES
}

export interface RecapAddOnLine {
  name: string
  price: number
  quantity: number
  total: number
}

export interface RecapItemLine {
  name: string
  unitPrice: number
  quantity: number
  total: number
  addOns: RecapAddOnLine[]
  grandTotal: number
}

export interface RecapRestaurant {
  restaurantName: string
  orderCount: number
  itemCount: number
  items: RecapItemLine[]
  total: number
}

export interface LunchRecap {
  restaurants: RecapRestaurant[]
  orderCount: number
  grandTotal: number
}

/** Aggregate order list into a per-restaurant production recap. */
export function buildLunchRecap(orders: LunchOrder[]): LunchRecap {
  const byRestaurant = new Map<
    string,
    { orders: Set<string>; items: Map<string, RecapItemLine> }
  >()

  for (const order of orders) {
    const key = order.restaurantName
    let bucket = byRestaurant.get(key)
    if (!bucket) {
      bucket = { orders: new Set(), items: new Map() }
      byRestaurant.set(key, bucket)
    }
    bucket.orders.add(order.id)

    for (const item of order.items) {
      const itemKey = `${item.nameSnapshot}@${item.unitPrice}`
      let line = bucket.items.get(itemKey)
      if (!line) {
        line = {
          name: item.nameSnapshot,
          unitPrice: item.unitPrice,
          quantity: 0,
          total: 0,
          addOns: [],
          grandTotal: 0,
        }
        bucket.items.set(itemKey, line)
      }
      line.quantity += item.quantity
      line.total += item.unitPrice * item.quantity

      for (const addOn of item.addOns) {
        const addOnKey = `${addOn.nameSnapshot}@${addOn.price}`
        let addOnLine = line.addOns.find(
          (a) => `${a.name}@${a.price}` === addOnKey
        )
        if (!addOnLine) {
          addOnLine = { name: addOn.nameSnapshot, price: addOn.price, quantity: 0, total: 0 }
          line.addOns.push(addOnLine)
        }
        addOnLine.quantity += item.quantity
        addOnLine.total += addOn.price * item.quantity
      }
    }
  }

  const restaurants: RecapRestaurant[] = [...byRestaurant.entries()]
    .map(([restaurantName, bucket]) => {
      const items = [...bucket.items.values()]
        .map((line) => ({
          ...line,
          addOns: [...line.addOns].sort((a, b) => b.quantity - a.quantity),
          grandTotal: line.total + line.addOns.reduce((n, a) => n + a.total, 0),
        }))
        .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))

      return {
        restaurantName,
        orderCount: bucket.orders.size,
        itemCount: items.reduce((n, i) => n + i.quantity, 0),
        items,
        total: items.reduce((n, i) => n + i.grandTotal, 0),
      }
    })
    .sort((a, b) => b.total - a.total || a.restaurantName.localeCompare(b.restaurantName))

  return {
    restaurants,
    orderCount: orders.length,
    grandTotal: restaurants.reduce((n, r) => n + r.total, 0),
  }
}

/** Convert recap object to spreadsheet rows. */
export function recapToRows(recap: LunchRecap): (string | number)[][] {
  const rows: (string | number)[][] = [
    ['Restaurant', 'Item', 'Type', 'Unit price', 'Qty', 'Subtotal'],
  ]

  for (const restaurant of recap.restaurants) {
    for (const item of restaurant.items) {
      rows.push([
        restaurant.restaurantName,
        item.name,
        'Dish',
        item.unitPrice,
        item.quantity,
        item.total,
      ])
      for (const addOn of item.addOns) {
        rows.push([
          restaurant.restaurantName,
          `${item.name} — ${addOn.name}`,
          'Add-on',
          addOn.price,
          addOn.quantity,
          addOn.total,
        ])
      }
    }
    rows.push([
      restaurant.restaurantName,
      'TOTAL',
      '',
      '',
      restaurant.itemCount,
      restaurant.total,
    ])
  }

  if (recap.restaurants.length > 1) {
    rows.push(['ALL RESTAURANTS', 'GRAND TOTAL', '', '', '', recap.grandTotal])
  }

  return rows
}

export interface RecapTextOrder {
  id: string
  restaurantName: string
  studentName: string
  note: string | null
  items: {
    nameSnapshot: string
    quantity: number
    addOns: { nameSnapshot: string }[]
  }[]
}

function indonesianDate(raw: string | undefined): string | null {
  if (!raw) return null
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleDateString('id-ID', {
    timeZone: APP_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Generate formatted plain-text order recap for messaging vendors. */
export function buildRecapText(
  orders: RecapTextOrder[],
  options: { dayKey?: string; mealLabel?: string } = {}
): string {
  if (orders.length === 0) return ''

  const mealLabel = options.mealLabel ?? 'Makan siang'
  const meta = options.dayKey ? lunchDayMeta(options.dayKey) : undefined
  const dateLabel = indonesianDate(meta?.date)

  const byRestaurant = new Map<string, RecapTextOrder[]>()
  for (const order of orders) {
    const list = byRestaurant.get(order.restaurantName) ?? []
    list.push(order)
    byRestaurant.set(order.restaurantName, list)
  }

  const blocks: string[] = []

  for (const [restaurantName, restaurantOrders] of [...byRestaurant.entries()].sort(
    (a, b) => a[0].localeCompare(b[0])
  )) {
    const groups = new Map<
      string,
      { title: string; portions: number; lines: { name: string; quantity: number; note: string | null }[] }
    >()
    let portionTotal = 0

    for (const order of restaurantOrders) {
      for (const item of order.items) {
        const title = [item.nameSnapshot, ...item.addOns.map((a) => a.nameSnapshot)].join(' + ')
        let group = groups.get(title)
        if (!group) {
          group = { title, portions: 0, lines: [] }
          groups.set(title, group)
        }
        group.portions += item.quantity
        portionTotal += item.quantity
        group.lines.push({
          name: order.studentName,
          quantity: item.quantity,
          note: order.note?.trim() || null,
        })
      }
    }

    const header = [
      `🍽️ Rekap Pesanan — ${restaurantName}`,
      [meta?.headerTitle, mealLabel, dateLabel].filter(Boolean).join(' · '),
      `${restaurantOrders.length} pesanan · ${portionTotal} item`,
    ].join('\n')

    const sections = [...groups.values()]
      .sort((a, b) => b.portions - a.portions || a.title.localeCompare(b.title))
      .map((group) => {
        const lines = group.lines.map((line, i) => {
          const qty = line.quantity > 1 ? ` ×${line.quantity}` : ''
          const note = line.note ? ` (${line.note})` : ''
          return `${i + 1}. ${line.name}${qty}${note}`
        })
        return `${group.title} (${group.portions} item)\n${lines.join('\n')}`
      })

    blocks.push([header, '', sections.join('\n\n')].join('\n').trimEnd())
  }

  return blocks.join('\n\n———\n\n')
}

/** Convert tabular data to tab-separated values (TSV) format. */
export function rowsToTsv(rows: (string | number)[][]): string {
  return rows
    .map((row) => row.map((cell) => String(cell).replace(/[\t\r\n]+/g, ' ')).join('\t'))
    .join('\n')
}

/**
 * Whether students may place or pay for orders on this lunch day right now.
 * Uses the WIB-authored deadline instant (see `isBeforeDeadline`); blank
 * deadline means open indefinitely while `isOpen`.
 */
export function isDayOrderable(
  day: LunchDay | undefined,
  now: Date = new Date()
): boolean {
  if (!day || !day.isOpen) return false
  if (!day.orderDeadline) return true
  return isBeforeDeadline(day.orderDeadline, now)
}
