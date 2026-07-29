'use client'

import { useState } from 'react'

export interface AchievementBadge {
  id: string
  name: string
  description: string
  imageUrl: string | null
  unlocked: boolean
}

export default function AchievementStrip({
  achievements,
}: {
  achievements: AchievementBadge[]
}) {
  const [selected, setSelected] = useState<AchievementBadge | null>(null)

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
    <>
      <ul className="-mx-1 flex list-none gap-2.5 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#8a5a37] [&::-webkit-scrollbar-track]:bg-transparent [scrollbar-width:thin]">
        {achievements.map((a) => (
          <li key={a.id} className="w-[82px] shrink-0">
            <button
              onClick={() => setSelected(a)}
              className="flex flex-col items-start focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fcf940] rounded-sm text-left"
            >
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
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative flex w-full max-w-xs flex-col items-center gap-4 px-6 py-6 text-center animate-in fade-in zoom-in-95 duration-200"
            style={{
              backgroundImage: 'url(/images/quests/paper.png)',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex h-[80px] w-[80px] items-center justify-center border-2 border-[#3e2723] ${
                selected.unlocked ? '' : 'opacity-60'
              }`}
              style={{ background: 'linear-gradient(180deg, #8a5a37 0%, #5d3a1a 100%)' }}
            >
              {selected.unlocked ? (
                selected.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selected.imageUrl}
                    alt=""
                    aria-hidden
                    className="h-16 w-16 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <span className="text-4xl" aria-hidden>🏅</span>
                )
              ) : (
                <span className="text-3xl" aria-hidden>🔒</span>
              )}
            </div>
            
            <div className="flex flex-col gap-1.5">
              <h2 className="font-bytebounce text-[24px] leading-none uppercase text-[#3e2723]">
                {selected.name}
              </h2>
              <p className="font-bytebounce text-[18px] leading-tight text-[#6d4c41]">
                {selected.description || 'Keep playing to discover how to unlock this achievement!'}
              </p>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="mt-2 font-bytebounce text-[20px] text-[#3e2723] hover:text-[#d6101d] focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
