'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatJakartaDateTime } from '@/lib/time'

// Combines the QR image, name, and timestamp into a single canvas data URL.
function composeLabeledQr(qrDataUrl: string, name: string, generatedAt: string) {
  return new Promise<string>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const pad = 24
      const qrSize = 400
      const footerH = 104
      const canvas = document.createElement('canvas')
      canvas.width = qrSize + pad * 2
      canvas.height = pad + qrSize + footerH
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(qrDataUrl)

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, pad, pad, qrSize, qrSize)

      ctx.textAlign = 'center'
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 30px sans-serif'
      ctx.fillText(name, canvas.width / 2, pad + qrSize + 46, qrSize)
      ctx.fillStyle = '#555555'
      ctx.font = '18px sans-serif'
      ctx.fillText(`Generated: ${generatedAt}`, canvas.width / 2, pad + qrSize + 80, qrSize)

      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(qrDataUrl)
    img.src = qrDataUrl
  })
}

export default function GenerateQrButton({
  npcId,
  name,
  hasQr,
}: {
  npcId: string
  name: string
  hasQr: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    if (hasQr && !confirm(`Regenerate the QR for "${name}"? The old printout will stop working.`)) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npcId }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to generate QR')
        return
      }

      const generatedAt = formatJakartaDateTime(data.npc?.createdAt ?? Date.now())
      const labeled = await composeLabeledQr(data.qrCode, data.npc?.committeeName || name, generatedAt)

      const a = document.createElement('a')
      a.href = labeled
      a.download = `qr-${name.trim().replace(/\s+/g, '-').toLowerCase() || 'npc'}.png`
      a.click()

      router.refresh()
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end flex-shrink-0">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline
          disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? 'Generating...' : hasQr ? 'Regenerate QR' : 'Generate QR'}
      </button>
      {error && <p className="text-[11px] text-red-600 mt-0.5">{error}</p>}
    </div>
  )
}
