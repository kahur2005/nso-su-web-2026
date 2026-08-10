'use client'

import { useCallback, useEffect, useState } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

type QuizOption = { id: string; label: string }

type QuizQuestion = {
  id: string
  prompt: string
  points: number
  options: QuizOption[]
  locked: boolean
  selectedOptionId: string | null
}

type QuizData = {
  questions: QuizQuestion[]
  earnedPoints: number
  totalPoints: number
  isPerfect: boolean
  awardedThisSubmit?: number
  warning?: string
}

type Props = {
  questId: string
  disabled?: boolean
  onSubmitted?: () => void
}

export default function QuizPanel({ questId, disabled, onSubmitted }: Props) {
  const [data, setData] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [picks, setPicks] = useState<Record<string, string>>({})
  const [lastAwarded, setLastAwarded] = useState<number | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const loadQuiz = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/quests/${questId}/quiz`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Could not load quiz.')
        setData(null)
        return
      }
      setData(json as QuizData)
      const initial: Record<string, string> = {}
      for (const q of json.questions ?? []) {
        if (!q.locked && q.selectedOptionId) {
          initial[q.id] = q.selectedOptionId
        }
      }
      setPicks(initial)
    } catch {
      setError('Could not load quiz. Check your connection.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [questId])

  useEffect(() => {
    loadQuiz()
  }, [loadQuiz])

  const unlocked = data?.questions.filter((q) => !q.locked) ?? []
  const allUnlockedPicked =
    unlocked.length > 0 && unlocked.every((q) => picks[q.id] != null)
  const canSubmit = !disabled && !data?.isPerfect && allUnlockedPicked

  async function handleSubmit() {
    if (!canSubmit || !data) return
    setSubmitting(true)
    setError(null)
    setLastAwarded(null)
    setWarning(null)

    const answers = unlocked.map((q) => ({
      questionId: q.id,
      optionId: picks[q.id],
    }))

    try {
      const res = await fetch(`/api/quests/${questId}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Submit failed.')
        return
      }

      setData(json as QuizData)
      if (typeof json.awardedThisSubmit === 'number' && json.awardedThisSubmit > 0) {
        setLastAwarded(json.awardedThisSubmit)
      }
      if (json.warning === 'achievement_not_granted') {
        setWarning('Perfect score, but the badge could not be saved. Try submitting again.')
      }

      const nextPicks: Record<string, string> = {}
      for (const q of json.questions ?? []) {
        if (!q.locked && q.selectedOptionId) {
          nextPicks[q.id] = q.selectedOptionId
        }
      }
      setPicks(nextPicks)
      onSubmitted?.()
    } catch {
      setError('Submit failed. Check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded border-2 border-[#c9a97b] bg-[#fff8e7] px-4 py-6">
        <LoadingSpinner text="LOADING QUIZ..." />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="rounded border-2 border-[#c9a97b] bg-[#fff8e7] px-4 py-3">
        <p className="font-bytebounce text-[16px] leading-snug text-[#c62828]">{error}</p>
      </div>
    )
  }

  if (!data || data.questions.length === 0) {
    return (
      <div className="rounded border-2 border-[#c9a97b] bg-[#fff8e7] px-4 py-3">
        <p className="font-bytebounce text-[16px] leading-snug text-[#6d4c41]">
          No questions yet — check back soon.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded border-2 border-[#c9a97b] bg-[#fff8e7] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bytebounce text-[15px] leading-snug text-[#6d4c41]">
          {data.isPerfect
            ? '✅ Perfect score!'
            : 'Answer all questions. Correct ones lock — retry the rest.'}
        </p>
        <p className="font-bytebounce text-[15px] leading-none text-[#8a5a37]">
          {data.earnedPoints}/{data.totalPoints} pts
        </p>
      </div>

      {lastAwarded != null && lastAwarded > 0 && (
        <p className="font-bytebounce text-[16px] leading-snug text-[#33691e]">
          +{lastAwarded} points earned!
        </p>
      )}

      {warning && (
        <p className="font-bytebounce text-[14px] leading-snug text-[#e65100]">
          ⚠️ {warning}
        </p>
      )}

      {data.questions.map((q, qi) => (
        <fieldset key={q.id} className="space-y-2 border-0 p-0">
          <legend className="font-bytebounce text-[16px] leading-snug text-[#3e2723]">
            {qi + 1}. {q.prompt}
            <span className="ml-2 text-[14px] text-[#8a5a37]">(+{q.points})</span>
            {q.locked && (
              <span className="ml-2 text-[14px] text-[#4a7c2f]">✓</span>
            )}
          </legend>

          <div className="space-y-1.5">
            {q.options.map((opt) => {
              const selected = q.locked
                ? q.selectedOptionId === opt.id
                : picks[q.id] === opt.id
              return (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-start gap-2 rounded border px-2 py-1.5 transition-colors ${
                    q.locked
                      ? 'cursor-default border-[#7cb342] bg-[#f1f8e9] opacity-90'
                      : selected
                        ? 'border-[#8a5a37] bg-[#f5e0aa]'
                        : 'border-[#e0c9a0] bg-white/40 hover:bg-white/60'
                  }`}
                >
                  <input
                    type="radio"
                    name={`quiz-${questId}-${q.id}`}
                    checked={selected}
                    disabled={q.locked || disabled || submitting}
                    onChange={() =>
                      setPicks((prev) => ({ ...prev, [q.id]: opt.id }))
                    }
                    className="mt-0.5 shrink-0 accent-[#5d4037]"
                  />
                  <span className="font-bytebounce text-[14px] leading-snug text-[#6d4c41]">
                    {opt.label}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      ))}

      {error && (
        <p className="font-bytebounce text-[14px] text-[#c62828]">{error}</p>
      )}

      {disabled && (
        <p className="font-bytebounce text-[15px] text-[#a58962]">
          This quest is not open for quiz attempts yet.
        </p>
      )}

      {!disabled && !data.isPerfect && (
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
          className="rounded border-2 border-[#3a2418] bg-[#8a5a37] px-4 py-2 font-bytebounce text-[16px] leading-none text-[#ffd23f] disabled:opacity-50"
        >
          {submitting ? 'SUBMITTING…' : 'SUBMIT ANSWERS'}
        </button>
      )}

      {!disabled && data.isPerfect && (
        <p className="font-bytebounce text-[16px] leading-snug text-[#33691e]">
          All questions correct — quest complete!
        </p>
      )}
    </div>
  )
}
