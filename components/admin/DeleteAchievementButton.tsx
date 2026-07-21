// components/admin/DeleteAchievementButton.tsx
// Deleting an achievement is a real delete: StudentAchievement cascades, so any
// student who earned the badge loses it. The confirm says so explicitly when
// somebody has actually unlocked it.
'use client'
import { useState } from 'react'
import { deleteAchievement } from '@/app/admin/achievements/actions'

export default function DeleteAchievementButton({
  id,
  name,
  unlocked,
}: {
  id: string
  name: string
  unlocked: number
}) {
  const [pending, setPending] = useState(false)

  return (
    <form
      action={async (formData) => {
        const warning =
          unlocked > 0
            ? `${unlocked} student${unlocked === 1 ? ' has' : 's have'} earned “${name}”. Deleting it takes the badge away from them. Continue?`
            : `Delete “${name}”?`
        if (!confirm(warning)) return
        setPending(true)
        try {
          await deleteAchievement(formData)
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
