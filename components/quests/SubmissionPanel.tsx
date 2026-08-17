'use client'

import { useRef, useState } from 'react'
import type { QuestSubmissionStatus } from '@/lib/quests'

/** Matches guidebook / quest-card body copy. */
const BODY = 'font-bytebounce text-[24px] leading-[1.05]'

type Props = {
  questId: string
  submissionStatus: QuestSubmissionStatus
  disabled?: boolean
  onSubmitted: () => void
}

export default function SubmissionPanel({
  questId,
  submissionStatus,
  disabled,
  onSubmitted,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    !disabled &&
    submissionStatus !== 'awaiting_approval' &&
    submissionStatus !== 'approved'

  async function handleSubmit() {
    if (!canSubmit || files.length === 0) {
      setError('Add at least one file.')
      return
    }
    setSubmitting(true)
    setError(null)

    const form = new FormData()
    for (const file of files) {
      form.append('files', file)
    }

    try {
      const res = await fetch(`/api/quests/${questId}/submit`, {
        method: 'POST',
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Upload failed.')
        return
      }
      setFiles([])
      if (inputRef.current) inputRef.current.value = ''
      onSubmitted()
    } catch {
      setError('Upload failed. Check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submissionStatus === 'awaiting_approval') {
    return (
      <div className="rounded border-2 border-[#c9a97b] bg-[#fff8e7] px-4 py-3">
        <p className={`${BODY} text-[#6d4c41]`}>
          ⏳ Your submission is waiting for committee review.
        </p>
      </div>
    )
  }

  if (submissionStatus === 'approved') {
    return (
      <div className="rounded border-2 border-[#7cb342] bg-[#f1f8e9] px-4 py-3">
        <p className={`${BODY} text-[#33691e]`}>✅ Submission approved!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded border-2 border-[#c9a97b] bg-[#fff8e7] px-4 py-3">
      {submissionStatus === 'rejected' && (
        <p className={`${BODY} text-[#c62828]`}>
          ❌ Your last submission was rejected. You can upload again.
        </p>
      )}

      {canSubmit && (
        <>
          <p className={`${BODY} text-[#6d4c41]`}>
            Upload photos or PDFs (max 10 files). JPEG, PNG, WebP, or PDF.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            disabled={submitting}
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? [])
              setFiles(picked.slice(0, 10))
              setError(null)
            }}
            className={`block w-full ${BODY} text-[#5d4037] file:mr-3 file:rounded file:border-2 file:border-[#3a2418] file:bg-[#8a5a37] file:px-3 file:py-1.5 file:font-bytebounce file:text-[20px] file:text-[#ffd23f]`}
          />

          {files.length > 0 && (
            <ul className={`space-y-1 ${BODY} text-[#6d4c41]`}>
              {files.map((f) => (
                <li key={`${f.name}-${f.size}`} className="truncate">
                  • {f.name}
                </li>
              ))}
            </ul>
          )}

          {error && <p className={`${BODY} text-[#c62828]`}>{error}</p>}

          <button
            type="button"
            disabled={submitting || files.length === 0}
            onClick={handleSubmit}
            className="rounded border-2 border-[#3a2418] bg-[#8a5a37] px-4 py-2 font-bytebounce text-[24px] leading-none text-[#ffd23f] disabled:opacity-50"
          >
            {submitting ? 'UPLOADING…' : 'SUBMIT FILES'}
          </button>
        </>
      )}

      {disabled && submissionStatus !== 'rejected' && (
        <p className={`${BODY} text-[#a58962]`}>
          This quest is not open for submissions yet.
        </p>
      )}
    </div>
  )
}
