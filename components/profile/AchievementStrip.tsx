// components/profile/AchievementStrip.tsx
// The frame leaves the Achievements area empty, so this is a horizontal shelf
// of badge medallions: unlocked in full colour, locked dimmed behind a
// padlock. Horizontal keeps the section as short as the frame implies.
export interface AchievementBadge {
  id: string
  name: string
  imageUrl: string | null
  unlocked: boolean
}

export default function AchievementStrip({
  achievements,
}: {
  achievements: AchievementBadge[]
}) {
  if (achievements.length === 0) {
    return (
      <p
        className="px-1 font-bytebounce text-[17px] leading-none text-[#e0b391]"
        style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
      >
        No achievements yet — complete a quest to earn your first badge.
      </p>
    )
  }

  return (
    <ul className="-mx-1 flex list-none gap-2.5 overflow-x-auto px-1 pb-1">
      {achievements.map((a) => (
        <li key={a.id} className="w-[82px] shrink-0">
          <div
            className={`flex h-[68px] w-[68px] items-center justify-center border-2 border-[#3e2723] ${
              a.unlocked ? '' : 'opacity-60'
            }`}
            style={{ background: 'linear-gradient(180deg, #8a5a37 0%, #5d3a1a 100%)' }}
            aria-label={a.unlocked ? a.name : `${a.name} (locked)`}
            title={a.unlocked ? a.name : `${a.name} (locked)`}
          >
            {a.unlocked ? (
              a.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={a.imageUrl}
                  alt=""
                  aria-hidden
                  className="h-14 w-14 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <span className="text-3xl" aria-hidden>🏅</span>
              )
            ) : (
              <span className="text-2xl" aria-hidden>🔒</span>
            )}
          </div>
          <p
            className={`mt-1 w-[68px] truncate font-bytebounce text-[13px] leading-none ${
              a.unlocked ? 'text-[#ffecb3]' : 'text-[#a1887f]'
            }`}
            style={{ textShadow: '1px 1px 0 #3e2723' }}
          >
            {a.name}
          </p>
        </li>
      ))}
    </ul>
  )
}
