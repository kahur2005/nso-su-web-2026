// app/(game)/lunch/order/[orderId]/page.tsx
// One order, in whichever of its four states it happens to be:
//
//   pending_payment   -> QRIS code for the exact total + upload proof + submit
//   awaiting_approval -> receipt, with a "committee is checking" banner
//   approved          -> receipt, stamped
//   rejected          -> receipt, with the committee's reason and what to do
//
// One page rather than four routes because it is one thing the student keeps
// coming back to, and the URL they bookmark should not change under them when
// committee approves.
'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import LunchShell from '@/components/lunch/LunchShell'
import Parchment from '@/components/lunch/Parchment'
import LunchStatusChip from '@/components/lunch/LunchStatusChip'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatRupiah, lunchDayMeta, type LunchOrder } from '@/lib/lunch'

export default function LunchOrderPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = String(params?.orderId ?? '')

  const [order, setOrder] = useState<LunchOrder | null>(null)
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proofName, setProofName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/lunch/orders/${orderId}`)
      if (!response.ok) {
        setNotFound(true)
        return
      }
      const data = await response.json()
      setOrder(data.order ?? null)
      setQrCodeImage(data.qrCodeImage ?? null)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (orderId) load()
  }, [orderId, load])

  const handleSubmitProof = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Please attach a screenshot of your payment first.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const body = new FormData()
      body.append('proof', file)

      const response = await fetch(`/api/lunch/orders/${orderId}/proof`, {
        method: 'POST',
        body,
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Upload failed. Please try again.')
        return
      }

      // Re-read rather than patching local state: the server owns the status.
      await load()
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <LunchShell title="Order">
        <div className="py-12">
          <LoadingSpinner text="LOADING ORDER..." />
        </div>
      </LunchShell>
    )
  }

  if (notFound || !order) {
    return (
      <LunchShell title="Order">
        <Parchment className="mt-3.5 px-5 py-4">
          <p className="font-bytebounce text-[24px] leading-tight text-[#8c2d1a]">
            We could not find that order.
          </p>
          <Link
            href="/lunch"
            className="mt-2 inline-block font-bytebounce text-[22px] text-[#8a5a37] underline"
          >
            Back to lunch
          </Link>
        </Parchment>
      </LunchShell>
    )
  }

  const meta = lunchDayMeta(order.dayKey)

  return (
    <LunchShell
      title={order.status === 'pending_payment' ? 'Pay' : 'Receipt'}
      subtitle={`${order.restaurantName} · ${meta?.headerTitle ?? `Day ${order.dayKey}`}`}
    >
      {/* ---------------------------------------------------- receipt ---- */}
      <Parchment className="mt-3.5 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[18px] text-[#6d4c41]">
            {order.orderCode}
          </span>
          <LunchStatusChip status={order.status} />
        </div>

        <div className="mt-3 space-y-2 border-t-2 border-dashed border-[#c9a97b] pt-3">
          {order.items.map((item) => (
            <div key={item.id}>
              <div className="flex justify-between gap-3">
                <span className="font-bytebounce text-[22px] leading-tight text-[#3e2723]">
                  {item.quantity}x {item.nameSnapshot}
                </span>
                <span className="shrink-0 font-bytebounce text-[22px] leading-tight text-[#8a5a37]">
                  {formatRupiah(item.lineTotal)}
                </span>
              </div>
              {item.addOns.length > 0 && (
                <p className="pl-4 font-bytebounce text-[20px] leading-tight text-[#a58962]">
                  {item.addOns
                    .map((a) => `+ ${a.nameSnapshot} (${formatRupiah(a.price)})`)
                    .join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>

        {order.note && (
          <p className="mt-3 border-t-2 border-dashed border-[#c9a97b] pt-3 font-bytebounce text-[22px] leading-tight text-[#6d4c41]">
            <span className="text-[#a58962]">Note:</span> {order.note}
          </p>
        )}

        <div className="mt-3 flex items-baseline justify-between gap-3 border-t-2 border-dashed border-[#c9a97b] pt-3">
          <span className="font-bytebounce text-[24px] uppercase leading-none text-[#3e2723]">
            Total
          </span>
          <span className="font-bytebounce text-[28px] leading-none text-[#8a5a37]">
            {formatRupiah(order.subtotal)}
          </span>
        </div>
      </Parchment>

      {/* ------------------------------------------- pending payment ---- */}
      {order.status === 'pending_payment' && (
        <>
          <Parchment className="mt-4 px-5 py-4">
            <h2 className="font-bytebounce text-[24px] uppercase leading-none text-[#3e2723]">
              1 · Scan to pay
            </h2>
            <p className="mt-1.5 font-bytebounce text-[22px] leading-tight text-[#6d4c41]">
              Open any QRIS-capable app and scan this. The amount is already
              filled in — you should see {formatRupiah(order.subtotal)}.
            </p>

            {qrCodeImage ? (
              /* The white plate is its own element rather than padding on the
                 <img>, so the quiet zone around the code scales with the card
                 instead of staying a fixed 8px. Scanners need that clear
                 margin — a code that runs to the edge of its background reads
                 badly in poor light. */
              <div className="mt-3 flex justify-center">
                <div className="w-full max-w-[300px] border-4 border-[#5d4037] bg-white p-5 sm:p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeImage}
                    alt={`QRIS payment code for ${formatRupiah(order.subtotal)}`}
                    className="block w-full"
                  />
                </div>
              </div>
            ) : (
              <p className="mt-3 font-bytebounce text-[22px] leading-tight text-[#8c2d1a]">
                The payment code could not be generated. Please contact the
                committee.
              </p>
            )}
          </Parchment>

          <Parchment className="mt-4 px-5 py-4">
            <h2 className="font-bytebounce text-[24px] uppercase leading-none text-[#3e2723]">
              2 · Upload your proof
            </h2>
            <p className="mt-1.5 font-bytebounce text-[22px] leading-tight text-[#6d4c41]">
              Screenshot the success page from your banking app and attach it
              here. Committee checks it against the total.
            </p>

            <label className="mt-3 block cursor-pointer border-2 border-dashed border-[#8a5a37] bg-[#f5e0aa] px-4 py-5 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  setProofName(e.target.files?.[0]?.name ?? null)
                  setError(null)
                }}
              />
              <span className="font-bytebounce text-[22px] leading-none text-[#3e2723]">
                {proofName ?? 'Tap to choose a screenshot'}
              </span>
            </label>

            {error && (
              <p
                role="alert"
                className="mt-3 border-2 border-black bg-[#f6d5cd] px-3 py-2 font-bytebounce text-[22px] leading-tight text-[#8c2d1a]"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmitProof}
              disabled={uploading}
              className="mt-4 w-full border-4 border-black bg-[#4a7c2f] px-4 py-4 font-bytebounce text-[24px] uppercase leading-none text-white disabled:opacity-60 active:translate-y-0.5"
              style={{ boxShadow: '4px 4px 0px #000' }}
            >
              {uploading ? 'Submitting...' : 'Submit payment'}
            </button>
          </Parchment>
        </>
      )}

      {/* --------------------------------------------- other statuses ---- */}
      {order.status === 'awaiting_approval' && (
        <Parchment className="mt-4 px-5 py-4">
          <p className="font-bytebounce text-[24px] leading-tight text-[#8a5a37]">
            Payment received — committee is checking it now. This page updates
            once they approve; you do not need to do anything else.
          </p>
        </Parchment>
      )}

      {order.status === 'approved' && (
        <Parchment className="mt-4 px-5 py-4">
          <p className="font-bytebounce text-[26px] uppercase leading-none text-[#3c651f]">
            ✅ Approved
          </p>
          <p className="mt-2 font-bytebounce text-[22px] leading-tight text-[#6d4c41]">
            Show this receipt at the {order.restaurantName} counter on{' '}
            {meta?.date ?? `day ${order.dayKey}`} to collect your meal.
          </p>
        </Parchment>
      )}

      {order.status === 'rejected' && (
        <Parchment className="mt-4 px-5 py-4">
          <p className="font-bytebounce text-[26px] uppercase leading-none text-[#8c2d1a]">
            Rejected
          </p>
          <p className="mt-2 font-bytebounce text-[22px] leading-tight text-[#6d4c41]">
            {order.rejectionReason ??
              'Committee could not verify this payment.'}
          </p>
          <p className="mt-2 font-bytebounce text-[22px] leading-tight text-[#6d4c41]">
            Find a committee member if you believe this is a mistake, or place a
            new order.
          </p>
          <Link
            href="/lunch"
            className="mt-2 inline-block font-bytebounce text-[22px] text-[#8a5a37] underline"
          >
            Back to lunch
          </Link>
        </Parchment>
      )}

      {/* The student's own uploaded proof, for their records. */}
      {order.paymentProofUrl && order.status !== 'pending_payment' && (
        <Parchment className="mt-4 mb-4 px-5 py-4">
          <h2 className="font-bytebounce text-[24px] uppercase leading-none text-[#3e2723]">
            Your proof of payment
          </h2>
          <a
            href={order.paymentProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.paymentProofUrl}
              alt="Your uploaded payment screenshot"
              className="max-h-[220px] w-full border-2 border-[#5d4037] object-contain"
            />
          </a>
        </Parchment>
      )}
    </LunchShell>
  )
}
