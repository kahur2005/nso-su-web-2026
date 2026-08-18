import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminOrders } from '@/lib/lunch-data'
import {
  LUNCH_DAYS,
  LUNCH_RECAP_SCOPES,
  buildLunchRecap,
  formatRupiah,
  isLunchRecapScope,
  lunchDayMeta,
  type RecapTextOrder,
} from '@/lib/lunch'
import LunchTabs from '../LunchTabs'
import RecapActions from './RecapActions'

export default async function AdminLunchRecapPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; scope?: string; restaurant?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const {
    day: dayParam,
    scope: scopeParam,
    restaurant: restaurantParam,
  } = await searchParams

  const dayKey = LUNCH_DAYS.find((d) => d.key === dayParam)?.key ?? LUNCH_DAYS[0].key
  const scope = scopeParam && isLunchRecapScope(scopeParam) ? scopeParam : 'paid'

  const orders = await getAdminOrders({
    statuses: [...LUNCH_RECAP_SCOPES[scope].statuses],
    dayKey,
  })

  // List only restaurants with active orders.
  const restaurantNames = [...new Set(orders.map((o) => o.restaurantName))].sort()
  const restaurant =
    restaurantParam && restaurantNames.includes(restaurantParam)
      ? restaurantParam
      : undefined

  const scopedOrders = restaurant
    ? orders.filter((o) => o.restaurantName === restaurant)
    : orders
  const recap = buildLunchRecap(scopedOrders)

  // Serialized data for the client.
  const recapTextOrders: RecapTextOrder[] = scopedOrders.map((o) => ({
    id: o.id,
    restaurantName: o.restaurantName,
    studentName: o.student?.name ?? 'Unknown student',
    note: o.note ?? null,
    items: o.items.map((i) => ({
      nameSnapshot: i.nameSnapshot,
      quantity: i.quantity,
      addOns: i.addOns.map((a) => ({ nameSnapshot: a.nameSnapshot })),
    })),
  }))

  const queryFor = (next: { day?: string; scope?: string; restaurant?: string }) => {
    const params = new URLSearchParams()
    const d = next.day !== undefined ? next.day : dayKey
    const s = next.scope ?? scope
    const r = next.restaurant !== undefined ? next.restaurant : restaurant
    if (d) params.set('day', d)
    if (s !== 'paid') params.set('scope', s)
    if (r) params.set('restaurant', r)
    return params
  }

  const filterHref = (next: { day?: string; scope?: string; restaurant?: string }) => {
    const query = queryFor(next).toString()
    return query ? `/admin/lunch/recap?${query}` : '/admin/lunch/recap'
  }

  const downloadQuery = queryFor({})
  downloadQuery.set('scope', scope)
  const downloadHref = `/api/lunch/recap?${downloadQuery.toString()}`

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? 'border-slate-900 bg-slate-900 text-white'
        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
    }`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Lunch</h1>
        <p className="mt-1 text-sm text-slate-500">
          What each restaurant needs to cook, and what they are owed. Read this
          straight down the page when you place the order with a vendor.
        </p>
      </div>

      <LunchTabs />

      <RecapActions
        orders={recapTextOrders}
        dayKey={dayKey}
        downloadHref={downloadHref}
      />

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Day</span>
          <Link href={filterHref({ day: '' })} className={chip(!dayKey)}>
            All days
          </Link>
          {LUNCH_DAYS.map((d) => (
            <Link key={d.key} href={filterHref({ day: d.key })} className={chip(dayKey === d.key)}>
              {d.headerTitle}
            </Link>
          ))}
        </div>

        {restaurantNames.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Restaurant</span>
            <Link href={filterHref({ restaurant: '' })} className={chip(!restaurant)}>
              All restaurants
            </Link>
            {restaurantNames.map((name) => (
              <Link
                key={name}
                href={filterHref({ restaurant: name })}
                className={chip(restaurant === name)}
              >
                {name}
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Count</span>
          {(Object.keys(LUNCH_RECAP_SCOPES) as (keyof typeof LUNCH_RECAP_SCOPES)[]).map(
            (key) => (
              <Link key={key} href={filterHref({ scope: key })} className={chip(scope === key)}>
                {LUNCH_RECAP_SCOPES[key].label}
              </Link>
            )
          )}
        </div>
        <p className="text-xs text-slate-500">{LUNCH_RECAP_SCOPES[scope].hint}</p>
      </div>

      {/* Headline */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Restaurants', value: String(recap.restaurants.length) },
          { label: 'Orders', value: String(recap.orderCount) },
          {
            label: 'Dishes',
            value: String(recap.restaurants.reduce((n, r) => n + r.itemCount, 0)),
          },
          { label: 'Total', value: formatRupiah(recap.grandTotal) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="min-w-[120px] flex-1 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="text-xs font-medium text-slate-500">{stat.label}</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {recap.restaurants.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
          No orders match this filter yet.
        </div>
      ) : (
        recap.restaurants.map((restaurant) => (
          <section
            key={restaurant.restaurantName}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {restaurant.restaurantName}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {restaurant.orderCount} order
                  {restaurant.orderCount === 1 ? '' : 's'} ·{' '}
                  {restaurant.itemCount} dish
                  {restaurant.itemCount === 1 ? '' : 'es'}
                  {dayKey
                    ? ` · ${lunchDayMeta(dayKey)?.headerTitle ?? `Day ${dayKey}`}`
                    : ' · all days'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-slate-500">Owed to vendor</div>
                <div className="text-lg font-semibold text-slate-900">
                  {formatRupiah(restaurant.total)}
                </div>
              </div>
            </div>

            {/* Wide content scrolls inside its own container so the page body
                never scrolls sideways on a narrow screen. */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                    <th className="px-5 py-2">Menu item</th>
                    <th className="px-3 py-2 text-right">Unit price</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-5 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurant.items.map((item) => (
                    <tr
                      key={`${item.name}@${item.unitPrice}`}
                      className="border-b border-slate-100 align-top last:border-0"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">{item.name}</div>
                        {item.addOns.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {item.addOns.map((addOn) => (
                              <li key={`${addOn.name}@${addOn.price}`} className="text-xs text-slate-500">
                                + {addOn.name} — {addOn.quantity}x @{' '}
                                {formatRupiah(addOn.price)} ={' '}
                                {formatRupiah(addOn.total)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                        {formatRupiah(item.unitPrice)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-900">
                        {formatRupiah(item.grandTotal)}
                        {item.addOns.length > 0 && (
                          <div className="text-xs font-normal text-slate-400">
                            {formatRupiah(item.total)} + add-ons
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td className="px-5 py-3 text-sm font-medium text-slate-900" colSpan={2}>
                      Total
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-slate-900">
                      {restaurant.itemCount}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-slate-900">
                      {formatRupiah(restaurant.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  )
}
