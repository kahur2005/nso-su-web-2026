// components/lunch/LunchStatusChip.tsx
// Where an order stands, in one glance. Colours are chosen so the two states
// that need the student to do something (pay, or fix a rejection) stand out
// from the two that do not.
import { LUNCH_STATUS_LABEL, type LunchOrderStatus } from '@/lib/lunch'

const STYLE: Record<LunchOrderStatus, string> = {
  pending_payment: 'border-[#c9a97b] bg-[#f5e0aa] text-[#8a5a37]',
  awaiting_approval: 'border-[#c9a97b] bg-[#fff3d9] text-[#8a5a37]',
  approved: 'border-[#4a7c2f] bg-[#dff0d0] text-[#3c651f]',
  rejected: 'border-[#a3402a] bg-[#f6d5cd] text-[#8c2d1a]',
}

export default function LunchStatusChip({
  status,
  className = '',
}: {
  status: LunchOrderStatus
  className?: string
}) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 font-bytebounce text-[15px] leading-none ${STYLE[status]} ${className}`}
    >
      {LUNCH_STATUS_LABEL[status]}
    </span>
  )
}
