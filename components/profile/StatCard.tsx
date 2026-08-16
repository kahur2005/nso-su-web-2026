// components/profile/StatCard.tsx
// One parchment stat card: label on the left over two lines, a big figure on
// the right, and an optional "/total" tucked under it — the frame's
// FUNFACTS COLLECTED 59/59 card. The slab is the same paper.png the quest
// cards use, stretched in both directions so its torn edges scale with the
// card instead of tiling.
interface StatCardProps {
  label: string
  value: string
  /** Renders as "/sub" beneath the value, e.g. the fun-fact denominator. */
  sub?: string
  /** Extra classes on the value, used to colour a negative point total. */
  valueClassName?: string
}

export default function StatCard({ label, value, sub, valueClassName = '' }: StatCardProps) {
  return (
    <div
      className="flex min-h-[74px] items-center gap-2 px-5 py-3"
      style={{
        backgroundImage: 'url(/images/quests/paper.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    >
      <p className="min-w-0 flex-1 font-bytebounce text-fluid-base uppercase leading-[1.05] text-[#3e2723]">
        {label}
      </p>
      <div className="shrink-0 text-right flex items-baseline justify-end">
        <span className={`font-bytebounce text-fluid-5xl leading-none text-[#3e2723] ${valueClassName}`}>
          {value}
        </span>
        {sub && (
          <span className="font-bytebounce text-fluid-5xl leading-none text-[#3e2723]">
            /{sub}
          </span>
        )}
      </div>
    </div>
  )
}
