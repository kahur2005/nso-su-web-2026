// components/admin/CommitteeForm.tsx
'use client'
// createCommitteeMember takes only FormData (no prevState), so this uses the
// same "build FormData from the form, call the action inside useTransition"
// pattern as PointsAdjustModal rather than useActionState (which expects a
// (prevState, formData) signature the action doesn't have).
import { useRef, useState, useTransition } from 'react'
import { DIVISIONS } from '@/lib/divisions'
import { createCommitteeMember } from '@/app/admin/actions'

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`

const labelClass = 'text-xs font-medium text-slate-500 block mb-1'

export default function CommitteeForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [fileName, setFileName] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await createCommitteeMember(formData)
      formRef.current?.reset()
      setFileName('')
    })
  }

  return (
    <div className="border border-slate-200 rounded-lg bg-white p-5 h-fit">
      <h2 className="text-sm font-medium text-slate-900 mb-3">New committee member</h2>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={labelClass}>Name</label>
          <input
            name="name"
            className={inputClass}
            placeholder="e.g. Budi Santoso"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Role</label>
          <input
            name="role"
            className={inputClass}
            placeholder="e.g. Event Division Head"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Division</label>
          <select name="division" className={inputClass} defaultValue="" required>
            <option value="" disabled>Select a division</option>
            {DIVISIONS.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Fun fact</label>
          <textarea
            name="funFact"
            rows={3}
            className={inputClass}
            placeholder="Revealed to students once they scan this member's QR"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Instagram</label>
          <input
            name="instagram"
            className={inputClass}
            placeholder="https://instagram.com/..."
          />
        </div>

        <div>
          <label className={labelClass}>Photo</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
            className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3
              file:rounded-md file:border file:border-slate-300 file:bg-white
              file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-50"
          />
          <p className="text-xs text-slate-500 mt-1">
            {fileName || 'No photo selected — a placeholder will show until one is uploaded.'}
          </p>
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          New members have no QR code until one is generated in QR &amp; Fun Facts.
        </p>

        <button
          type="submit"
          disabled={isPending}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white
            text-sm font-medium rounded-md px-4 py-2 transition-colors"
        >
          {isPending ? 'Adding...' : 'Add member'}
        </button>
      </form>
    </div>
  )
}
