'use client'
import { useState, useEffect, useCallback } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Link from 'next/link'
import SubmissionPanel from '@/components/quests/SubmissionPanel'
import QuizPanel from '@/components/quests/QuizPanel'
import {
  QUEST_TYPE_LABEL,
  type QuestType,
  type QuestSubmissionStatus,
} from '@/lib/quests'
import { APP_TIME_ZONE_LABEL, formatJakartaDate, formatJakartaTime } from '@/lib/time'

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
  type: QuestType
  achievement: QuestAchievement | null
  isCompleted: boolean
  completedAt: string | null
  progressStatus: string | null
  submissionStatus: QuestSubmissionStatus
  availableFrom: string | null
  availableUntil: string | null
  isLocked: boolean
  quizCorrectCount: number | null
  quizTotal: number | null
}

/** Keeps light text legible against the wood grain, as BottomNav's labels do. */
const PLANK_TEXT_SHADOW = '2px 2px 0 #4e342e'

/** The quest reward: gold, with a thin black outline on all four sides. */
const GOLD_POINTS = {
  color: '#ffd23f',
  textShadow:
    '2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000',
}

function formatTime(iso: string) {
  return formatJakartaTime(iso)
}

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

function TypeBadge({ type }: { type: QuestType }) {
  return (
    <span className="inline-block rounded border border-[#c9a97b] bg-[#f5e0aa] px-2 py-0.5 font-bytebounce text-[13px] leading-none uppercase text-[#8a5a37]">
      {QUEST_TYPE_LABEL[type]}
    </span>
  )
}

function isQuizPerfect(quest: Quest): boolean {
  return (
    quest.type === 'quiz' &&
    quest.quizTotal != null &&
    quest.quizTotal > 0 &&
    (quest.quizCorrectCount ?? 0) >= quest.quizTotal
  )
}

function statusLabel(quest: Quest): string {
  if (quest.isCompleted && quest.type === 'quiz' && quest.quizTotal != null && quest.quizTotal > 0) {
    const n = quest.quizCorrectCount ?? 0
    if (n === quest.quizTotal) {
      const date = quest.completedAt
        ? formatJakartaDate(quest.completedAt, {
            month: 'short',
            day: 'numeric',
          })
        : null
      return date ? `✅ Perfect · ${date}` : '✅ Perfect'
    }
    if (n > 0) return `${n}/${quest.quizTotal} correct — keep trying`
    return 'Attempted — keep trying'
  }
  if (quest.isCompleted) {
    const date = quest.completedAt
      ? formatJakartaDate(quest.completedAt, {
          month: 'short',
          day: 'numeric',
        })
      : null
    return date ? `✅ Completed · ${date}` : '✅ Completed'
  }
  if (quest.isLocked) return 'Not available yet'
  if (quest.type === 'submission') {
    if (quest.submissionStatus === 'awaiting_approval') return '⏳ Awaiting review'
    if (quest.submissionStatus === 'rejected') return '❌ Rejected — try again'
    if (quest.submissionStatus === 'approved') return '✅ Approved'
    if (quest.progressStatus === 'in_progress') return 'In progress'
  }
  if (quest.type === 'quiz' && quest.quizTotal != null && quest.quizTotal > 0) {
    const n = quest.quizCorrectCount ?? 0
    if (n === quest.quizTotal) return `✅ ${n}/${quest.quizTotal} correct`
    if (n > 0) return `${n}/${quest.quizTotal} correct — keep trying`
    return 'Not completed yet'
  }
  return 'Not completed yet'
}

function ctaLabel(quest: Quest): string | null {
  if (quest.isLocked) return null
  if (quest.type === 'quiz') {
    if (isQuizPerfect(quest)) return null
    return 'QUIZ'
  }
  if (quest.isCompleted) return null
  if (quest.type === 'qr') return 'SCAN ME'
  if (quest.type === 'submission') return 'SUBMIT'
  return null
}

function QuestCard({
  quest,
  expanded,
  onToggle,
  onRefresh,
}: {
  quest: Quest
  expanded: boolean
  onToggle: () => void
  onRefresh: () => void
}) {
  const actionable =
    !quest.isLocked &&
    (quest.type === 'quiz' ? !isQuizPerfect(quest) : !quest.isCompleted)
  const cta = ctaLabel(quest)
  const isQrScan = quest.type === 'qr' && actionable
  const isPanelQuest =
    (quest.type === 'submission' || quest.type === 'quiz') && actionable

  const cardInner = (
    <article
      className={`relative min-h-[72px] ${quest.isLocked ? 'opacity-75' : ''}`}
      style={{
        backgroundImage: 'url(/images/quests/paper.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    >
      <div className="relative flex flex-col gap-4 px-5 pb-10 pt-10">
        <div className="min-w-0 w-full">
          {quest.isLocked && (
            <div className="mb-2 flex items-center gap-1.5 rounded border border-[#c9a97b] bg-[#fff3d9] px-2 py-1">
              <span className="text-base leading-none">🔒</span>
              <p className="font-bytebounce text-[14px] leading-none text-[#8a5a37]">
                Opens at {quest.availableFrom ? formatTime(quest.availableFrom) : '—'} {APP_TIME_ZONE_LABEL}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={quest.type} />
          </div>

          <h2 className="mt-2 w-full font-bytebounce text-[28px] uppercase leading-none text-[#3e2723]">
            {quest.title}
          </h2>

          <p className="mt-2 w-full font-bytebounce text-[24px] leading-[1.05] text-[#6d4c41]">
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

          <p className="mt-3 font-bytebounce text-[16px] leading-none">
            {quest.isCompleted ? (
              <span className="text-[#4a7c2f]">{statusLabel(quest)}</span>
            ) : quest.isLocked ? (
              <span className="text-[#a58962]">{statusLabel(quest)}</span>
            ) : (
              <span className="text-[#a58962]">{statusLabel(quest)}</span>
            )}
          </p>
        </div>

        <div className="flex w-full items-center justify-between gap-3">
          <span
            className="font-bytebounce text-[58px] leading-none"
            style={GOLD_POINTS}
          >
            +{quest.points}
          </span>

          <div className="flex items-center gap-3">
            {cta && (
              <span className="whitespace-nowrap rounded border-2 border-[#3a2418] bg-[#8a5a37] px-3 py-1.5 font-bytebounce text-[18px] leading-none text-[#ffd23f]">
                {cta}
              </span>
            )}
            {(isQrScan || isPanelQuest) && <Chevron />}
          </div>
        </div>
      </div>
    </article>
  )

  const cardBody = isQrScan ? (
    <Link
      href="/scan"
      aria-label={`Scan the QR code for ${quest.title}`}
      className="block transition-transform active:translate-y-0.5"
    >
      {cardInner}
    </Link>
  ) : isPanelQuest ? (
    <button
      type="button"
      aria-expanded={expanded}
      aria-label={`${expanded ? 'Close' : 'Open'} ${quest.title}`}
      onClick={onToggle}
      className="block w-full text-left transition-transform active:translate-y-0.5"
    >
      {cardInner}
    </button>
  ) : (
    cardInner
  )

  return (
    <div className="space-y-2">
      {cardBody}
      {expanded && quest.type === 'submission' && (
        <SubmissionPanel
          questId={quest.id}
          submissionStatus={quest.submissionStatus}
          disabled={quest.isLocked || quest.isCompleted}
          onSubmitted={onRefresh}
        />
      )}
      {expanded && quest.type === 'quiz' && (
        <QuizPanel
          questId={quest.id}
          disabled={quest.isLocked}
          onSubmitted={onRefresh}
        />
      )}
    </div>
  )
}

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [showDone, setShowDone] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadQuests = useCallback(() => {
    return fetch('/api/quests')
      .then((r) => r.json())
      .then((d) => setQuests(d.quests ?? []))
      .catch(() => setQuests([]))
  }, [])

  useEffect(() => {
    loadQuests().finally(() => setLoading(false))
  }, [loadQuests])

  const completed = quests.filter((q) => q.isCompleted).length
  const visible = showDone ? quests : quests.filter((q) => !q.isCompleted)
  const pct = quests.length ? Math.min((completed / quests.length) * 100, 100) : 0

  return (
    <PageWrapper>
      <div
        className="fixed inset-0 -z-10 bg-cover bg-bottom"
        style={{ backgroundImage: 'url(/images/scan/bg.png)' }}
      />

      <div className="relative game-column pb-4 pt-14">
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
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  expanded={expandedId === quest.id}
                  onToggle={() =>
                    setExpandedId((id) => (id === quest.id ? null : quest.id))
                  }
                  onRefresh={() => {
                    loadQuests()
                  }}
                />
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
