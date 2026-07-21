// components/admin/CommitteeForm.tsx
'use client'
import { useActionState, useState } from 'react'
import { DIVISIONS } from '@/lib/divisions'
import { createCommitteeMember, type CommitteeFormState } from '@/app/admin/actions'

const initialState: CommitteeFormState = { warning: null }

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`

const labelClass = 'text-xs font-medium text-slate-500 block mb-1'

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5MB

export default function CommitteeForm() {
  const [state, formAction, pending] = useActionState(createCommitteeMember, initialState)
  const [fileName, setFileName] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      setFileName('')
      setFileError(null)
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`"${file.name}" is over 5MB. Please choose a smaller photo.`)
      setFileName('')
      e.target.value = ''
      return
    }
    setFileError(null)
    setFileName(file.name)
  }

  return (
    <div className="border border-slate-200 rounded-lg bg-white p-5 h-fit">
      <h2 className="text-sm font-medium text-slate-900 mb-3">New committee member</h2>

      <form action={formAction} className="space-y-3">
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
            placeholder="@handle or instagram.com/handle"
          />
        </div>

        <div>
          <label className={labelClass}>Photo</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3
              file:rounded-md file:border file:border-slate-300 file:bg-white
              file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-50"
          />
          <p className="text-xs text-slate-500 mt-1">
            {fileName || 'No photo selected — a placeholder will show until one is uploaded. Max 5MB.'}
          </p>
          {fileError && (
            <p className="text-xs text-red-600 mt-1" aria-live="polite">{fileError}</p>
          )}
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          New members have no QR code until one is generated in QR &amp; Fun Facts.
        </p>

        {state?.warning && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-700" aria-live="polite">{state.warning}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={pending || Boolean(fileError)}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white
            text-sm font-medium rounded-md px-4 py-2 transition-colors"
        >
          {pending ? 'Adding...' : 'Add member'}
        </button>
      </form>
    </div>
  )
}
