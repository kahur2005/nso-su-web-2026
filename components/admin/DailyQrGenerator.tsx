// components/admin/DailyQrGenerator.tsx
'use client'
import { useState } from 'react'

interface NpcItem {
  id: string
  committeeName: string
  role: string
  points: number
}

interface QuestItem {
  id: string
  title: string
  points: number
}

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`
const labelClass = 'text-xs font-medium text-slate-500 block mb-1'

export default function DailyQrGenerator({
  npcs,
  quests,
}: {
  npcs: NpcItem[]
  quests: QuestItem[]
}) {
  const [targetType, setTargetType] = useState<'npc' | 'quest'>('npc')
  const [targetId, setTargetId] = useState<string>(npcs[0]?.id || '')
  const [validFrom, setValidFrom] = useState<string>('')
  const [validUntil, setValidUntil] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrLabel, setQrLabel] = useState<string>('')

  // Set today preset
  function setTodayPreset(startHour: string, endHour: string) {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    setValidFrom(`${dateStr}T${startHour}`)
    setValidUntil(`${dateStr}T${endHour}`)
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setQrCode(null)

    try {
      if (targetType === 'npc') {
        const res = await fetch('/api/qr/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            npcId: targetId,
            validFrom: validFrom || undefined,
            validUntil: validUntil || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to generate Daily QR')
          return
        }
        setQrCode(data.qrCode)
        setQrLabel(`Daily QR — ${data.npc?.committeeName || 'Committee'}`)
      } else {
        const res = await fetch('/api/quests/qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questId: targetId,
            validFrom: validFrom || undefined,
            validUntil: validUntil || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to generate Daily Quest QR')
          return
        }
        setQrCode(data.qrCode)
        setQrLabel(`Daily Quest — ${data.quest?.title || 'Quest'}`)
      }
    } catch {
      setError('Connection error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-slate-200 rounded-lg bg-white p-5 space-y-4 max-w-2xl">
      <h2 className="text-sm font-semibold text-slate-800">Generate Daily QR Code</h2>

      <form onSubmit={handleGenerate} className="space-y-4">
        {/* Type toggle */}
        <div>
          <label className={labelClass}>Target Type</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setTargetType('npc')
                setTargetId(npcs[0]?.id || '')
              }}
              className={`flex-1 py-2 text-sm font-medium border rounded-md transition-colors ${
                targetType === 'npc'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Committee Member (NPC)
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetType('quest')
                setTargetId(quests[0]?.id || '')
              }}
              className={`flex-1 py-2 text-sm font-medium border rounded-md transition-colors ${
                targetType === 'quest'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Quest Mission
            </button>
          </div>
        </div>

        {/* Target Selector */}
        <div>
          <label className={labelClass}>
            Select {targetType === 'npc' ? 'Committee Member' : 'Quest'}
          </label>
          <select
            className={inputClass}
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            required
          >
            {targetType === 'npc'
              ? npcs.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.committeeName} ({n.role}) — +{n.points} pts
                  </option>
                ))
              : quests.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} — +{q.points} pts
                  </option>
                ))}
          </select>
        </div>

        {/* Date Window & Presets */}
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <label className={labelClass}>Active Time Window</label>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                className="text-slate-600 underline hover:text-slate-900"
                onClick={() => setTodayPreset('08:00', '12:00')}
              >
                Morning (08-12)
              </button>
              <button
                type="button"
                className="text-slate-600 underline hover:text-slate-900"
                onClick={() => setTodayPreset('12:00', '17:00')}
              >
                Afternoon (12-17)
              </button>
              <button
                type="button"
                className="text-slate-600 underline hover:text-slate-900"
                onClick={() => setTodayPreset('00:00', '23:59')}
              >
                Full Day
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Valid From</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Valid Until</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md py-2.5 transition-colors disabled:opacity-50"
        >
          {loading ? 'Minting Daily QR...' : 'Mint Daily QR Code'}
        </button>
      </form>

      {/* Result Display */}
      {qrCode && (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-md text-center">
          <p className="text-sm font-medium text-slate-800 mb-2">{qrLabel}</p>
          <p className="text-xs text-slate-500 mb-3">
            Window: {validFrom ? new Date(validFrom).toLocaleString() : '—'} to{' '}
            {validUntil ? new Date(validUntil).toLocaleString() : '—'}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCode}
            alt={qrLabel}
            className="mx-auto border border-slate-300 rounded-md bg-white max-w-[240px] w-full"
          />
          <a
            href={qrCode}
            download="daily-qr.png"
            className="mt-3 inline-block w-full text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md py-2 hover:bg-slate-50 transition-colors"
          >
            Download Daily QR
          </a>
        </div>
      )}
    </div>
  )
}
