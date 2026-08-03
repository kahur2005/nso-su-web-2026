// components/guidebook/ChapterQuiz.tsx
// End-of-chapter quiz: two questions, one submit, one try.
//
// The lock is server-side (GuidebookQuizAttempt's unique (studentId, chapterId)) —
// everything here is presentation on top of an `attempt` the parent fetched.
// Submitting spends the attempt whether the answers were right or wrong, and
// the Claim button only exists once the server has said both were right.
'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { QuizQuestion } from '@/lib/guidebook/quiz'
import { POINTS_PER_CHAPTER } from '@/lib/guidebook/quiz'
// This renders inside the guidebook's `container-type: inline-size` book, so it
// is sized on the same 387px design grid as the page around it. See scale.ts.
import { cqw, TYPE } from '@/lib/guidebook/scale'

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
      style={{
        backgroundColor: 'rgba(252,249,64,0.46)',
        borderRadius: cqw(11),
        padding: `${cqw(10)} ${cqw(8)}`,
      }}
      data-tour="guidebook-quiz"
    >
      <h2
        className="text-center font-bytebounce leading-[0.78]"
        style={{ color: INK_TITLE, fontSize: cqw(30, TYPE) }}
      >
        Chapter Quiz
      </h2>
      <p
        className="text-center font-bytebounce leading-[0.95]"
        style={{ color: INK_BODY, fontSize: cqw(15, TYPE), marginTop: cqw(6) }}
      >
        Answer both correctly for +{POINTS_PER_CHAPTER} points. You only get one try.
      </p>

      {questions.map((q, qi) => (
        <fieldset key={q.prompt} className="border-0 p-0" style={{ marginTop: cqw(12) }}>
          <legend
            className="font-bytebounce leading-[0.95]"
            style={{ color: INK_TITLE, fontSize: cqw(17, TYPE) }}
          >
            {qi + 1}. {q.prompt}
          </legend>
          <div className="flex flex-col" style={{ marginTop: cqw(6), gap: cqw(4) }}>
            {q.options.map((opt, oi) => {
              const selected = picked[qi] === oi
              return (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-start transition-colors ${
                    locked ? 'cursor-default opacity-70' : 'hover:bg-white/40'
                  }`}
                  style={{
                    backgroundColor: selected ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)',
                    borderRadius: cqw(7),
                    gap: cqw(8),
                    // The whole row is the tap target, so this padding is what
                    // keeps an option comfortably tappable on a phone.
                    padding: `${cqw(6)} ${cqw(8)}`,
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
                    className="shrink-0 accent-[#543631]"
                    style={{ marginTop: cqw(4) }}
                  />
                  <span
                    className="font-bytebounce leading-[0.95]"
                    style={{ color: INK_BODY, fontSize: cqw(16, TYPE) }}
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
        <p
          className="font-bytebounce leading-[0.95] text-[#c62828]"
          style={{ fontSize: cqw(15, TYPE), marginTop: cqw(8) }}
        >
          {error}
        </p>
      )}

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div className="flex flex-col" style={{ marginTop: cqw(12), gap: cqw(8) }}>
        {!locked && (
          <button
            type="button"
            onClick={submit}
            disabled={!bothPicked || busy}
            className="wood-plank font-bytebounce leading-none text-[#fff3d9] transition-transform active:translate-y-0.5 disabled:opacity-40"
            style={{
              textShadow: '2px 2px 0 #3e2723',
              fontSize: cqw(22, TYPE),
              padding: `${cqw(8)} ${cqw(12)}`,
            }}
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
            className="wood-plank font-bytebounce leading-none text-[#ffd23f] transition-transform active:translate-y-0.5 disabled:opacity-40"
            style={{
              textShadow: '2px 2px 0 #3e2723',
              fontSize: cqw(22, TYPE),
              padding: `${cqw(8)} ${cqw(12)}`,
            }}
          >
            {busy ? 'Claiming…' : `Claim +${POINTS_PER_CHAPTER} Points`}
          </button>
        )}

        {attempt?.claimedAt && (
          <p
            className="text-center font-bytebounce leading-none"
            style={{ color: '#2e7d32', fontSize: cqw(17, TYPE) }}
          >
            ✓ +{attempt.pointsAwarded || POINTS_PER_CHAPTER} points claimed
          </p>
        )}

        {locked && !attempt?.isCorrect && (
          <p
            className="text-center font-bytebounce leading-[0.95]"
            style={{ color: '#c62828', fontSize: cqw(17, TYPE) }}
          >
            Attempt used — no points for this chapter.
          </p>
        )}
      </div>

      {/* ── Result popup ──────────────────────────────────────────────────
          Portalled to <body>, and that is load-bearing, not tidiness: the
          guidebook book wrapper sets `container-type: inline-size`, which
          implies `contain: layout`, which makes it the containing block for
          *fixed* descendants too. Rendered in place, this dialog would be
          trapped inside the book instead of covering the viewport.

          Also deliberately still in px, not cqw. It is anchored to the viewport,
          so it must not scale with the book — cqw here would resolve against
          the book container and shrink the dialog on a phone. */}
      {popup &&
        createPortal(
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
                className="mt-2 font-bytebounce text-[19px] leading-[1.05]"
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
          </div>,
          document.body,
        )}
    </section>
  )
}
