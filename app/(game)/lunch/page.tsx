// app/(game)/lunch/page.tsx
// The lunch landing screen: what you have already ordered, then which day you
// want to order for.
//
// History comes first on purpose. Most visits after the first are a student
// checking whether their payment went through, not starting a new order.
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import LunchShell from '@/components/lunch/LunchShell'
import Parchment, { Chevron } from '@/components/lunch/Parchment'
import LunchStatusChip from '@/components/lunch/LunchStatusChip'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  LUNCH_DAYS,
  formatRupiah,
  isDayOrderable,
  lunchDayMeta,
  type LunchDay,
  type LunchOrder,
} from '@/lib/lunch'

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function LunchPage() {
  const [days, setDays] = useState<LunchDay[]>([])
  const [orders, setOrders] = useState<LunchOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/lunch/menu').then((r) => r.json()),
      fetch('/api/lunch/orders').then((r) => r.json()),
    ])
      .then(([menu, orderData]) => {
        setDays(menu.days ?? [])
        setOrders(orderData.orders ?? [])
      })
      .catch(() => {
        setDays([])
        setOrders([])
      })
      .finally(() => setLoading(false))
  }, [])

  const unpaid = orders.filter((o) => o.status === 'pending_payment')

  return (
    <LunchShell
      title="Lunch"
      subtitle="Pre-order your meal, pay by QRIS, and pick it up on the day."
      backHref="/dashboard"
    >
      {loading ? (
        <div className="py-12">
          <LoadingSpinner text="LOADING LUNCH..." />
        </div>
      ) : (
        <>
          {/* Nudge for anything left mid-payment */}
          {unpaid.length > 0 && (
            <Parchment className="mt-3.5 px-5 py-3">
              <p className="font-bytebounce text-[18px] leading-tight text-[#8c2d1a]">
                You have {unpaid.length} order{unpaid.length === 1 ? '' : 's'}{' '}
                waiting to be paid.
              </p>
            </Parchment>
          )}

          {/* ------------------------------------------------ history ---- */}
          <h2
            className="mt-5 px-1 font-bytebounce text-[23px] uppercase leading-none text-white"
            style={{ textShadow: '2px 2px 0 #3e2723' }}
          >
            Your orders
          </h2>

          {orders.length === 0 ? (
            <p
              className="py-5 text-center font-bytebounce text-[17px] text-white"
              style={{ textShadow: '2px 2px 0 #3e2723' }}
            >
              Nothing ordered yet — pick a day below to start.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {orders.map((order) => (
                <Link key={order.id} href={`/lunch/order/${order.id}`} className="block">
                  <Parchment as="article" className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bytebounce text-[21px] uppercase leading-none text-[#3e2723]">
                            {order.restaurantName}
                          </h3>
                          <LunchStatusChip status={order.status} />
                        </div>
                        <p className="mt-1.5 font-bytebounce text-[16px] leading-tight text-[#6d4c41]">
                          {lunchDayMeta(order.dayKey)?.headerTitle ??
                            `Day ${order.dayKey}`}{' '}
                          · {order.items.length} item
                          {order.items.length === 1 ? '' : 's'} ·{' '}
                          <span className="font-mono text-[14px]">
                            {order.orderCode}
                          </span>
                        </p>
                        <p className="mt-1 font-bytebounce text-[20px] leading-none text-[#8a5a37]">
                          {formatRupiah(order.subtotal)}
                        </p>
                      </div>
                      <Chevron />
                    </div>
                  </Parchment>
                </Link>
              ))}
            </div>
          )}

          {/* --------------------------------------------- day picker ---- */}
          <h2
            className="mt-7 px-1 font-bytebounce text-[23px] uppercase leading-none text-white"
            style={{ textShadow: '2px 2px 0 #3e2723' }}
          >
            Order for a day
          </h2>

          <div className="mt-3 space-y-3">
            {LUNCH_DAYS.map((meta) => {
              const day = days.find((d) => d.dayKey === meta.key)
              const open = isDayOrderable(day)

              const body = (
                <Parchment as="article" className={`px-5 py-3 ${open ? '' : 'opacity-75'}`}>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bytebounce text-[23px] uppercase leading-none text-[#3e2723]">
                        {meta.headerTitle}
                      </h3>
                      <p className="mt-1.5 font-bytebounce text-[17px] leading-tight text-[#6d4c41]">
                        {meta.date}
                      </p>
                      <p className="mt-1 font-bytebounce text-[16px] leading-none text-[#a58962]">
                        {open
                          ? day?.orderDeadline
                            ? `Order before ${formatDeadline(day.orderDeadline)}`
                            : 'Open for orders'
                          : day?.isOpen && day?.orderDeadline
                            ? 'Ordering has closed'
                            : 'Not open yet'}
                      </p>
                    </div>
                    {open && <Chevron />}
                  </div>
                </Parchment>
              )

              return open ? (
                <Link key={meta.key} href={`/lunch/${meta.key}`} className="block">
                  {body}
                </Link>
              ) : (
                <div key={meta.key} aria-disabled>
                  {body}
                </div>
              )
            })}
          </div>
        </>
      )}
    </LunchShell>
  )
}
