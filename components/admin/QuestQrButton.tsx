// components/admin/QuestQrButton.tsx
// Generates (or regenerates) a quest's QR and previews it, mirroring the
// committee GenerateQrButton flow. Regenerating immediately retires the old
// printout — lib/scan/quest.ts rejects any token that is not the stored one —
// so a confirm is required when a code already exists.
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QrPreviewModal from './QrPreviewModal'

export default function QuestQrButton({
  questId,
  title,
  hasQr,
  qrCode,
}: {
  questId: string
  title: string
  hasQr: boolean
  qrCode: string | null
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function generate() {
    if (
      hasQr &&
      !confirm(
        `“${title}” already has a QR code. Generating a new one immediately stops the old printout from working. Continue?`
      )
    ) {
      return
    }

    setPending(true)
    try {
      const res = await fetch('/api/quests/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Could not generate the QR code.')
        return
      }
      setPreview(data.qrCode)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {hasQr && qrCode && (
        <button
          onClick={() => setPreview(qrCode)}
          className="text-sm text-blue-600 hover:underline"
        >
          View
        </button>
      )}
      <button
        onClick={generate}
        disabled={pending}
        className="text-sm text-blue-600 hover:underline disabled:opacity-50"
      >
        {pending ? 'Generating…' : hasQr ? 'Regenerate' : 'Generate QR'}
      </button>

      {preview && (
        <QrPreviewModal name={title} qrCode={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}
