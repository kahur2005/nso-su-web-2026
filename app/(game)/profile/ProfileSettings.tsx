'use client'
// app/(game)/profile/ProfileSettings.tsx
// Edit-profile panel styled in the wood-plank / parchment design system.
// Collapsed by default — the user taps "Edit Profile" to expand.
import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateProfile } from './actions'

const LABEL_SHADOW = '1px 1px 0 #3e2723'
const TEXT_SHADOW  = '1.5px 1.5px 0 #3e2723'

const inputClass = [
  'w-full rounded border-2 border-[#b08a5e] bg-[#fdf3e3]',
  'font-bytebounce text-[16px] text-[#3e2723] leading-none',
  'px-3 py-2.5 placeholder:text-[#b08a5e]',
  'focus:outline-none focus:border-[#8a5c2e] focus:ring-0',
].join(' ')

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full wood-plank py-3 font-bytebounce text-[20px] leading-none transition-all
        hover:brightness-110 active:translate-y-0.5 disabled:opacity-60"
      style={{ color: '#ffd23f', textShadow: '2px 2px 0 #3e2723' }}
    >
      {pending ? '⏳ SAVING...' : '💾 Save Changes'}
    </button>
  )
}

export default function ProfileSettings({
  name,
  instagram,
  avatarSkin,
  avatarHair,
  avatarEyes,
  avatarBrows,
}: {
  name: string
  instagram: string
  avatarSkin?: string | null
  avatarHair?: string | null
  avatarEyes?: string | null
  avatarBrows?: string | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="wood-plank px-4 py-2.5 flex items-center gap-3 w-full transition-all hover:brightness-110"
      >
        <span className="text-[22px]">⚙️</span>
        <h2
          className="font-bytebounce text-[26px] leading-none text-[#ffd23f] flex-1 text-left"
          style={{ textShadow: '2.5px 2.5px 0 #3e2723' }}
        >
          Edit Profile
        </h2>
        <span
          className={`font-bytebounce text-[22px] text-[#ffd23f] transition-transform ${open ? 'rotate-90' : ''}`}
          style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
        >
          ▶
        </span>
      </button>

      {open && (
        <div className="rounded border-2 border-[#b08a5e] bg-[#f5e7c6] px-4 py-4">
          <form action={updateProfile} className="flex flex-col gap-3">

            {/* Name */}
            <div>
              <label
                className="font-bytebounce text-[14px] text-[#7d5a3d] block mb-1"
                style={{ textShadow: LABEL_SHADOW }}
              >
                Display Name
              </label>
              <input
                name="name"
                className={inputClass}
                defaultValue={name}
                placeholder="Your display name"
                required
              />
            </div>

            {/* Instagram */}
            <div>
              <label
                className="font-bytebounce text-[14px] text-[#7d5a3d] block mb-1"
                style={{ textShadow: LABEL_SHADOW }}
              >
                Instagram (optional)
              </label>
              <input
                name="instagram"
                className={inputClass}
                defaultValue={instagram}
                placeholder="@yourhandle"
              />
            </div>

            <SubmitButton />
          </form>
        </div>
      )}
    </div>
  )
}
