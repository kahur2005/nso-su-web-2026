// app/admin/lunch/page.tsx
// The review queue. Committee opens this, reads each student's payment
// screenshot against the order total, and approves or rejects.
//
// Defaults to the 'awaiting_approval' filter, because that is the only status
// that needs anyone to do anything — the other three are history.
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminOrders } from '@/lib/lunch-data'
import {
  LUNCH_DAYS,
  LUNCH_STATUS_LABEL,
  formatRupiah,
  lunchDayMeta,
  type LunchOrderStatus,
} from '@/lib/lunch'
import LunchTabs from './LunchTabs'
import { approveLunchOrder, rejectLunchOrder } from './actions'
import { formatJakartaDateTime } from '@/lib/time'

const STATUSES: LunchOrderStatus[] = [
  'awaiting_approval',
  'pending_payment',
  'approved',
  'rejected',
]

const STATUS_STYLE: Record<LunchOrderStatus, string> = {
  pending_payment: 'bg-slate-100 text-slate-600',
  awaiting_approval: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
}

function formatDateTime(iso: string) {
  return formatJakartaDateTime(iso, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminLunchPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; day?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const { status: statusParam, day: dayParam } = await searchParams
  const status = STATUSES.includes(statusParam as LunchOrderStatus)
    ? statusParam
    : statusParam === 'all'
      ? undefined
      : 'awaiting_approval'
  const dayKey = LUNCH_DAYS.some((d) => d.key === dayParam) ? dayParam : undefined

  const orders = await getAdminOrders({ status, dayKey })

  const filterHref = (next: { status?: string; day?: string }) => {
    const params = new URLSearchParams()
    const s = next.status ?? status ?? 'all'
    const d = next.day ?? dayKey
    if (s) params.set('status', s)
    if (d) params.set('day', d)
    const query = params.toString()
    return query ? `/admin/lunch?${query}` : '/admin/lunch'
  }

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
          Orders students placed at <span className="font-mono">/lunch</span>.
          Check the payment screenshot against the total, then approve — the
          student&apos;s receipt updates immediately.
        </p>
      </div>

      <LunchTabs />

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Status</span>
          <Link href={filterHref({ status: 'all' })} className={chip(!status)}>
            All
          </Link>
          {STATUSES.map((s) => (
            <Link key={s} href={filterHref({ status: s })} className={chip(status === s)}>
              {LUNCH_STATUS_LABEL[s]}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Day</span>
          <Link href={filterHref({ day: '' })} className={chip(!dayKey)}>
            All
          </Link>
          {LUNCH_DAYS.map((d) => (
            <Link key={d.key} href={filterHref({ day: d.key })} className={chip(dayKey === d.key)}>
              {d.headerTitle}
            </Link>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
          No orders match this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <section
              key={order.id}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-medium text-slate-900">
                      {order.student?.name ?? 'Unknown student'}
                    </h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[order.status]}`}
                    >
                      {LUNCH_STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    <span className="font-mono">{order.orderCode}</span>
                    {order.student?.studentId ? ` · ${order.student.studentId}` : ''}
                    {' · '}
                    {lunchDayMeta(order.dayKey)?.headerTitle ?? `Day ${order.dayKey}`}
                    {' · '}
                    {order.restaurantName}
                    {' · placed '}
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold text-slate-900">
                    {formatRupiah(order.subtotal)}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                {/* Itemised lines */}
                <ul className="space-y-1 text-sm text-slate-700">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      <div className="flex justify-between gap-4">
                        <span>
                          {item.quantity}x {item.nameSnapshot}
                        </span>
                        <span className="tabular-nums text-slate-500">
                          {formatRupiah(item.lineTotal)}
                        </span>
                      </div>
                      {item.addOns.length > 0 && (
                        <div className="pl-4 text-xs text-slate-500">
                          {item.addOns
                            .map((a) => `+ ${a.nameSnapshot} (${formatRupiah(a.price)})`)
                            .join(', ')}
                        </div>
                      )}
                    </li>
                  ))}
                  {order.note && (
                    <li className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      <span className="font-medium">Note:</span> {order.note}
                    </li>
                  )}
                </ul>

                {/* Payment proof */}
                <div className="md:w-40">
                  {order.paymentProofUrl ? (
                    <a
                      href={order.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={order.paymentProofUrl}
                        alt={`Payment proof for ${order.orderCode}`}
                        className="h-40 w-full rounded-md border border-slate-200 object-cover"
                      />
                      <span className="mt-1 block text-xs text-slate-500 underline">
                        Open full size
                      </span>
                    </a>
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-slate-200 px-2 text-center text-xs text-slate-400">
                      No proof uploaded yet
                    </div>
                  )}
                </div>
              </div>

              {order.status === 'rejected' && order.rejectionReason && (
                <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  Rejected: {order.rejectionReason}
                </p>
              )}

              {order.status === 'awaiting_approval' && (
                <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-200 pt-4">
                  <form action={approveLunchOrder}>
                    <input type="hidden" name="id" value={order.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                  </form>

                  <form action={rejectLunchOrder} className="flex flex-1 items-end gap-2">
                    <input type="hidden" name="id" value={order.id} />
                    <div className="min-w-[200px] flex-1">
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Reason (shown to the student)
                      </label>
                      <input
                        name="rejectionReason"
                        placeholder="Amount doesn't match / screenshot unreadable"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
