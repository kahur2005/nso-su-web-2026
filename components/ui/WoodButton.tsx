// components/ui/WoodButton.tsx
// 3-slice wooden plank button (same plank art as the bottom nav):
// fixed end caps + horizontally stretched middle, ByteBounce label.
'use client'

interface WoodButtonProps {
  onClick?: () => void
  children: React.ReactNode
  /** sizing/layout classes, e.g. "h-[54px] flex-1" or "h-12 w-full" */
  className?: string
  /** label size/overrides, e.g. "text-[34px]" */
  textClassName?: string
  disabled?: boolean
}

export default function WoodButton({
  onClick,
  children,
  className = '',
  textClassName = '',
  disabled = false,
}: WoodButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative select-none transition-transform active:translate-y-[2px] disabled:opacity-60 ${className}`}
    >
      <span
        className="absolute inset-y-0 left-[21px] right-[21px]"
        style={{
          backgroundImage: 'url(/images/nav/plank-mid.png)',
          backgroundSize: '100% 100%',
          imageRendering: 'pixelated',
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/nav/plank-left.png"
        alt=""
        aria-hidden
        className="absolute left-0 inset-y-0 h-full w-[22px]"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/nav/plank-right.png"
        alt=""
        aria-hidden
        className="absolute right-0 inset-y-0 h-full w-[22px]"
        style={{ imageRendering: 'pixelated' }}
      />
      <span
        className={`relative font-bytebounce leading-none text-[#e0b391] ${textClassName}`}
        style={{ textShadow: '2.8px 2.6px 0 #3e2723' }}
      >
        {children}
      </span>
    </button>
  )
}
