// lib/lunch.ts
// Types, day list and formatting for the /lunch pre-order feature.
//
// No Supabase import here, so this file is safe for client components — the
// queries live in ./lunch-data.ts, which is server-only. Same split as
// lib/timeline.ts / lib/timeline-data.ts.

import { TIMELINE_DAYS, type TimelineDayMeta } from '@/lib/timeline'
import { APP_TIME_ZONE } from '@/lib/time'

/**
 * The days you can order lunch for: the five on-campus days.
 *
 * Derived from TIMELINE_DAYS rather than re-declared, so the dates stay in one
 * place. 'tm' is dropped because the Technical Meeting is online — there is no
 * lunch to hand out. The keys here are what LunchDay.dayKey stores.
 */
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

// --------------------------------------------------------------- money ----

/**
 * Rupiah, always whole. The locale is pinned to 'id-ID' on purpose: leaving it
 * to the runtime makes the server and the browser disagree about the thousands
 * separator and trips React's hydration check.
 */
export function formatRupiah(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID')
}

// --------------------------------------------------------------- types ----

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
  /** The student's free-text request for the kitchen ("sambal dipisah"). */
  note: string | null
  createdAt: string
  submittedAt: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  items: LunchOrderItem[]
}

// ---------------------------------------------------------------- cart ----

/** One row in the client-side cart. Prices are cached for display only — the
 *  server re-reads and re-totals everything when the order is placed. */
export interface CartLine {
  /** Stable key for this line. Two lines can share a menuItemId with different
   *  add-on picks, so the menu item id alone cannot identify a row. */
  key: string
  menuItemId: string
  name: string
  unitPrice: number
  quantity: number
  addOns: { id: string; name: string; price: number }[]
}

/** (item + its add-ons) x quantity. */
export function cartLineTotal(line: CartLine): number {
  const perUnit = line.unitPrice + line.addOns.reduce((n, a) => n + a.price, 0)
  return perUnit * line.quantity
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + cartLineTotal(l), 0)
}

// --------------------------------------------------------------- recap ----

/**
 * Which orders count toward a recap. Shared by the admin page and the .xlsx
 * export route so a downloaded file can never disagree with what was on screen.
 */
export const LUNCH_RECAP_SCOPES = {
  // What to actually cook: excludes only orders nobody has paid for.
  paid: {
    label: 'Approved + still checking',
    statuses: ['approved', 'awaiting_approval'],
    hint: 'Includes orders whose payment is still being checked. Use this for how much food to prepare — approvals usually land before service.',
  },
  // Verified money, safe to settle on.
  approved: {
    label: 'Approved only',
    statuses: ['approved'],
    hint: 'Payments committee has verified. Use this figure to settle with the vendor.',
  },
  all: {
    label: 'Every order',
    statuses: ['approved', 'awaiting_approval', 'pending_payment', 'rejected'],
    hint: 'Includes unpaid and rejected orders. Useful for gauging demand, not for paying anyone.',
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
  /** unitPrice x quantity — the dish alone, excluding add-ons. */
  total: number
  addOns: RecapAddOnLine[]
  /** total + every add-on's total, i.e. what this dish actually earned. */
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

/**
 * Rolls a list of orders up into a per-restaurant production list: how many of
 * each dish, with which add-ons, and what the vendor is owed.
 *
 * Rows are keyed on the *snapshot* name and price, not the menu-item id. If a
 * price changed partway through the week, the two runs stay on separate lines
 * rather than being averaged into a figure that matches no receipt.
 *
 * Add-ons are stored once per order line, not per unit, so an add-on's quantity
 * is its parent line's quantity.
 */
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

/**
 * Flattens a recap into a table: one header row, then a row per dish and per
 * add-on, with a total row per restaurant.
 *
 * The screen table, the clipboard copy and the .xlsx export all render this one
 * result, so the three can never disagree about a number. Prices are plain
 * integers, not formatted strings, so a spreadsheet can sum them.
 */
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

// ------------------------------------------------- human-readable recap ----

/** The slice of an order the copy-out needs. Kept minimal and server-agnostic
 *  so this file stays free of any Supabase types. */
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

/** "Selasa, 18 Agustus 2026" from the "18 Aug 2026" stored in LUNCH_DAYS. */
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

/**
 * The message you paste into the vendor's WhatsApp.
 *
 * Grouped by the exact dish-plus-add-on combination, because that is what the
 * kitchen plates — "Nasi Geprek" and "Nasi Geprek + Telur Dadar" are two
 * different things to cook, not one dish with a modifier. Under each, every
 * student who ordered it, with their note repeated so nothing is missed by
 * someone reading only their own section.
 *
 * Counts are TOTAL PORTIONS, not number of people: one student ordering two
 * portions is two plates of food.
 */
export function buildRecapText(
  orders: RecapTextOrder[],
  options: { dayKey?: string; mealLabel?: string } = {}
): string {
  if (orders.length === 0) return ''

  const mealLabel = options.mealLabel ?? 'Makan siang'
  const meta = options.dayKey ? lunchDayMeta(options.dayKey) : undefined
  const dateLabel = indonesianDate(meta?.date)

  // One block per restaurant, so "All restaurants" still yields something you
  // can send vendor by vendor.
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
    // dish+add-ons combination -> the people who ordered it
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
      // Biggest batches first: that is the order a kitchen wants to cook in.
      .sort((a, b) => b.portions - a.portions || a.title.localeCompare(b.title))
      .map((group) => {
        const lines = group.lines.map((line, i) => {
          const qty = line.quantity > 1 ? ` ×${line.quantity}` : ''
          const note = line.note ? ` (${line.note})` : ''
          return `${i + 1}. ${line.name}${qty}${note}`
        })
        return `${group.title} (${group.portions} item)\n${lines.join('\n')}`
      })

    // Blank line between each dish group, as in the pasted-message format.
    blocks.push([header, '', sections.join('\n\n')].join('\n').trimEnd())
  }

  // Blank line between restaurants so each block can be sent on its own.
  return blocks.join('\n\n———\n\n')
}

/** Tab-separated text, which pastes into Excel and Google Sheets as cells. */
export function rowsToTsv(rows: (string | number)[][]): string {
  return rows
    // A literal tab or newline inside a cell would break the column alignment.
    .map((row) => row.map((cell) => String(cell).replace(/[\t\r\n]+/g, ' ')).join('\t'))
    .join('\n')
}

/**
 * Whether ordering is still allowed for a day. Mirrored server-side in
 * POST /api/lunch/orders — this copy only decides what the UI greys out.
 */
export function isDayOrderable(
  day: LunchDay | undefined,
  now: Date = new Date()
): boolean {
  if (!day || !day.isOpen) return false
  if (!day.orderDeadline) return true
  return now.getTime() < new Date(day.orderDeadline).getTime()
}
