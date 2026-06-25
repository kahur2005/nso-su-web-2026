'use client'
import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import PixelCard from '@/components/ui/PixelCard'
import PixelButton from '@/components/ui/PixelButton'
import Avatar from '@/components/ui/Avatar'
import { updateProfile } from './actions'

const inputClass = `w-full bg-gray-900 border-2 border-black text-white
  font-pixel text-xs p-3 focus:outline-none focus:border-green-500`

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <PixelButton type="submit" color="green" fullWidth disabled={pending}>
      {pending ? '⏳ SAVING...' : '💾 SAVE CHANGES'}
    </PixelButton>
  )
}

export default function ProfileSettings({
  name,
  instagram,
  avatarUrl,
}: {
  name: string
  instagram: string
  avatarUrl?: string | null
}) {
  const [preview, setPreview] = useState<string | null>(null)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  // Local preview wins; otherwise show the current saved picture.
  const shownAvatar = preview ?? avatarUrl

  return (
    <PixelCard className="bg-gray-800 mb-6">
      <h3 className="font-pixel text-sm text-white mb-4">⚙️ EDIT PROFILE</h3>

      <form action={updateProfile} className="space-y-3">
        {/* Profile picture */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-green-700 border-4 border-black flex items-center
            justify-center text-3xl overflow-hidden flex-shrink-0"
            style={{ boxShadow: '4px 4px 0 #000' }}>
            <Avatar avatarUrl={shownAvatar} fallback="🧑‍🎓" />
          </div>
          <div className="flex-1">
            <label className="font-pixel text-xs text-gray-400 block mb-1">
              PROFILE PICTURE
            </label>
            <input
              name="avatarImage"
              type="file"
              accept="image/*"
              onChange={onFile}
              className={`${inputClass} file:mr-3 file:border-0 file:bg-green-600
                file:text-white file:font-pixel file:text-[8px] file:px-2 file:py-1`}
            />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="font-pixel text-xs text-gray-400 block mb-1">NAME</label>
          <input name="name" className={inputClass} defaultValue={name}
            placeholder="Your display name" required />
        </div>

        {/* Instagram */}
        <div>
          <label className="font-pixel text-xs text-gray-400 block mb-1">
            INSTAGRAM (OPTIONAL)
          </label>
          <input name="instagram" className={inputClass} defaultValue={instagram}
            placeholder="@yourhandle or full link" />
        </div>

        <SubmitButton />
      </form>
    </PixelCard>
  )
}
