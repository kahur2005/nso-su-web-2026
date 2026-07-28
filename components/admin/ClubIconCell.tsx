// components/admin/ClubIconCell.tsx
'use client'
import { useActionState, useRef } from 'react'
import { updateClubIcon, type ClubFormState } from '@/app/admin/actions'

const initialState: ClubFormState = { warning: null }

// Shows a club's current tile icon and lets an admin replace it in place —
// picking a file submits immediately, so there is no extra save button in the
// row. Clubs created before icons existed show "None" until one is uploaded.
export default function ClubIconCell({
  id,
  name,
  iconUrl,
}: {
  id: string
  name: string
  iconUrl: string | null
}) {
  const [state, formAction] = useActionState(updateClubIcon, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />

      {iconUrl ? (
        <img
          src={iconUrl}
          alt={`${name} icon`}
          className="w-9 h-9 object-contain rounded border border-slate-200 bg-slate-50 shrink-0"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        <span className="w-9 h-9 shrink-0 rounded border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
          None
        </span>
      )}

      <label className="text-xs font-medium text-blue-600 hover:underline cursor-pointer">
        {iconUrl ? 'Replace' : 'Upload'}
        <input
          type="file"
          name="icon"
          accept="image/*"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>

      {state.warning && (
        <span className="text-xs text-red-600" aria-live="polite">{state.warning}</span>
      )}
    </form>
  )
}
