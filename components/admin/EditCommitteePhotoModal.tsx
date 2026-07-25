// components/admin/EditCommitteePhotoModal.tsx
'use client'
import { useState, useTransition } from 'react'
import { updateCommitteeMemberPhoto } from '@/app/admin/actions'

interface EditCommitteePhotoModalProps {
  id: string
  name: string
  currentAvatarUrl: string | null
}

export default function EditCommitteePhotoModal({
  id,
  name,
  currentAvatarUrl,
}: EditCommitteePhotoModalProps) {
  const [open, setOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(currentAvatarUrl || '')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateCommitteeMemberPhoto(formData)
      setOpen(false)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 bg-white rounded px-2.5 py-1 transition-colors flex-shrink-0"
      >
        Edit Photo
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-lg p-5 max-w-md w-full shadow-xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Edit Photo: {name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload a new photo or paste an image URL directly.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="id" value={id} />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Upload image file
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-slate-300 file:bg-slate-50 hover:file:bg-slate-100"
                />
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-2 text-[11px] text-slate-400 uppercase font-medium">OR URL</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Direct Image URL
                </label>
                <input
                  type="url"
                  name="photoUrl"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {photoUrl && (
                <div className="flex items-center gap-2 pt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                  <span className="text-[11px] text-slate-500">Image Preview</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="text-xs font-medium text-slate-600 hover:bg-slate-100 rounded px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded px-4 py-1.5 disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
