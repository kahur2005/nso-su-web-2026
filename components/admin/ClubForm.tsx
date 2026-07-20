// components/admin/ClubForm.tsx
'use client'
import { useRef, useState, useTransition } from 'react'
import { createClub } from '@/app/admin/actions'

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`

const labelClass = 'text-xs font-medium text-slate-500 block mb-1'

export default function ClubForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [fileNames, setFileNames] = useState<string[]>([])
  const [warning, setWarning] = useState<string | null>(null)

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileNames(Array.from(e.target.files ?? []).map((f) => f.name))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setWarning(null)

    startTransition(async () => {
      const result = await createClub(formData)
      if (result?.warning) {
        setWarning(result.warning)
      }
      formRef.current?.reset()
      setFileNames([])
    })
  }

  return (
    <div className="border border-slate-200 rounded-lg bg-white p-5 h-fit">
      <h2 className="text-sm font-medium text-slate-900 mb-3">New club</h2>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
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
              ? 'No images selected — the club will be created with an empty carousel.'
              : `${fileNames.length} image(s) selected: ${fileNames.join(', ')}`}
          </p>
        </div>

        {warning && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-700">{warning}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white
            text-sm font-medium rounded-md px-4 py-2 transition-colors"
        >
          {isPending ? 'Creating...' : 'Create club'}
        </button>
      </form>
    </div>
  )
}
