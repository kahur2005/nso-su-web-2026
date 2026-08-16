// components/admin/QuestQuestionEditor.tsx
// Quiz question builder for admin quest edit. Frozen once any student answers.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveQuestQuestions } from '@/app/admin/quests/actions'

export type QuestionDraft = {
  prompt: string
  points: number
  options: { label: string; isCorrect: boolean }[]
}

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`
const labelClass = 'text-xs font-medium text-slate-500 block mb-1'

function emptyQuestion(): QuestionDraft {
  return {
    prompt: '',
    points: 5,
    options: [
      { label: '', isCorrect: true },
      { label: '', isCorrect: false },
    ],
  }
}

export default function QuestQuestionEditor({
  questId,
  initial,
  frozen,
}: {
  questId: string
  initial: QuestionDraft[]
  frozen: boolean
}) {
  const router = useRouter()
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initial.length > 0 ? initial : [emptyQuestion()],
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  function updateOption(
    qIndex: number,
    oIndex: number,
    patch: Partial<{ label: string; isCorrect: boolean }>,
  ) {
    setQuestions((prev) =>
      prev.map((q, qi) => {
        if (qi !== qIndex) return q
        const options = q.options.map((o, oi) => {
          if (oi !== oIndex) {
            if (patch.isCorrect) return { ...o, isCorrect: false }
            return o
          }
          return { ...o, ...patch }
        })
        return { ...q, options }
      }),
    )
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()])
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  function addOption(qIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: [...q.options, { label: '', isCorrect: false }] }
          : q,
      ),
    )
  }

  function removeOption(qIndex: number, oIndex: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex || q.options.length <= 2) return q
        const removed = q.options[oIndex]
        const options = q.options.filter((_, oi) => oi !== oIndex)
        if (removed.isCorrect && options.length > 0) {
          options[0] = { ...options[0], isCorrect: true }
        }
        return { ...q, options }
      }),
    )
  }

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0)

  async function handleSave() {
    setError(null)
    setPending(true)
    try {
      const formData = new FormData()
      formData.set('questId', questId)
      formData.set('questions', JSON.stringify(questions))
      const result = await saveQuestQuestions(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="border-t border-slate-200 pt-4 mt-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Quiz questions</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Total points: {totalPoints} (saved to the quest automatically)
          </p>
        </div>
        {!frozen && (
          <button
            type="button"
            onClick={addQuestion}
            className="text-sm text-blue-600 hover:underline"
          >
            Add question
          </button>
        )}
      </div>

      {frozen && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Questions are frozen after students answer. You can view but not edit them.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div
            key={qIndex}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium text-slate-600">Question {qIndex + 1}</p>
              {!frozen && questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="sm:col-span-3">
                <label className={labelClass}>Prompt</label>
                <input
                  value={q.prompt}
                  onChange={(e) => updateQuestion(qIndex, { prompt: e.target.value })}
                  disabled={frozen}
                  placeholder="What is the NSO theme song?"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Points</label>
                <input
                  type="number"
                  min={1}
                  value={q.points}
                  onChange={(e) =>
                    updateQuestion(qIndex, { points: parseInt(e.target.value, 10) || 0 })
                  }
                  disabled={frozen}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className={labelClass}>Options (select one correct answer)</p>
              {q.options.map((o, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={o.isCorrect}
                    onChange={() => updateOption(qIndex, oIndex, { isCorrect: true })}
                    disabled={frozen}
                    className="shrink-0"
                    aria-label={`Correct answer for question ${qIndex + 1}, option ${oIndex + 1}`}
                  />
                  <input
                    value={o.label}
                    onChange={(e) => updateOption(qIndex, oIndex, { label: e.target.value })}
                    disabled={frozen}
                    placeholder={`Option ${oIndex + 1}`}
                    className={inputClass}
                  />
                  {!frozen && q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(qIndex, oIndex)}
                      className="text-xs text-slate-400 hover:text-red-600 shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {!frozen && (
                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Add option
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!frozen && (
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? 'Saving questions…' : 'Save questions'}
        </button>
      )}
    </div>
  )
}
