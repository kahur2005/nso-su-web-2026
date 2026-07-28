// app/(game)/lunch/[dayKey]/cart/page.tsx
// Review the cart, then pay.
//
// Pressing Pay is the first moment anything reaches the database: the cart is
// posted to /api/lunch/orders, which re-reads every price server-side and
// returns an order to pay for. The local cart is cleared only after that
// succeeds, so a failed request leaves the student's basket intact.
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import LunchShell from '@/components/lunch/LunchShell'
import Parchment from '@/components/lunch/Parchment'
import { useLunchCart } from '@/lib/stores/lunchCart'
import {
  cartLineTotal,
  cartSubtotal,
  formatRupiah,
  isLunchDayKey,
  lunchDayMeta,
} from '@/lib/lunch'

export default function LunchCartPage() {
  const params = useParams<{ dayKey: string }>()
  const router = useRouter()
  const dayKey = String(params?.dayKey ?? '')

  const {
    lines,
    setQuantity,
    removeLine,
    reset,
    hasHydrated,
    restaurantId,
    dayKey: cartDayKey,
  } = useLunchCart()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!isLunchDayKey(dayKey)) router.replace('/lunch')
  }, [dayKey, router])

  const meta = lunchDayMeta(dayKey)
  const subtotal = cartSubtotal(lines)
  const isThisDay = cartDayKey === dayKey

  const handlePay = async () => {
    if (submitting || lines.length === 0 || !restaurantId) return
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/lunch/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayKey,
          restaurantId,
          note: note.trim(),
          // Ids and quantities only. The server does not trust anything else.
          lines: lines.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
            addOnIds: l.addOns.map((a) => a.id),
          })),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? 'Could not place the order. Please try again.')
        return
      }

      reset()
      router.push(`/lunch/order/${data.orderId}`)
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <LunchShell
      title="Your cart"
      subtitle={meta ? `${meta.headerTitle} · ${meta.date}` : undefined}
      backHref={restaurantId ? `/lunch/${dayKey}/${restaurantId}` : `/lunch/${dayKey}`}
    >
      {!hasHydrated ? null : lines.length === 0 || !isThisDay ? (
        <Parchment className="mt-3.5 px-5 py-4">
          <p className="font-bytebounce text-[19px] leading-tight text-[#6d4c41]">
            Your cart is empty.
          </p>
          <Link
            href={`/lunch/${dayKey}`}
            className="mt-2 inline-block font-bytebounce text-[17px] text-[#8a5a37] underline"
          >
            Browse restaurants
          </Link>
        </Parchment>
      ) : (
        <>
          <div className="mt-3.5 space-y-3">
            {lines.map((line) => (
              <Parchment key={line.key} as="article" className="px-5 py-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bytebounce text-[21px] uppercase leading-none text-[#3e2723]">
                      {line.name}
                    </h2>
                    {line.addOns.length > 0 && (
                      <p className="mt-1.5 font-bytebounce text-[16px] leading-tight text-[#6d4c41]">
                        {line.addOns
                          .map((a) => `+ ${a.name} (${formatRupiah(a.price)})`)
                          .join(', ')}
                      </p>
                    )}
                    <p className="mt-1 font-bytebounce text-[19px] leading-none text-[#8a5a37]">
                      {formatRupiah(cartLineTotal(line))}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.key, line.quantity - 1)}
                        aria-label={`Decrease ${line.name}`}
                        className="h-8 w-8 border-2 border-[#5d4037] bg-[#f5e0aa] font-bytebounce text-[20px] leading-none text-[#3e2723] active:translate-y-0.5"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-bytebounce text-[20px] leading-none text-[#3e2723]">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.key, line.quantity + 1)}
                        aria-label={`Increase ${line.name}`}
                        className="h-8 w-8 border-2 border-[#5d4037] bg-[#f5e0aa] font-bytebounce text-[20px] leading-none text-[#3e2723] active:translate-y-0.5"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="font-bytebounce text-[15px] leading-none text-[#8c2d1a] underline"
                    >
                      remove
                    </button>
                  </div>
                </div>
              </Parchment>
            ))}
          </div>

          {/* Note for the kitchen. One box for the whole order — that is how
              students actually write them ("semuanya extra timun yaa"), and it
              is reproduced under every dish on the committee's vendor recap. */}
          <Parchment className="mt-4 px-5 py-4">
            <label
              htmlFor="lunch-note"
              className="block font-bytebounce text-[20px] uppercase leading-none text-[#3e2723]"
            >
              Note for the kitchen
            </label>
            <p className="mt-1.5 font-bytebounce text-[16px] leading-tight text-[#6d4c41]">
              Optional — e.g. &quot;sambal dipisah&quot;, &quot;extra timun&quot;,
              &quot;ayam paha atas&quot;.
            </p>
            <textarea
              id="lunch-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="Sambal dipisah ya"
              className="mt-2 w-full resize-none border-2 border-[#8a5a37] bg-[#fff3d9] px-3 py-2 font-bytebounce text-[18px] leading-tight text-[#3e2723] placeholder:text-[#c0a184] focus:outline-none focus:ring-2 focus:ring-[#8a5a37]/40"
            />
            <p className="mt-1 text-right font-bytebounce text-[14px] leading-none text-[#a58962]">
              {note.length}/300
            </p>
          </Parchment>

          {/* Total + pay */}
          <Parchment className="mt-4 px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-bytebounce text-[23px] uppercase leading-none text-[#3e2723]">
                Total
              </span>
              <span className="font-bytebounce text-[30px] leading-none text-[#8a5a37]">
                {formatRupiah(subtotal)}
              </span>
            </div>
          </Parchment>

          {error && (
            <p
              role="alert"
              className="mt-3 border-2 border-black bg-[#f6d5cd] px-4 py-2 font-bytebounce text-[17px] leading-tight text-[#8c2d1a]"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handlePay}
            disabled={submitting}
            className="mt-4 w-full border-4 border-black bg-[#4a7c2f] px-4 py-4 font-bytebounce text-[22px] uppercase leading-none text-white disabled:opacity-60 active:translate-y-0.5"
            style={{ boxShadow: '4px 4px 0px #000' }}
          >
            {submitting ? 'Placing order...' : `Pay ${formatRupiah(subtotal)}`}
          </button>

          <p
            className="mt-2 mb-4 text-center font-bytebounce text-[15px] leading-tight text-white"
            style={{ textShadow: '2px 2px 0 #3e2723' }}
          >
            You will get a QRIS code for this exact amount on the next screen.
          </p>
        </>
      )}
    </LunchShell>
  )
}
