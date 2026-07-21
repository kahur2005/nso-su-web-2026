// components/admin/DeleteClubButton.tsx
'use client'
import { deleteClub } from '@/app/admin/actions'

// Small client wrapper so the destructive `deleteClub` action can be gated by
// a native confirm() dialog without turning the whole clubs page into a
// client component just for this one control.
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
