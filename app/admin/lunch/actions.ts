'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/lib/storage'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isLunchDayKey } from '@/lib/lunch'
import { isValidQrisPayload, normalizeQrisPayload } from '@/lib/qris'
import { resolveStudentDbId } from '@/lib/lunch-data'
import { jakartaLocalInputToIso } from '@/lib/time'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    throw new Error('Unauthorized')
  }
  return session
}

function revalidate() {
  revalidatePath('/admin/lunch')
  revalidatePath('/admin/lunch/menu')
  revalidatePath('/admin/lunch/settings')
  revalidatePath('/lunch')
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) || '').trim()
}

/** Parse numeric price in Rupiah. Return 0 if invalid. */
function money(formData: FormData, key: string): number {
  const n = parseInt(text(formData, key).replace(/\D/g, ''), 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function int(formData: FormData, key: string, fallback = 0): number {
  const n = parseInt(text(formData, key), 10)
  return Number.isFinite(n) ? n : fallback
}

function checked(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on' || formData.get(key) === 'true'
}

export async function createRestaurant(formData: FormData) {
  await requireAdmin()

  const name = text(formData, 'name')
  if (!name) return

  const image = formData.get('image')
  const imageUrl = image instanceof File ? await uploadImage('lunch-restaurants', image) : null

  const { error } = await supabase.from('LunchRestaurant').insert({
    name,
    description: text(formData, 'description') || null,
    imageUrl,
    sortOrder: int(formData, 'sortOrder'),
    isActive: true,
  })
  if (error) console.error('createRestaurant:', error)

  revalidate()
}

export async function updateRestaurant(formData: FormData) {
  await requireAdmin()

  const id = text(formData, 'id')
  const name = text(formData, 'name')
  if (!id || !name) return

  const payload: Record<string, unknown> = {
    name,
    description: text(formData, 'description') || null,
    sortOrder: int(formData, 'sortOrder'),
    isActive: checked(formData, 'isActive'),
  }

  const image = formData.get('image')
  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadImage('lunch-restaurants', image)
    if (uploaded) payload.imageUrl = uploaded
  }

  const { error } = await supabase.from('LunchRestaurant').update(payload).eq('id', id)
  if (error) console.error('updateRestaurant:', error)

  revalidate()
}

/** Soft delete restaurant by ID. */
export async function deleteRestaurant(formData: FormData) {
  await requireAdmin()

  const id = text(formData, 'id')
  if (!id) return

  const { error } = await supabase
    .from('LunchRestaurant')
    .update({ isDeleted: true, isActive: false })
    .eq('id', id)
  if (error) console.error('deleteRestaurant:', error)

  revalidate()
}

export async function createMenuItem(formData: FormData) {
  await requireAdmin()

  const restaurantId = text(formData, 'restaurantId')
  const name = text(formData, 'name')
  if (!restaurantId || !name) return

  const image = formData.get('image')
  const imageUrl = image instanceof File ? await uploadImage('lunch-items', image) : null

  const { error } = await supabase.from('LunchMenuItem').insert({
    restaurantId,
    name,
    description: text(formData, 'description') || null,
    price: money(formData, 'price'),
    imageUrl,
    sortOrder: int(formData, 'sortOrder'),
    isActive: true,
  })
  if (error) console.error('createMenuItem:', error)

  revalidate()
}

export async function updateMenuItem(formData: FormData) {
  await requireAdmin()

  const id = text(formData, 'id')
  const name = text(formData, 'name')
  if (!id || !name) return

  const payload: Record<string, unknown> = {
    name,
    description: text(formData, 'description') || null,
    price: money(formData, 'price'),
    sortOrder: int(formData, 'sortOrder'),
    isActive: checked(formData, 'isActive'),
  }

  const image = formData.get('image')
  if (image instanceof File && image.size > 0) {
    const uploaded = await uploadImage('lunch-items', image)
    if (uploaded) payload.imageUrl = uploaded
  }

  const { error } = await supabase.from('LunchMenuItem').update(payload).eq('id', id)
  if (error) console.error('updateMenuItem:', error)

  revalidate()
}

export async function deleteMenuItem(formData: FormData) {
  await requireAdmin()

  const id = text(formData, 'id')
  if (!id) return

  const { error } = await supabase
    .from('LunchMenuItem')
    .update({ isDeleted: true, isActive: false })
    .eq('id', id)
  if (error) console.error('deleteMenuItem:', error)

  revalidate()
}

export async function createAddOn(formData: FormData) {
  await requireAdmin()

  const menuItemId = text(formData, 'menuItemId')
  const name = text(formData, 'name')
  if (!menuItemId || !name) return

  const { error } = await supabase.from('LunchAddOn').insert({
    menuItemId,
    name,
    price: money(formData, 'price'),
    sortOrder: int(formData, 'sortOrder'),
    isActive: true,
  })
  if (error) console.error('createAddOn:', error)

  revalidate()
}

export async function updateAddOn(formData: FormData) {
  await requireAdmin()

  const id = text(formData, 'id')
  const name = text(formData, 'name')
  if (!id || !name) return

  const { error } = await supabase
    .from('LunchAddOn')
    .update({
      name,
      price: money(formData, 'price'),
      sortOrder: int(formData, 'sortOrder'),
      isActive: checked(formData, 'isActive'),
    })
    .eq('id', id)
  if (error) console.error('updateAddOn:', error)

  revalidate()
}

/** Delete add-on item by ID. */
export async function deleteAddOn(formData: FormData) {
  await requireAdmin()

  const id = text(formData, 'id')
  if (!id) return

  const { error } = await supabase.from('LunchAddOn').delete().eq('id', id)
  if (error) console.error('deleteAddOn:', error)

  revalidate()
}

export async function updateLunchSettings(formData: FormData) {
  await requireAdmin()

  const qrisStatic = normalizeQrisPayload(String(formData.get('qrisStatic') || ''))

  if (qrisStatic && !isValidQrisPayload(qrisStatic)) {
    redirect('/admin/lunch/settings?qris=invalid')
  }

  const { error } = await supabase
    .from('LunchSetting')
    .update({ qrisStatic, updatedAt: new Date().toISOString() })
    .eq('id', 'default')
  if (error) console.error('updateLunchSettings:', error)

  revalidate()
  redirect('/admin/lunch/settings?qris=saved')
}

export async function updateLunchDay(formData: FormData) {
  await requireAdmin()

  const dayKey = text(formData, 'dayKey')
  if (!isLunchDayKey(dayKey)) return

  const deadlineRaw = text(formData, 'orderDeadline')

  const { error } = await supabase.from('LunchDay').upsert(
    {
      dayKey,
      isOpen: checked(formData, 'isOpen'),
      orderDeadline: deadlineRaw ? jakartaLocalInputToIso(deadlineRaw) : null,
    },
    { onConflict: 'dayKey' }
  )
  if (error) console.error('updateLunchDay:', error)

  revalidate()
}

/** Approve or reject a submitted order. */
async function reviewOrder(
  formData: FormData,
  status: 'approved' | 'rejected',
  rejectionReason: string | null
) {
  const session = await requireAdmin()

  const id = text(formData, 'id')
  if (!id) return

  const reviewedBy = await resolveStudentDbId(session)

  const { error } = await supabase
    .from('LunchOrder')
    .update({
      status,
      rejectionReason,
      reviewedAt: new Date().toISOString(),
      reviewedBy,
    })
    .eq('id', id)
    .eq('status', 'awaiting_approval')
  if (error) console.error('reviewOrder:', error)

  revalidate()
}

export async function approveLunchOrder(formData: FormData) {
  await reviewOrder(formData, 'approved', null)
}

export async function rejectLunchOrder(formData: FormData) {
  await reviewOrder(formData, 'rejected', text(formData, 'rejectionReason') || null)
}
