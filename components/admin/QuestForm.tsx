// components/admin/QuestForm.tsx
// Create/edit form for a QR quest. Pass a `quest` to edit, omit it to create.
'use client'
import { useRef, useState } from 'react'
import { createQuest, updateQuest } from '@/app/admin/quests/actions'

export interface QuestRow {
  id: string
  title: string
  description: string
  points: number
  achievementId: string | null
}

export interface AchievementOption {
  id: string
  name: string
}

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`
const labelClass = 'text-xs font-medium text-slate-500 block mb-1'

export default function QuestForm({
  quest,
  achievements,
}: {
  quest?: QuestRow
  achievements: AchievementOption[]
}) {
  const isEdit = Boolean(quest)
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(!isEdit)
  const [pending, setPending] = useState(false)

  if (isEdit && !open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-blue-600 hover:underline">
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
          if (isEdit) await updateQuest(formData)
          else await createQuest(formData)
          formRef.current?.reset()
          if (isEdit) setOpen(false)
        } finally {
          setPending(false)
        }
      }}
      className="border border-slate-200 rounded-lg bg-white p-5 space-y-4"
    >
      {isEdit && <input type="hidden" name="id" value={quest!.id} />}

      <h2 className="text-sm font-semibold text-slate-900">
        {isEdit ? 'Edit quest' : 'New quest'}
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className={labelClass}>Title</label>
          <input
            name="title"
            required
            defaultValue={quest?.title}
            placeholder="Visit the club fair"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Points</label>
          <input
            name="points"
            type="number"
            min={1}
            required
            defaultValue={quest?.points ?? 10}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="description"
          required
          rows={2}
          defaultValue={quest?.description}
          placeholder="Talk to three club booths, then scan the QR at the info desk."
          className={inputClass}
        />
        <p className="text-xs text-slate-400 mt-1">
          Students see this before they complete the quest, so tell them where to
          go and what to do.
        </p>
      </div>

      <div>
        <label className={labelClass}>Grants achievement (optional)</label>
        <select
          name="achievementId"
          defaultValue={quest?.achievementId ?? ''}
          className={inputClass}
        >
          <option value="">None</option>
          {achievements.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {achievements.length === 0 && (
          <p className="text-xs text-slate-400 mt-1">
            No achievements exist yet — create one under Achievements first.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create quest'}
        </button>
        {isEdit ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        ) : (
          <p className="text-xs text-slate-500">
            New quests start inactive — generate and print the QR, then activate.
          </p>
        )}
      </div>
    </form>
  )
}
