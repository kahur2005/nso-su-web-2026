// components/admin/DeleteCommitteeButton.tsx
'use client'
import { deleteCommitteeMember } from '@/app/admin/actions'

// Small client wrapper so the destructive `deleteCommitteeMember` action can
// be gated by a native confirm() dialog without turning the whole committee
// page into a client component just for this one control. Mirrors
// DeleteClubButton, but the confirm text carries the cascade warning specific
// to this action: deleting an NPC also deletes their ScanLog rows.
export default function DeleteCommitteeButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteCommitteeMember}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete "${name}"? This also deletes every scan of them, which lowers the ` +
              `collected-fun-fact count for students who had scanned them. Their points/xp ` +
              `are not recalculated and will stay as-is. This cannot be undone.`
          )
        ) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline flex-shrink-0"
      >
        Delete
      </button>
    </form>
  )
}
