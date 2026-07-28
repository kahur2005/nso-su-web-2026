// components/lunch/CartBar.tsx
// The sticky "N items · Rp X · View cart" bar on the menu screen.
//
// It sits above BottomNav (h-20) rather than replacing it, so a student can
// still navigate away mid-order — the cart is in localStorage and survives.
'use client'
import Link from 'next/link'
import { cartSubtotal, formatRupiah, type CartLine } from '@/lib/lunch'

export default function CartBar({
  lines,
  href,
}: {
  lines: CartLine[]
  href: string
}) {
  if (lines.length === 0) return null

  const count = lines.reduce((n, l) => n + l.quantity, 0)

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-2 md:bottom-4">
      <Link
        href={href}
        className="mx-auto flex max-w-[520px] items-center gap-3 border-4 border-black bg-[#4a7c2f] px-4 py-3 active:translate-y-0.5"
        style={{ boxShadow: '4px 4px 0px #000' }}
      >
        <span className="font-bytebounce text-[19px] leading-none text-white">
          {count} item{count === 1 ? '' : 's'}
        </span>
        <span className="flex-1 text-right font-bytebounce text-[21px] leading-none text-[#ffd23f]">
          {formatRupiah(cartSubtotal(lines))}
        </span>
        <span className="font-bytebounce text-[19px] uppercase leading-none text-white">
          View cart →
        </span>
      </Link>
    </div>
  )
}
