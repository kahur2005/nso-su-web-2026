'use client'
import { deactivateCommitteeMember, toggleNpcActive } from '@/app/admin/actions'

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
