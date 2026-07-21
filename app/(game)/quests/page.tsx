// app/(game)/quests/page.tsx
// The student's quest board. Every active quest is shown with its instructions
// whether or not it's been completed — a mission you can't read is a mission you
// can't go and do. Completing one means finding its QR code and scanning it at
// /scan; there is no in-app "complete" button by design.
'use client'
import { useState, useEffect } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ProgressBar from '@/components/ui/ProgressBar'
import Link from 'next/link'

interface QuestAchievement {
  name: string
  description: string
  imageUrl: string | null
}

interface Quest {
  id: string
  title: string
  description: string
  points: number
  achievement: QuestAchievement | null
  isCompleted: boolean
  completedAt: string | null
}

/** Gold display text with the design's brown pixel outline. */
const OUTLINE_GOLD = {
  color: '#ffd23f',
  textShadow:
    '3px 3px 0 #4e342e, -3px 3px 0 #4e342e, 3px -3px 0 #4e342e, -3px -3px 0 #4e342e, 0 5px 0 #4e342e',
}

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [showDone, setShowDone] = useState(true)

  useEffect(() => {
    fetch('/api/quests')
      .then((r) => r.json())
      .then((d) => setQuests(d.quests ?? []))
      .catch(() => setQuests([]))
      .finally(() => setLoading(false))
  }, [])

  const completed = quests.filter((q) => q.isCompleted).length
  const visible = showDone ? quests : quests.filter((q) => !q.isCompleted)

  return (
    <PageWrapper>
      <div className="mx-auto w-full max-w-md px-3 pb-4 pt-3 lg:max-w-lg">
        <h1
          className="text-center font-bytebounce text-[clamp(2.4rem,12vw,3.2rem)] leading-[0.85]"
          style={OUTLINE_GOLD}
        >
          QUESTS
        </h1>
        <p
          className="mt-1 text-center font-bytebounce text-[18px] leading-tight text-white"
          style={{ textShadow: '2px 2px 0 #4e342e' }}
        >
          Find the code, scan it, claim the reward
        </p>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner text="LOADING QUESTS..." />
          </div>
        ) : (
          <>
            {/* Overall progress */}
            <div className="mt-4 rounded-md border-2 border-[#3a2418] bg-[#f5e7c6] px-3 py-2">
              <div className="flex items-center justify-between font-bytebounce text-[17px] leading-none text-[#5d4330]">
                <span>
                  {completed}/{quests.length} completed
                </span>
                {quests.length > 0 && (
                  <button
                    onClick={() => setShowDone((v) => !v)}
                    className="text-[15px] text-[#8a5a37] underline"
                  >
                    {showDone ? 'hide completed' : 'show all'}
                  </button>
                )}
              </div>
              <div className="mt-2">
                <ProgressBar value={completed} max={quests.length || 1} />
              </div>
            </div>

            {quests.length === 0 && (
              <p className="py-10 text-center font-bytebounce text-[18px] text-white">
                No quests are active yet. Check back soon!
              </p>
            )}

            <div className="mt-4 space-y-3">
              {visible.map((quest) => (
                <article
                  key={quest.id}
                  className={`relative rounded-md border-2 border-[#3a2418] px-3 py-3 ${
                    quest.isCompleted ? 'bg-[#e0d3ae]' : 'bg-[#fdf6e3]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 flex-1 font-bytebounce text-[22px] uppercase leading-none text-[#3e2723]">
                      {quest.title}
                    </h2>
                    <span className="flex-shrink-0 font-bytebounce text-[20px] leading-none text-[#b8860b]">
                      +{quest.points}
                    </span>
                  </div>

                  <p className="mt-1.5 font-bytebounce text-[16px] leading-tight text-[#5d4330]">
                    {quest.description}
                  </p>

                  {quest.achievement && (
                    <div className="mt-2 flex items-center gap-2 rounded border border-[#c9a97b] bg-[#f5e7c6] px-2 py-1.5">
                      {quest.achievement.imageUrl ? (
                        <img
                          src={quest.achievement.imageUrl}
                          alt=""
                          className="h-7 w-7 flex-shrink-0 object-contain"
                        />
                      ) : (
                        <span className="text-lg leading-none">🏅</span>
                      )}
                      <p className="min-w-0 flex-1 truncate font-bytebounce text-[15px] leading-none text-[#8a5a37]">
                        Grants “{quest.achievement.name}”
                      </p>
                    </div>
                  )}

                  <div className="mt-2.5 flex items-center justify-between">
                    {quest.isCompleted ? (
                      <span className="font-bytebounce text-[16px] leading-none text-[#4a7c2f]">
                        ✅ Completed
                        {quest.completedAt &&
                          ` · ${new Date(quest.completedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}`}
                      </span>
                    ) : (
                      <span className="font-bytebounce text-[16px] leading-none text-[#a58962]">
                        Not completed yet
                      </span>
                    )}

                    {!quest.isCompleted && (
                      <Link
                        href="/scan"
                        className="rounded border-2 border-[#3a2418] bg-[#8a5a37] px-2 py-1 font-bytebounce text-[15px] leading-none text-[#ffd23f] active:translate-y-0.5"
                      >
                        Scan QR
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {visible.length === 0 && quests.length > 0 && (
              <p className="py-10 text-center font-bytebounce text-[18px] text-white">
                Every quest done. Nice work!
              </p>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  )
}
