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
  const [form, setForm] = useState({
    committeeName: '',
    role: '',
    funFact: '',
    rarity: 'common',
    points: 10,
  })

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

      setGeneratedQr(data.qrCode)
      setForm({ committeeName: '', role: '', funFact: '', rarity: 'common', points: 10 })
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-pixel text-xs text-gray-400 block mb-1">
              RARITY
            </label>
            <select
              className={inputClass}
              value={form.rarity}
              onChange={(e) => setForm({ ...form, rarity: e.target.value })}
            >
              <option value="common">★ COMMON</option>
              <option value="rare">★★ RARE</option>
              <option value="epic">★★★ EPIC</option>
              <option value="legendary">★★★★ LEGENDARY</option>
            </select>
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
            alt="Generated QR code"
            className="mx-auto border-4 border-black bg-white"
            width={200}
            height={200}
          />
          <p className="font-pixel text-[8px] text-gray-400 mt-3">
            RIGHT-CLICK TO SAVE — OR FIND IT IN THE LIST BELOW
          </p>
        </div>
      )}
    </PixelCard>
  )
}
