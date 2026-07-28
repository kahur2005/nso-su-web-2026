// components/guidebook/ChapterQuiz.tsx
// End-of-chapter quiz: two questions, one submit, one try.
//
// The lock is server-side (GuidebookQuizAttempt's unique (studentId, chapterId)) —
// everything here is presentation on top of an `attempt` the parent fetched.
// Submitting spends the attempt whether the answers were right or wrong, and
// the Claim button only exists once the server has said both were right.
'use client'
import { useState } from 'react'
import type { QuizQuestion } from '@/lib/guidebook/quiz'
import { POINTS_PER_CHAPTER } from '@/lib/guidebook/quiz'

/** What the server knows about this student's attempt at this chapter. */
export type Attempt = {
  chapterId: string
  isCorrect: boolean
  pointsAwarded: number
  claimedAt: string | null
}

const INK_TITLE = '#543631'
const INK_BODY = '#7d5a3d'

type Props = {
  chapterId: string
  questions: readonly [QuizQuestion, QuizQuestion]
  attempt: Attempt | null
  /** Called after a successful submit or claim so the parent can re-sync. */
  onAttemptChange: (attempt: Attempt) => void
}

export default function ChapterQuiz({ chapterId, questions, attempt, onAttemptChange }: Props) {
  const [picked, setPicked] = useState<(number | null)[]>([null, null])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The result popup. Shown after submit, and again after a claim succeeds.
  const [popup, setPopup] = useState<'correct' | 'wrong' | 'claimed' | null>(null)

  const locked = attempt !== null
  const bothPicked = picked.every((p) => p !== null)
  const canClaim = attempt?.isCorrect === true && attempt.claimedAt === null

  const submit = async () => {
    if (busy || locked || !bothPicked) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/guidebook/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, answers: picked }),
      })
      const data = await res.json()
      if (!res.ok) {
        // A 409 means the attempt was already spent elsewhere (another tab, or
        // a stale page). Lock the UI to match the server rather than retrying.
        if (data.alreadyAttempted) {
          onAttemptChange({ chapterId, isCorrect: false, pointsAwarded: 0, claimedAt: null })
        }
        setError(data.error ?? 'Something went wrong.')
        return
      }
      onAttemptChange({
        chapterId,
        isCorrect: data.isCorrect,
        pointsAwarded: 0,
        claimedAt: null,
      })
      setPopup(data.isCorrect ? 'correct' : 'wrong')
    } catch {
      setError('Connection error. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const claim = async () => {
    if (busy || !canClaim) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/guidebook/quiz/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not claim those points.')
        return
      }
      onAttemptChange({
        chapterId,
        isCorrect: true,
        pointsAwarded: data.pointsAwarded,
        claimedAt: new Date().toISOString(),
      })
      setPopup('claimed')
    } catch {
      setError('Connection error. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className="rounded-[11px] px-2 py-2.5"
      style={{ backgroundColor: 'rgba(252,249,64,0.46)' }}
      data-tour="guidebook-quiz"
    >
      <h2
        className="text-center font-bytebounce text-[clamp(22px,7.6vw,30px)] leading-[0.78]"
        style={{ color: INK_TITLE }}
      >
        Chapter Quiz
      </h2>
      <p
        className="mt-1.5 text-center font-bytebounce text-[15px] leading-[0.95]"
        style={{ color: INK_BODY }}
      >
        Answer both correctly for +{POINTS_PER_CHAPTER} points. You only get one try.
      </p>

      {questions.map((q, qi) => (
        <fieldset key={q.prompt} className="mt-3 border-0 p-0">
          <legend
            className="font-bytebounce text-[17px] leading-[0.95]"
            style={{ color: INK_TITLE }}
          >
            {qi + 1}. {q.prompt}
          </legend>
          <div className="mt-1.5 flex flex-col gap-1">
            {q.options.map((opt, oi) => {
              const selected = picked[qi] === oi
              return (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-start gap-2 rounded-[7px] px-2 py-1.5 transition-colors ${
                    locked ? 'cursor-default opacity-70' : 'hover:bg-white/40'
                  }`}
                  style={{
                    backgroundColor: selected ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)',
                  }}
                >
                  <input
                    type="radio"
                    name={`${chapterId}-q${qi}`}
                    checked={selected}
                    disabled={locked}
                    onChange={() =>
                      setPicked((prev) => prev.map((p, i) => (i === qi ? oi : p)))
                    }
                    className="mt-1 shrink-0 accent-[#543631]"
                  />
                  <span
                    className="font-bytebounce text-[16px] leading-[0.95]"
                    style={{ color: INK_BODY }}
                  >
                    {opt}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      ))}

      {error && (
        <p className="mt-2 font-bytebounce text-[15px] leading-[0.95] text-[#c62828]">{error}</p>
      )}

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div className="mt-3 flex flex-col gap-2">
        {!locked && (
          <button
            type="button"
            onClick={submit}
            disabled={!bothPicked || busy}
            className="wood-plank px-3 py-2 font-bytebounce text-[22px] leading-none text-[#fff3d9] transition-transform active:translate-y-0.5 disabled:opacity-40"
            style={{ textShadow: '2px 2px 0 #3e2723' }}
          >
            {busy ? 'Submitting…' : 'Submit Answers'}
          </button>
        )}

        {/* Only reachable once the server graded both answers correct and the
            points are still unclaimed — this is the button's whole contract. */}
        {canClaim && (
          <button
            type="button"
            onClick={claim}
            disabled={busy}
            className="wood-plank px-3 py-2 font-bytebounce text-[22px] leading-none text-[#ffd23f] transition-transform active:translate-y-0.5 disabled:opacity-40"
            style={{ textShadow: '2px 2px 0 #3e2723' }}
          >
            {busy ? 'Claiming…' : `Claim +${POINTS_PER_CHAPTER} Points`}
          </button>
        )}

        {attempt?.claimedAt && (
          <p
            className="text-center font-bytebounce text-[17px] leading-none"
            style={{ color: '#2e7d32' }}
          >
            ✓ +{attempt.pointsAwarded || POINTS_PER_CHAPTER} points claimed
          </p>
        )}

        {locked && !attempt?.isCorrect && (
          <p
            className="text-center font-bytebounce text-[17px] leading-[0.95]"
            style={{ color: '#c62828' }}
          >
            Attempt used — no points for this chapter.
          </p>
        )}
      </div>

      {/* ── Result popup ────────────────────────────────────────────────── */}
      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setPopup(null)}
        >
          <div
            className="parchment-card w-full max-w-[320px] px-4 py-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-bytebounce text-[44px] leading-none">
              {popup === 'wrong' ? '❌' : popup === 'claimed' ? '🏆' : '✅'}
            </p>
            <h3
              className="mt-2 font-bytebounce text-[26px] leading-none"
              style={{ color: popup === 'wrong' ? '#c62828' : '#2e7d32' }}
            >
              {popup === 'wrong'
                ? 'Not quite!'
                : popup === 'claimed'
                  ? `+${POINTS_PER_CHAPTER} Points!`
                  : 'Both correct!'}
            </h3>
            <p
              className="mt-2 font-bytebounce text-[17px] leading-[0.95]"
              style={{ color: INK_BODY }}
            >
              {popup === 'wrong'
                ? 'That was your one try for this chapter. Read on — the other chapters still have points waiting.'
                : popup === 'claimed'
                  ? 'The points are on your account and in your activity log.'
                  : `Press "Claim +${POINTS_PER_CHAPTER} Points" to add them to your account.`}
            </p>
            <button
              type="button"
              onClick={() => setPopup(null)}
              className="wood-plank mt-4 w-full px-3 py-2 font-bytebounce text-[22px] leading-none text-[#fff3d9]"
              style={{ textShadow: '2px 2px 0 #3e2723' }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
