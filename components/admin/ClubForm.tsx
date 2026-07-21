// components/admin/ClubForm.tsx
'use client'
import { useActionState, useState } from 'react'
import { createClub, type ClubFormState } from '@/app/admin/actions'

const initialState: ClubFormState = { warning: null }

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`

const labelClass = 'text-xs font-medium text-slate-500 block mb-1'

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5MB per file
const MAX_FILES = 12
// The server action's whole request is capped by next.config.ts's
// experimental.serverActions.bodySizeLimit (8mb). Several ordinary-sized
// files can each pass the per-file check yet still blow that combined
// budget, which fails during Next's request parsing — before the server
// action (and its `warning` state) ever runs. Keep comfortably under 8MB to
// leave headroom for the rest of the form fields and multipart overhead.
const MAX_TOTAL_BYTES = 7 * 1024 * 1024 // 7MB aggregate

export default function ClubForm() {
  const [state, formAction, pending] = useActionState(createClub, initialState)
  const [fileNames, setFileNames] = useState<string[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])

    if (files.length > MAX_FILES) {
      setFileError(`You selected ${files.length} images — the carousel is capped at ${MAX_FILES}. Please reselect.`)
      setFileNames([])
      e.target.value = ''
      return
    }

    const oversized = files.filter((f) => f.size > MAX_FILE_BYTES)
    if (oversized.length > 0) {
      setFileError(
        `${oversized.length} image(s) are over 5MB and won't be accepted: ${oversized.map((f) => f.name).join(', ')}`
      )
      setFileNames([])
      e.target.value = ''
      return
    }

    const totalBytes = files.reduce((sum, f) => sum + f.size, 0)
    if (totalBytes > MAX_TOTAL_BYTES) {
      const totalMb = (totalBytes / (1024 * 1024)).toFixed(1)
      setFileError(
        `Selected images total ${totalMb}MB, which is over the 7MB combined limit. Remove some images and try again.`
      )
      setFileNames([])
      e.target.value = ''
      return
    }

    setFileError(null)
    setFileNames(files.map((f) => f.name))
  }

  return (
    <div className="border border-slate-200 rounded-lg bg-white p-5 h-fit">
      <h2 className="text-sm font-medium text-slate-900 mb-3">New club</h2>

      <form action={formAction} className="space-y-3">
        <div>
          <label className={labelClass}>Name</label>
          <input
            name="name"
            className={inputClass}
            placeholder="e.g. Robotics Club"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <input
            name="category"
            className={inputClass}
            placeholder="e.g. Technology"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            rows={3}
            className={inputClass}
            placeholder="What the club is about"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Instagram URL</label>
          <input
            name="instagram"
            className={inputClass}
            placeholder="https://instagram.com/..."
          />
        </div>

        <div>
          <label className={labelClass}>Registration URL</label>
          <input
            name="registrationUrl"
            className={inputClass}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className={labelClass}>Images (carousel)</label>
          <input
            type="file"
            name="images"
            multiple
            accept="image/*"
            onChange={handleFilesChange}
            className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3
              file:rounded-md file:border file:border-slate-300 file:bg-white
              file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-50"
          />
          <p className="text-xs text-slate-500 mt-1">
            {fileNames.length === 0
              ? `No images selected — the club will be created with an empty carousel. Up to ${MAX_FILES} images, 5MB each.`
              : `${fileNames.length} image(s) selected: ${fileNames.join(', ')}`}
          </p>
          {fileError && (
            <p className="text-xs text-red-600 mt-1" aria-live="polite">{fileError}</p>
          )}
        </div>

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
          {pending ? 'Creating...' : 'Create club'}
        </button>
      </form>
    </div>
  )
}
