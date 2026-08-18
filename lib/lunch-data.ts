import { supabase } from '@/lib/supabase'
import {
  LUNCH_DAY_KEYS,
  type LunchDay,
  type LunchMenuItem,
  type LunchOrder,
  type LunchOrderItem,
  type LunchRestaurant,
} from '@/lib/lunch'

/** Resolve next-auth session user to student database identifier. */
export async function resolveStudentDbId(session: any): Promise<string | null> {
  const user = session?.user
  if (!user) return null

  if (user.id) {
    const { data } = await supabase
      .from('Student')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
    if (data?.id) return data.id
  }

  if (user.studentId) {
    const { data } = await supabase
      .from('Student')
      .select('id')
      .eq('studentId', user.studentId)
      .maybeSingle()
    if (data?.id) return data.id
  }

  return null
}

/** Get all lunch days with configuration status. */
export async function getLunchDays(): Promise<LunchDay[]> {
  const { data, error } = await supabase
    .from('LunchDay')
    .select('dayKey, isOpen, orderDeadline')

  if (error) console.error('getLunchDays:', error)

  const byKey = new Map((data ?? []).map((d) => [d.dayKey, d]))
  return LUNCH_DAY_KEYS.map((key) => ({
    dayKey: key,
    isOpen: byKey.get(key)?.isOpen ?? false,
    orderDeadline: byKey.get(key)?.orderDeadline ?? null,
  }))
}

export async function getLunchDay(dayKey: string): Promise<LunchDay | null> {
  const { data, error } = await supabase
    .from('LunchDay')
    .select('dayKey, isOpen, orderDeadline')
    .eq('dayKey', dayKey)
    .maybeSingle()

  if (error) console.error('getLunchDay:', error)
  if (!data) return null
  return {
    dayKey: data.dayKey,
    isOpen: data.isOpen,
    orderDeadline: data.orderDeadline ?? null,
  }
}

/** Get static QRIS payload from lunch settings. */
export async function getQrisStatic(): Promise<string> {
  const { data, error } = await supabase
    .from('LunchSetting')
    .select('qrisStatic')
    .eq('id', 'default')
    .maybeSingle()

  if (error) console.error('getQrisStatic:', error)
  return (data?.qrisStatic ?? '').trim()
}

/** Get available restaurants. Set includeHidden to true to include inactive rows. */
export async function getRestaurants(
  includeHidden = false
): Promise<LunchRestaurant[]> {
  let query = supabase
    .from('LunchRestaurant')
    .select('id, name, description, imageUrl, sortOrder, isActive')
    .eq('isDeleted', false)
    .order('sortOrder', { ascending: true })
    .order('name', { ascending: true })

  if (!includeHidden) query = query.eq('isActive', true)

  const { data, error } = await query
  if (error) console.error('getRestaurants:', error)

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    imageUrl: r.imageUrl ?? null,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
  }))
}

/** Get restaurant details with menu items and add-ons. */
export async function getRestaurantMenu(
  restaurantId: string,
  includeHidden = false
): Promise<LunchRestaurant | null> {
  const { data: restaurant, error: restaurantError } = await supabase
    .from('LunchRestaurant')
    .select('id, name, description, imageUrl, sortOrder, isActive')
    .eq('id', restaurantId)
    .eq('isDeleted', false)
    .maybeSingle()

  if (restaurantError) console.error('getRestaurantMenu restaurant:', restaurantError)
  if (!restaurant) return null
  if (!includeHidden && !restaurant.isActive) return null

  let itemQuery = supabase
    .from('LunchMenuItem')
    .select('id, restaurantId, name, description, price, imageUrl, sortOrder, isActive')
    .eq('restaurantId', restaurantId)
    .eq('isDeleted', false)
    .order('sortOrder', { ascending: true })
    .order('name', { ascending: true })

  if (!includeHidden) itemQuery = itemQuery.eq('isActive', true)

  const { data: items, error: itemError } = await itemQuery
  if (itemError) console.error('getRestaurantMenu items:', itemError)

  const itemIds = (items ?? []).map((i) => i.id)

  let addOns: { id: string; menuItemId: string; name: string; price: number; sortOrder: number; isActive: boolean }[] = []
  if (itemIds.length > 0) {
    let addOnQuery = supabase
      .from('LunchAddOn')
      .select('id, menuItemId, name, price, sortOrder, isActive')
      .in('menuItemId', itemIds)
      .order('sortOrder', { ascending: true })

    if (!includeHidden) addOnQuery = addOnQuery.eq('isActive', true)

    const { data, error } = await addOnQuery
    if (error) console.error('getRestaurantMenu addOns:', error)
    addOns = data ?? []
  }

  const byItem = new Map<string, LunchMenuItem['addOns']>()
  for (const a of addOns) {
    const list = byItem.get(a.menuItemId) ?? []
    list.push({
      id: a.id,
      name: a.name,
      price: a.price,
      sortOrder: a.sortOrder,
      isActive: a.isActive,
    })
    byItem.set(a.menuItemId, list)
  }

  return {
    id: restaurant.id,
    name: restaurant.name,
    description: restaurant.description ?? null,
    imageUrl: restaurant.imageUrl ?? null,
    sortOrder: restaurant.sortOrder,
    isActive: restaurant.isActive,
    menuItems: (items ?? []).map((i) => ({
      id: i.id,
      restaurantId: i.restaurantId,
      name: i.name,
      description: i.description ?? null,
      price: i.price,
      imageUrl: i.imageUrl ?? null,
      sortOrder: i.sortOrder,
      isActive: i.isActive,
      addOns: byItem.get(i.id) ?? [],
    })),
  }
}

/** Get all restaurants with full menus for admin management. */
export async function getFullMenu(): Promise<LunchRestaurant[]> {
  const restaurants = await getRestaurants(true)
  const withMenus = await Promise.all(
    restaurants.map((r) => getRestaurantMenu(r.id, true))
  )
  return withMenus.filter((r): r is LunchRestaurant => r !== null)
}

const ORDER_COLUMNS =
  'id, orderCode, studentId, dayKey, restaurantId, restaurantName, subtotal, status, qrisPayload, paymentProofUrl, rejectionReason, note, createdAt, submittedAt, reviewedAt, reviewedBy'

/** Attach items and add-ons to order records. */
async function attachItems(
  orders: Omit<LunchOrder, 'items'>[]
): Promise<LunchOrder[]> {
  if (orders.length === 0) return []

  const { data: items, error: itemError } = await supabase
    .from('LunchOrderItem')
    .select('id, orderId, menuItemId, nameSnapshot, unitPrice, quantity, lineTotal')
    .in('orderId', orders.map((o) => o.id))

  if (itemError) console.error('attachItems items:', itemError)

  const itemRows = items ?? []
  let addOnRows: { id: string; orderItemId: string; nameSnapshot: string; price: number }[] = []

  if (itemRows.length > 0) {
    const { data, error } = await supabase
      .from('LunchOrderItemAddOn')
      .select('id, orderItemId, nameSnapshot, price')
      .in('orderItemId', itemRows.map((i) => i.id))

    if (error) console.error('attachItems addOns:', error)
    addOnRows = data ?? []
  }

  const addOnsByItem = new Map<string, LunchOrderItem['addOns']>()
  for (const a of addOnRows) {
    const list = addOnsByItem.get(a.orderItemId) ?? []
    list.push({ id: a.id, nameSnapshot: a.nameSnapshot, price: a.price })
    addOnsByItem.set(a.orderItemId, list)
  }

  const itemsByOrder = new Map<string, LunchOrderItem[]>()
  for (const i of itemRows) {
    const list = itemsByOrder.get(i.orderId) ?? []
    list.push({
      id: i.id,
      menuItemId: i.menuItemId ?? null,
      nameSnapshot: i.nameSnapshot,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
      addOns: addOnsByItem.get(i.id) ?? [],
    })
    itemsByOrder.set(i.orderId, list)
  }

  return orders.map((o) => ({ ...o, items: itemsByOrder.get(o.id) ?? [] }))
}

/** Get order history for a student sorted by creation date descending. */
export async function getStudentOrders(studentDbId: string): Promise<LunchOrder[]> {
  const { data, error } = await supabase
    .from('LunchOrder')
    .select(ORDER_COLUMNS)
    .eq('studentId', studentDbId)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('getStudentOrders:', error)
    return []
  }
  return attachItems((data ?? []) as Omit<LunchOrder, 'items'>[])
}

export async function getOrder(orderId: string): Promise<LunchOrder | null> {
  const { data, error } = await supabase
    .from('LunchOrder')
    .select(ORDER_COLUMNS)
    .eq('id', orderId)
    .maybeSingle()

  if (error) console.error('getOrder:', error)
  if (!data) return null

  const [withItems] = await attachItems([data as Omit<LunchOrder, 'items'>])
  return withItems ?? null
}

export interface AdminLunchOrder extends LunchOrder {
  student: { name: string; studentId: string; email: string } | null
}

/** Get orders for admin management with optional filters. */
export async function getAdminOrders(filters: {
  status?: string
  statuses?: string[]
  dayKey?: string
} = {}): Promise<AdminLunchOrder[]> {
  let query = supabase
    .from('LunchOrder')
    .select(`${ORDER_COLUMNS}, student:Student(name, studentId, email)`)
    .order('createdAt', { ascending: false })

  if (filters.statuses?.length) query = query.in('status', filters.statuses)
  else if (filters.status) query = query.eq('status', filters.status)
  if (filters.dayKey) query = query.eq('dayKey', filters.dayKey)

  const { data, error } = await query
  if (error) {
    console.error('getAdminOrders:', error)
    return []
  }

  const rows = (data ?? []) as any[]
  const withItems = await attachItems(
    rows.map(({ student, ...o }) => o) as Omit<LunchOrder, 'items'>[]
  )

  return withItems.map((o, i) => ({ ...o, student: rows[i].student ?? null }))
}
