// app/(game)/lunch/[dayKey]/page.tsx
// Pick a restaurant for the chosen day.
//
// Every restaurant is available on every open day — there is no per-day
// restaurant roster, because committee books the same vendors for the week.
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LunchShell from '@/components/lunch/LunchShell'
import Parchment, { Chevron } from '@/components/lunch/Parchment'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  isDayOrderable,
  isLunchDayKey,
  lunchDayMeta,
  type LunchDay,
  type LunchRestaurant,
} from '@/lib/lunch'

export default function LunchDayPage() {
  const params = useParams<{ dayKey: string }>()
  const router = useRouter()
  const dayKey = String(params?.dayKey ?? '')

  const [restaurants, setRestaurants] = useState<LunchRestaurant[]>([])
  const [day, setDay] = useState<LunchDay | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLunchDayKey(dayKey)) {
      router.replace('/lunch')
      return
    }
    fetch('/api/lunch/menu')
      .then((r) => r.json())
      .then((d) => {
        setRestaurants(d.restaurants ?? [])
        setDay((d.days ?? []).find((x: LunchDay) => x.dayKey === dayKey))
      })
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false))
  }, [dayKey, router])

  const meta = lunchDayMeta(dayKey)
  const open = isDayOrderable(day)

  return (
    <LunchShell
      title={meta?.headerTitle ?? 'Lunch'}
      subtitle={meta ? `${meta.date} · choose one restaurant` : undefined}
    >
      {loading ? (
        <div className="py-12">
          <LoadingSpinner text="LOADING RESTAURANTS..." />
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
            Pick another day
          </Link>
        </Parchment>
      ) : restaurants.length === 0 ? (
        <p
          className="py-10 text-center font-bytebounce text-[22px] text-white"
          style={{ textShadow: '2px 2px 0 #3e2723' }}
        >
          No restaurants have been added yet. Check back soon!
        </p>
      ) : (
        <div className="mt-3.5 space-y-3.5">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              href={`/lunch/${dayKey}/${restaurant.id}`}
              className="block"
            >
              <Parchment as="article" className="px-5 py-3">
                <div className="flex items-center gap-3">
                  {restaurant.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={restaurant.imageUrl}
                      alt=""
                      className="h-[52px] w-[52px] shrink-0 rounded border-2 border-[#5d4037] object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bytebounce text-[26px] uppercase leading-none text-[#3e2723]">
                      {restaurant.name}
                    </h2>
                    {restaurant.description && (
                      <p className="mt-1.5 font-bytebounce text-[22px] leading-tight text-[#6d4c41]">
                        {restaurant.description}
                      </p>
                    )}
                  </div>
                  <Chevron />
                </div>
              </Parchment>
            </Link>
          ))}
        </div>
      )}
    </LunchShell>
  )
}
