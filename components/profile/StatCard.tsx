interface StatCardProps {
  label: string
  value: string
  sub?: string
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
      <p className="min-w-0 flex-1 font-bytebounce text-[24px] uppercase leading-[1.05] text-[#3e2723] sm:text-[26px]">
        {label}
      </p>
      <div className="shrink-0 text-right flex items-baseline justify-end">
        <span className={`font-bytebounce text-[28px] leading-none text-[#3e2723] sm:text-[30px] ${valueClassName}`}>
          {value}
        </span>
        {sub && (
          <span className="font-bytebounce text-[28px] leading-none text-[#3e2723] sm:text-[30px]">
            /{sub}
          </span>
        )}
      </div>
    </div>
  )
}
