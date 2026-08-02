// app/(game)/quests/page.tsx
// The student's quest board, built to the "Active Quests" Figma frame
// (VCnH1k8cwo2dWaLjL7YRVS, node 1:2): the jungle backdrop already used by
// /scan, a scroll-icon section header, and parchment strips with a chevron.
//
// Every quest is shown with its instructions whether or not it's been
// completed — a mission you can't read is a mission you can't go and do.
// Time-gated quests show "Opens at HH:MM" and drop the scan affordance until
// the window opens.
'use client'
import { useState, useEffect } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
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
  availableFrom: string | null
  availableUntil: string | null
  isLocked: boolean   // window hasn't opened yet
}

/** Keeps light text legible against the wood grain, as BottomNav's labels do. */
const PLANK_TEXT_SHADOW = '2px 2px 0 #4e342e'

/** The quest reward: gold, with a thin black outline on all four sides. */
/* Outline is 2px to stay proportional to the 58px glyphs — a 1px outline
 * reads as a thin fringe at this size. */
const GOLD_POINTS = {
  color: '#ffd23f',
  textShadow:
    '2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * 3-slice sprite background: fixed end caps with the middle stretched to fill,
 * so the panel takes any width without its end art distorting. Used here for
 * the progress plank, lifted from the identical treatment in BottomNav — keep
 * the two in step if the plank sprites are ever re-exported.
 */
function SliceBg({
  base,
  leftWidth,
  rightWidth,
}: {
  base: string
  leftWidth: number
  rightWidth: number
}) {
  return (
    <>
      <div
        className="absolute inset-y-0"
        style={{
          left: leftWidth,
          right: rightWidth,
          backgroundImage: `url(${base}-mid.png)`,
          backgroundSize: '100% 100%',
          imageRendering: 'pixelated',
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${base}-left.png`}
        alt=""
        aria-hidden
        className="absolute inset-y-0 left-0 h-full"
        style={{ width: leftWidth, imageRendering: 'pixelated' }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${base}-right.png`}
        alt=""
        aria-hidden
        className="absolute inset-y-0 right-0 h-full"
        style={{ width: rightWidth, imageRendering: 'pixelated' }}
      />
    </>
  )
}

/** The solid pixel chevron on the right edge of an actionable quest card. */
function Chevron() {
  return (
    <span
      aria-hidden
      className="ml-1 shrink-0 self-center"
      style={{
        width: 0,
        height: 0,
        borderTop: '9px solid transparent',
        borderBottom: '9px solid transparent',
        borderLeft: '12px solid #5d4037',
      }}
    />
  )
}

function QuestCard({ quest }: { quest: Quest }) {
  const actionable = !quest.isCompleted && !quest.isLocked

  const card = (
    <article
      className={`relative min-h-[72px] ${quest.isLocked ? 'opacity-75' : ''}`}
      style={{
        // One slab of parchment (365x72) stretched to the card, torn edges and
        // corners included — not sliced, so it scales in both directions.
        backgroundImage: 'url(/images/quests/paper.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    >
      <div className="relative flex items-center gap-2 py-3 pl-5 pr-4">
        <div className="min-w-0 flex-1">
          {/* Locked banner */}
          {quest.isLocked && (
            <div className="mb-2 flex items-center gap-1.5 rounded border border-[#c9a97b] bg-[#fff3d9] px-2 py-1">
              <span className="text-base leading-none">🔒</span>
              <p className="font-bytebounce text-[14px] leading-none text-[#8a5a37]">
                Opens at {quest.availableFrom ? formatTime(quest.availableFrom) : '—'}
              </p>
            </div>
          )}

          {/* Title */}
          <h2 className="mt-1.5 font-bytebounce text-[23px] uppercase leading-none text-[#3e2723]">
            {quest.title}
          </h2>

          {/* Indented subtitle, as in the Figma card */}
          <p className="mt-2 pl-3 font-bytebounce text-[17px] leading-tight text-[#6d4c41]">
            {quest.description}
          </p>

          {quest.achievement && (
            <div className="mt-2 flex items-center gap-2 rounded border border-[#c9a97b] bg-[#f5e0aa] px-2 py-1.5">
              {quest.achievement.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={quest.achievement.imageUrl}
                  alt=""
                  className="h-7 w-7 flex-shrink-0 object-contain"
                />
              ) : (
                <span className="text-lg leading-none">🏅</span>
              )}
              <p className="min-w-0 flex-1 truncate font-bytebounce text-[15px] leading-none text-[#8a5a37]">
                Grants &quot;{quest.achievement.name}&quot;
              </p>
            </div>
          )}

          {/* Status */}
          <p className="mt-2 font-bytebounce text-[16px] leading-none">
            {quest.isCompleted ? (
              <span className="text-[#4a7c2f]">
                ✅ Completed
                {quest.completedAt &&
                  ` · ${new Date(quest.completedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}`}
              </span>
            ) : quest.isLocked ? (
              <span className="text-[#a58962]">Not available yet</span>
            ) : (
              <span className="text-[#a58962]">Not completed yet</span>
            )}
          </p>
        </div>

        {/* Reward + scan affordance: points then button, side by side at the
            right edge, held vertically centred against the title/description
            block by the `items-center` on the row. */}
        <div className="flex shrink-0 items-center gap-3">
          <span
            className="font-bytebounce text-[58px] leading-none"
            style={GOLD_POINTS}
          >
            +{quest.points}
          </span>

          {/* A span, not a button — the whole card is already the link. */}
          {actionable && (
            <span className="whitespace-nowrap rounded border-2 border-[#3a2418] bg-[#8a5a37] px-3 py-1.5 font-bytebounce text-[18px] leading-none text-[#ffd23f]">
              SCAN ME
            </span>
          )}
        </div>

        {actionable && <Chevron />}
      </div>
    </article>
  )

  if (!actionable) return card

  return (
    <Link
      href="/scan"
      aria-label={`Scan the QR code for ${quest.title}`}
      className="block transition-transform active:translate-y-0.5"
    >
      {card}
    </Link>
  )
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
  const pct = quests.length ? Math.min((completed / quests.length) * 100, 100) : 0

  return (
    <PageWrapper>
      {/* Jungle backdrop from the Figma frame — the same art /scan uses.
          Renders after PageWrapper's sky layer at the same z-index, so it wins. */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-bottom"
        style={{ backgroundImage: 'url(/images/scan/bg.png)' }}
      />

      <div className="relative game-column pb-4 pt-14">
        {/* Section header: scroll icon + title */}
        <div className="flex items-center gap-2.5 px-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/dashboard/quest.svg"
            alt=""
            className="h-9 w-8 shrink-0 object-contain"
          />
          <h1 className="title-gold font-bytebounce text-[30px] leading-none sm:text-[34px]">
            Active Quests
          </h1>
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner text="LOADING QUESTS..." />
          </div>
        ) : (
          <>
            {/* Overall progress, on the same wooden plank as the bottom nav.
                Height and cap width are BottomNav's 80/37, which is the plank
                art's natural aspect ratio — keep them in step if either moves. */}
            <div className="relative mt-3.5 h-20">
              <SliceBg base="/images/nav/plank" leftWidth={37} rightWidth={37} />

              <div className="relative flex h-full flex-col justify-center px-5">
                <div
                  className="flex items-center justify-between gap-3 font-bytebounce text-[17px] leading-none text-[#d9d9d9]"
                  style={{ textShadow: PLANK_TEXT_SHADOW }}
                >
                  <span className="whitespace-nowrap">
                    {completed}/{quests.length} completed
                  </span>
                  {quests.length > 0 && (
                    <button
                      onClick={() => setShowDone((v) => !v)}
                      className="whitespace-nowrap text-[15px] text-[#d9d9d9] underline"
                    >
                      {showDone ? 'hide completed' : 'show all'}
                    </button>
                  )}
                </div>
                <div className="mt-2 h-[14px] overflow-hidden rounded-[2px] border-2 border-[#3e2723] bg-[#4e342e]">
                  <div
                    className="relative h-full bg-[#ffd23f] transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  >
                    <span className="absolute inset-x-0 top-0 block h-[40%] bg-white/30" />
                  </div>
                </div>
              </div>
            </div>

            {quests.length === 0 && (
              <p
                className="py-10 text-center font-bytebounce text-[18px] text-white"
                style={{ textShadow: '2px 2px 0 #3e2723' }}
              >
                No quests are active yet. Check back soon!
              </p>
            )}

            <div className="mt-3.5 space-y-3.5">
              {visible.map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>

            {visible.length === 0 && quests.length > 0 && (
              <p
                className="py-10 text-center font-bytebounce text-[18px] text-white"
                style={{ textShadow: '2px 2px 0 #3e2723' }}
              >
                Every quest done. Nice work!
              </p>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  )
}
