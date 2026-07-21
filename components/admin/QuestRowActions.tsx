// components/admin/QuestRowActions.tsx
// Activate/deactivate toggle and soft delete for one quest row.
'use client'
import { useState } from 'react'
import { toggleQuestActive, deleteQuest } from '@/app/admin/quests/actions'

export function QuestActiveToggle({
  id,
  isActive,
  hasQr,
}: {
  id: string
  isActive: boolean
  hasQr: boolean
}) {
  const [pending, setPending] = useState(false)

  return (
    <form
      action={async (formData) => {
        // Activating a quest with no code would put a quest students can see on
        // the board with no way to complete it.
        if (!isActive && !hasQr) {
          alert('Generate this quest’s QR code before activating it.')
          return
        }
        setPending(true)
        try {
          await toggleQuestActive(formData)
        } finally {
          setPending(false)
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="isActive" value={String(isActive)} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
          isActive
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {pending ? '…' : isActive ? 'Active' : 'Inactive'}
      </button>
    </form>
  )
}

export function DeleteQuestButton({
  id,
  title,
  completions,
}: {
  id: string
  title: string
  completions: number
}) {
  const [pending, setPending] = useState(false)

  return (
    <form
      action={async (formData) => {
        const note =
          completions > 0
            ? `\n\n${completions} student${completions === 1 ? '' : 's'} completed it. Their record is kept, but the quest disappears from the board.`
            : ''
        if (!confirm(`Delete “${title}”?${note}`)) return
        setPending(true)
        try {
          await deleteQuest(formData)
        } finally {
          setPending(false)
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? 'Deleting…' : 'Delete'}
      </button>
    </form>
  )
}
