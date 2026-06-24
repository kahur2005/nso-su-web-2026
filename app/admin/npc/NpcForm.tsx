// app/admin/npc/NpcForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PixelCard from '@/components/ui/PixelCard'
import PixelButton from '@/components/ui/PixelButton'

const inputClass = `w-full bg-gray-900 border-2 border-black text-white
  font-pixel text-xs p-3 focus:outline-none focus:border-green-500`

export default function NpcForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedQr, setGeneratedQr] = useState<string | null>(null)
  const [generatedName, setGeneratedName] = useState('')
  const [form, setForm] = useState({
    committeeName: '',
    role: '',
    funFact: '',
    points: 10,
  })

  // Composite the raw QR data-URL onto a canvas with the NPC name and the time
  // it was generated, returning a new PNG data-URL (used for display + download).
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

  function downloadQr() {
    if (!generatedQr) return
    const a = document.createElement('a')
    a.href = generatedQr
    a.download = `qr-${generatedName.trim().replace(/\s+/g, '-').toLowerCase() || 'npc'}.png`
    a.click()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setGeneratedQr(null)

    try {
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'FAILED TO CREATE NPC')
        return
      }

      const generatedAt = new Date(data.npc?.createdAt ?? Date.now()).toLocaleString()
      const labeled = await composeLabeledQr(data.qrCode, data.npc.committeeName, generatedAt)
      setGeneratedQr(labeled)
      setGeneratedName(data.npc.committeeName)
      setForm({ committeeName: '', role: '', funFact: '', points: 10 })
      router.refresh()
    } catch {
      setError('CONNECTION ERROR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PixelCard className="bg-gray-800">
      <h2 className="font-pixel text-sm text-white mb-4">➕ NEW NPC</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="font-pixel text-xs text-gray-400 block mb-1">
            COMMITTEE NAME
          </label>
          <input
            className={inputClass}
            value={form.committeeName}
            onChange={(e) => setForm({ ...form, committeeName: e.target.value })}
            placeholder="e.g. Budi Santoso"
            required
          />
        </div>

        <div>
          <label className="font-pixel text-xs text-gray-400 block mb-1">
            ROLE
          </label>
          <input
            className={inputClass}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="e.g. Event Division"
            required
          />
        </div>

        <div>
          <label className="font-pixel text-xs text-gray-400 block mb-1">
            FUN FACT
          </label>
          <textarea
            className={inputClass}
            rows={3}
            value={form.funFact}
            onChange={(e) => setForm({ ...form, funFact: e.target.value })}
            placeholder="A fun fact students collect when scanning"
            required
          />
        </div>

        <div>
          <label className="font-pixel text-xs text-gray-400 block mb-1">
            POINTS
          </label>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.points}
            onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })}
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-900 border-2 border-red-500">
            <p className="font-pixel text-xs text-red-300">❌ {error}</p>
          </div>
        )}

        <PixelButton type="submit" color="green" fullWidth disabled={loading}>
          {loading ? '⏳ GENERATING...' : '⚡ CREATE & GENERATE QR'}
        </PixelButton>
      </form>

      {/* Freshly generated QR */}
      {generatedQr && (
        <div className="mt-4 p-4 bg-gray-900 border-2 border-green-500 text-center">
          <p className="font-pixel text-xs text-green-400 mb-3">
            ✅ NPC CREATED! QR CODE READY:
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={generatedQr}
            alt={`Generated QR code for ${generatedName}`}
            className="mx-auto border-4 border-black bg-white max-w-[240px] w-full"
          />
          <div className="mt-4">
            <PixelButton type="button" color="blue" fullWidth onClick={downloadQr}>
              ⬇ DOWNLOAD QR
            </PixelButton>
          </div>
          <p className="font-pixel text-[8px] text-gray-400 mt-3">
            NAME & TIME ARE PRINTED ON THE IMAGE — OR FIND IT IN THE LIST BELOW
          </p>
        </div>
      )}
    </PixelCard>
  )
}
