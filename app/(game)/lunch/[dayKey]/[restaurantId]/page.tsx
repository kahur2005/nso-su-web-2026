'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LunchShell from '@/components/lunch/LunchShell'
import Parchment from '@/components/lunch/Parchment'
import MenuItemSheet from '@/components/lunch/MenuItemSheet'
import CartBar from '@/components/lunch/CartBar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useLunchCart } from '@/lib/stores/lunchCart'
import {
  formatRupiah,
  isDayOrderable,
  isLunchDayKey,
  lunchDayMeta,
  type LunchDay,
  type LunchMenuItem,
  type LunchRestaurant,
} from '@/lib/lunch'

export default function LunchMenuPage() {
  const params = useParams<{ dayKey: string; restaurantId: string }>()
  const router = useRouter()
  const dayKey = String(params?.dayKey ?? '')
  const restaurantId = String(params?.restaurantId ?? '')

  const [restaurant, setRestaurant] = useState<LunchRestaurant | null>(null)
  const [day, setDay] = useState<LunchDay | undefined>()
  const [loading, setLoading] = useState(true)
  const [openItem, setOpenItem] = useState<LunchMenuItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const {
    lines,
    addLine,
    reset,
    hasHydrated,
    dayKey: cartDayKey,
    restaurantId: cartRestaurantId,
  } = useLunchCart()

  useEffect(() => {
    if (!isLunchDayKey(dayKey) || !restaurantId) {
      router.replace('/lunch')
      return
    }
    fetch(`/api/lunch/menu?restaurantId=${encodeURIComponent(restaurantId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((d) => {
        setRestaurant(d.restaurant ?? null)
        setDay((d.days ?? []).find((x: LunchDay) => x.dayKey === dayKey))
      })
      .catch(() => {
        setRestaurant(null)
        setDay(undefined)
      })
      .finally(() => setLoading(false))
  }, [dayKey, restaurantId, router])

  const open = isDayOrderable(day)

  useEffect(() => {
    if (!hasHydrated || loading) return
    if (!open && cartDayKey === dayKey && lines.length > 0) {
      reset()
    }
  }, [hasHydrated, loading, open, cartDayKey, dayKey, lines.length, reset])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const handleAdd = (quantity: number, addOnIds: string[]) => {
    if (!openItem || !open) return

    const result = addLine(dayKey, restaurantId, openItem, quantity, addOnIds)

    if (result === 'conflict') {
      const ok = window.confirm(
        'Your cart has items from another restaurant or day. Start a new cart with this item?'
      )
      if (!ok) return
      reset()
      addLine(dayKey, restaurantId, openItem, quantity, addOnIds)
    }

    setToast(`${openItem.name} added to cart`)
    setOpenItem(null)
  }

  const meta = lunchDayMeta(dayKey)
  const cartLines =
    open && cartDayKey === dayKey && cartRestaurantId === restaurantId
      ? lines
      : []

  return (
    <LunchShell
      title={restaurant?.name ?? 'Menu'}
      subtitle={meta ? `${meta.headerTitle} · ${meta.date}` : undefined}
    >
      {loading ? (
        <div className="py-12">
          <LoadingSpinner text="LOADING MENU..." />
        </div>
      ) : !open ? (
        <Parchment className="mt-3.5 px-5 py-4">
          <p className="font-bytebounce text-[24px] leading-tight text-[#8c2d1a]">
            Ordering is closed for this day.
          </p>
          <Link
            href="/lunch"
            className="mt-2 inline-block font-bytebounce text-[22px] text-[#8a5a37] underline"
          >
            Back to lunch
          </Link>
        </Parchment>
      ) : !restaurant ? (
        <Parchment className="mt-3.5 px-5 py-4">
          <p className="font-bytebounce text-[24px] leading-tight text-[#8c2d1a]">
            That restaurant is not available.
          </p>
        </Parchment>
      ) : (restaurant.menuItems ?? []).length === 0 ? (
        <p
          className="py-10 text-center font-bytebounce text-[22px] text-white"
          style={{ textShadow: '2px 2px 0 #3e2723' }}
        >
          No dishes on this menu yet.
        </p>
      ) : (
        <div className="mt-3.5 space-y-3.5 pb-24">
          {(restaurant.menuItems ?? []).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpenItem(item)}
              className="block w-full text-left active:translate-y-0.5"
            >
              <Parchment as="article" className="px-5 py-3">
                <div className="flex items-center gap-3">
                  {item.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-[56px] w-[56px] shrink-0 rounded border-2 border-[#5d4037] object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bytebounce text-[24px] uppercase leading-none text-[#3e2723]">
                      {item.name}
                    </h2>
                    {item.description && (
                      <p className="mt-1.5 font-bytebounce text-[22px] leading-tight text-[#6d4c41]">
                        {item.description}
                      </p>
                    )}
                    {item.addOns.length > 0 && (
                      <p className="mt-1 font-bytebounce text-[20px] leading-none text-[#a58962]">
                        {item.addOns.length} add-on
                        {item.addOns.length === 1 ? '' : 's'} available
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-bytebounce text-[24px] leading-none text-[#8a5a37]">
                    {formatRupiah(item.price)}
                  </span>
                </div>
              </Parchment>
            </button>
          ))}
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-40 z-50 mx-auto w-fit max-w-[90%] border-2 border-black bg-[#3e2723] px-4 py-2 font-bytebounce text-[22px] text-white"
        >
          {toast}
        </div>
      )}

      <MenuItemSheet
        item={openItem}
        onClose={() => setOpenItem(null)}
        onAdd={handleAdd}
      />

      {hasHydrated && open && (
        <CartBar lines={cartLines} href={`/lunch/${dayKey}/cart`} />
      )}
    </LunchShell>
  )
}
