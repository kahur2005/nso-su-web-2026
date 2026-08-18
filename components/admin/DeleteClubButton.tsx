'use client'
import { deleteClub } from '@/app/admin/actions'

export default function DeleteClubButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteClub}
      onSubmit={(e) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
      >
        Delete
      </button>
    </form>
  )
}
