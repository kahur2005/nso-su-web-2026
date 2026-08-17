// components/lunch/MenuItemSheet.tsx
// The bottom sheet for one dish: quantity, add-ons, and a running line total,
// so the student sees the price change as they tick boxes rather than being
// surprised at the cart.
'use client'
import { useEffect, useState } from 'react'
import { formatRupiah, type LunchMenuItem } from '@/lib/lunch'

export default function MenuItemSheet({
  item,
  onClose,
  onAdd,
}: {
  item: LunchMenuItem | null
  onClose: () => void
  onAdd: (quantity: number, addOnIds: string[]) => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [addOnIds, setAddOnIds] = useState<string[]>([])

  // Reset whenever a different dish is opened, so last dish's picks don't leak.
  useEffect(() => {
    setQuantity(1)
    setAddOnIds([])
  }, [item?.id])

  // Escape closes, matching what a bottom sheet is expected to do on desktop.
  useEffect(() => {
    if (!item) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [item, onClose])

  if (!item) return null

  const chosen = item.addOns.filter((a) => addOnIds.includes(a.id))
  const perUnit = item.price + chosen.reduce((n, a) => n + a.price, 0)
  const total = perUnit * quantity

  const toggle = (id: string) =>
    setAddOnIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      <div className="relative w-full max-w-[520px] max-h-[85vh] overflow-y-auto border-4 border-black bg-[#fff3d9] p-5 pb-8">
        <div className="flex items-start gap-3">
          {item.imageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.imageUrl}
              alt=""
              className="h-[64px] w-[64px] shrink-0 rounded border-2 border-[#5d4037] object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-bytebounce text-[25px] uppercase leading-none text-[#3e2723]">
              {item.name}
            </h2>
            {item.description && (
              <p className="mt-1.5 font-bytebounce text-[22px] leading-tight text-[#6d4c41]">
                {item.description}
              </p>
            )}
            <p className="mt-1.5 font-bytebounce text-[24px] leading-none text-[#8a5a37]">
              {formatRupiah(item.price)}
            </p>
          </div>
        </div>

        {item.addOns.length > 0 && (
          <div className="mt-4">
            <h3 className="font-bytebounce text-[22px] uppercase leading-none text-[#3e2723]">
              Add-ons
            </h3>
            <div className="mt-2 space-y-1.5">
              {item.addOns.map((addOn) => (
                <label
                  key={addOn.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded border border-[#c9a97b] bg-[#f5e0aa] px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={addOnIds.includes(addOn.id)}
                    onChange={() => toggle(addOn.id)}
                    className="h-4 w-4 shrink-0 accent-[#8a5a37]"
                  />
                  <span className="min-w-0 flex-1 font-bytebounce text-[22px] leading-none text-[#3e2723]">
                    {addOn.name}
                  </span>
                  <span className="shrink-0 font-bytebounce text-[22px] leading-none text-[#8a5a37]">
                    +{formatRupiah(addOn.price)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="mt-4 flex items-center gap-3">
          <span className="font-bytebounce text-[22px] uppercase leading-none text-[#3e2723]">
            Quantity
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="h-10 w-10 border-2 border-[#5d4037] bg-[#f5e0aa] font-bytebounce text-[24px] leading-none text-[#3e2723] active:translate-y-0.5"
            >
              −
            </button>
            <span
              aria-live="polite"
              className="w-8 text-center font-bytebounce text-[24px] leading-none text-[#3e2723]"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(50, q + 1))}
              aria-label="Increase quantity"
              className="h-10 w-10 border-2 border-[#5d4037] bg-[#f5e0aa] font-bytebounce text-[24px] leading-none text-[#3e2723] active:translate-y-0.5"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-[#5d4037] bg-[#e0b391] px-4 py-3 font-bytebounce text-[22px] uppercase leading-none text-[#3e2723] active:translate-y-0.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onAdd(quantity, addOnIds)}
            className="flex-1 border-2 border-black bg-[#4a7c2f] px-4 py-3 font-bytebounce text-[22px] uppercase leading-none text-white active:translate-y-0.5"
          >
            Add · {formatRupiah(total)}
          </button>
        </div>
      </div>
    </div>
  )
}
