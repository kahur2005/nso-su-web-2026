// components/admin/DeactivateCommitteeButton.tsx
'use client'
import { deactivateCommitteeMember, toggleNpcActive } from '@/app/admin/actions'

// Small client wrapper so the deactivate/reactivate actions can be gated by a
// native confirm() dialog without turning the whole committee page into a
// client component just for this one control. Mirrors DeleteClubButton in
// shape, but the underlying action is a soft delete (isActive = false, see
// deactivateCommitteeMember in app/admin/actions.ts) — it preserves the
// member's ScanLog rows and points already awarded to students, it only hides
// them from /map/committee. Reactivating (isActive = true) reuses the same
// toggleNpcActive flip used on /admin/qr and needs no confirmation since it
// isn't destructive.
export default function DeactivateCommitteeButton({
  id,
  name,
  isActive,
}: {
  id: string
  name: string
  isActive: boolean
}) {
  if (!isActive) {
    return (
      <form action={toggleNpcActive.bind(null, id)}>
        <button
          type="submit"
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex-shrink-0"
        >
          Reactivate
        </button>
      </form>
    )
  }

  return (
    <form
      action={deactivateCommitteeMember}
      onSubmit={(e) => {
        if (
          !confirm(
            `Deactivate "${name}"? They will disappear from the committee page students see and their QR ` +
              `code will stop awarding points, but their scan history and any points already earned by ` +
              `students stay exactly as they are. You can reactivate them later from this page.`
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
        Deactivate
      </button>
    </form>
  )
}
