// components/admin/AchievementForm.tsx
// Create/edit form for an achievement badge. Doubles as both: pass an
// `achievement` to edit an existing one, omit it to create.
'use client'
import { useRef, useState } from 'react'
import { createAchievement, updateAchievement } from '@/app/admin/achievements/actions'

export interface AchievementRow {
  id: string
  name: string
  description: string
  imageUrl: string | null
}

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`
const labelClass = 'text-xs font-medium text-slate-500 block mb-1'

export default function AchievementForm({ achievement }: { achievement?: AchievementRow }) {
  const isEdit = Boolean(achievement)
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(!isEdit)
  const [pending, setPending] = useState(false)

  if (isEdit && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-blue-600 hover:underline"
      >
        Edit
      </button>
    )
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setPending(true)
        try {
          if (isEdit) await updateAchievement(formData)
          else await createAchievement(formData)
          formRef.current?.reset()
          if (isEdit) setOpen(false)
        } finally {
          setPending(false)
        }
      }}
      className="border border-slate-200 rounded-lg bg-white p-5 space-y-4"
    >
      {isEdit && <input type="hidden" name="id" value={achievement!.id} />}

      <h2 className="text-sm font-semibold text-slate-900">
        {isEdit ? 'Edit achievement' : 'New achievement'}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name</label>
          <input
            name="name"
            required
            defaultValue={achievement?.name}
            placeholder="Social Butterfly"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Badge image</label>
          <input type="file" name="image" accept="image/*" className={inputClass} />
          {isEdit && (
            <p className="text-xs text-slate-400 mt-1">
              Leave empty to keep the current badge.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="description"
          required
          rows={2}
          defaultValue={achievement?.description}
          placeholder="Visited every club booth at the fair."
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create achievement'}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
