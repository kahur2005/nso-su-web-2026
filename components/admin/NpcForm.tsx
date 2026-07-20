// components/admin/NpcForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DIVISIONS } from '@/lib/divisions'

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`

const labelClass = 'text-xs font-medium text-slate-500 block mb-1'

export default function NpcForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedQr, setGeneratedQr] = useState<string | null>(null)
  const [generatedName, setGeneratedName] = useState('')
  const [form, setForm] = useState({
    committeeName: '',
    role: '',
    division: '',
    instagram: '',
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
        setError(data.error || 'Failed to create NPC')
        return
      }

      const generatedAt = new Date(data.npc?.createdAt ?? Date.now()).toLocaleString()
      const labeled = await composeLabeledQr(data.qrCode, data.npc.committeeName, generatedAt)
      setGeneratedQr(labeled)
      setGeneratedName(data.npc.committeeName)
      setForm({ committeeName: '', role: '', division: '', instagram: '', funFact: '', points: 10 })
      router.refresh()
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-slate-200 rounded-lg bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-800 mb-4">New committee member</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={labelClass}>Committee name</label>
          <input
            className={inputClass}
            value={form.committeeName}
            onChange={(e) => setForm({ ...form, committeeName: e.target.value })}
            placeholder="e.g. Budi Santoso"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Role</label>
          <input
            className={inputClass}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="e.g. Event Division"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Division</label>
          <select
            className={inputClass}
            value={form.division}
            onChange={(e) => setForm({ ...form, division: e.target.value })}
          >
            <option value="">Unassigned</option>
            {DIVISIONS.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Instagram</label>
          <input
            className={inputClass}
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            placeholder="e.g. @budisantoso"
          />
        </div>

        <div>
          <label className={labelClass}>Fun fact</label>
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
          <label className={labelClass}>Points</label>
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full text-sm font-medium text-white bg-slate-900 hover:bg-slate-800
            disabled:opacity-50 rounded-md px-4 py-2 transition-colors"
        >
          {loading ? 'Generating...' : 'Create & generate QR'}
        </button>
      </form>

      {/* Freshly generated QR */}
      {generatedQr && (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-md text-center">
          <p className="text-sm text-slate-700 mb-3">
            NPC created — QR code ready
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={generatedQr}
            alt={`Generated QR code for ${generatedName}`}
            className="mx-auto border border-slate-300 rounded-md bg-white max-w-[240px] w-full"
          />
          <div className="mt-4">
            <button
              type="button"
              onClick={downloadQr}
              className="w-full text-sm font-medium text-slate-700 bg-white border border-slate-300
                hover:bg-slate-50 rounded-md px-4 py-2 transition-colors"
            >
              Download QR
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Name & time are printed on the image — or find it in the list below
          </p>
        </div>
      )}
    </div>
  )
}
