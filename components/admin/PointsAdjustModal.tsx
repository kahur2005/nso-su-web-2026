'use client'
// Modal for manually adjusting a single player's points. Always routes through
// the `adjustPoints` server action (which calls the atomic `adjust_points` RPC),
// so xp/level/group totals stay in sync — never write a second points path here.
import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { adjustPoints } from '@/app/admin/actions'

export interface PointsAdjustStudent {
  studentId: string
  name: string
  points: number
}

export default function PointsAdjustModal({
  student,
  onClose,
}: {
  student: PointsAdjustStudent
  onClose: () => void
}) {
  const [mode, setMode] = useState<'add' | 'reduce'>('add')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = amount.trim()
    const parsed = Number(trimmed)

    if (!trimmed || !Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
      setError('Enter a positive whole number.')
      return
    }

    const signedAmount = mode === 'reduce' ? -parsed : parsed

    const formData = new FormData()
    formData.set('studentId', student.studentId)
    formData.set('amount', String(signedAmount))

    startTransition(async () => {
      await adjustPoints(formData)
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white border border-slate-200 rounded-lg shadow-lg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Adjust points</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {student.name} &middot; {student.studentId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Current points: <span className="font-medium text-slate-800">{student.points}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex rounded-md border border-slate-300 overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => setMode('add')}
              className={`flex-1 py-2 font-medium transition-colors ${
                mode === 'add'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setMode('reduce')}
              className={`flex-1 py-2 font-medium transition-colors border-l border-slate-300 ${
                mode === 'reduce'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Reduce
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Amount</label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setError(null)
              }}
              placeholder="e.g. 25"
              className="w-full bg-white border border-slate-300 rounded-md text-slate-800
                text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10
                focus:border-slate-400"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full text-sm font-medium text-white bg-slate-900 hover:bg-slate-800
              disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-4 py-2 transition-colors"
          >
            {isPending ? 'Applying…' : mode === 'add' ? 'Add points' : 'Reduce points'}
          </button>
        </form>
      </div>
    </div>
  )
}
