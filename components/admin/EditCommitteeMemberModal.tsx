'use client'

import { useState, useTransition } from 'react'
import { updateCommitteeMember } from '@/app/admin/actions'
import { DIVISIONS } from '@/lib/divisions'
import type { CommitteeRow } from './CommitteeSearchableList'

interface EditCommitteeMemberModalProps {
  member: CommitteeRow
}

export default function EditCommitteeMemberModal({ member }: EditCommitteeMemberModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(member.committeeName)
  const [role, setRole] = useState(member.role)
  const [division, setDivision] = useState(member.division || DIVISIONS[0].id)
  const [funFact, setFunFact] = useState(member.funFact)
  const [points, setPoints] = useState(member.points ?? 10)
  const [photoUrl, setPhotoUrl] = useState(member.avatarUrl || '')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateCommitteeMember(formData)
      setOpen(false)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-300 bg-white hover:bg-slate-50 rounded px-2.5 py-1 transition-colors flex-shrink-0"
      >
        Edit Member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-lg p-5 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 text-left">
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Edit Committee Member
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Update member details, division assignment, points, and photo.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="hidden" name="id" value={member.id} />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Member Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  name="role"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Division
                </label>
                <select
                  name="division"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {DIVISIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Fun Fact
                </label>
                <textarea
                  name="funFact"
                  required
                  rows={2}
                  value={funFact}
                  onChange={(e) => setFunFact(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Points Awarded on Scan
                </label>
                <input
                  type="number"
                  name="points"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Upload Photo (Optional)
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-slate-300 file:bg-slate-50 hover:file:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Direct Photo URL (Optional)
                </label>
                <input
                  type="url"
                  name="photoUrl"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
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
                  <span className="text-[11px] text-slate-500">Photo Preview</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
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
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
