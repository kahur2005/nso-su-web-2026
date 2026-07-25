// app/admin/present/page.tsx
// Live 1-Time QR Presenter Page for Committee Members, Group Leaders, and Admins.
// Embedded cleanly within AdminShell with member search functionality.
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Search, RefreshCw, Shield, QrCode as QrIcon } from 'lucide-react'
import { divisionName } from '@/lib/divisions'

interface NpcOption {
  id: string
  committeeName: string
  role: string
  division: string | null
  points: number
}

const ROTATION_INTERVAL_SEC = 30

export default function AdminPresenterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [npcs, setNpcs] = useState<NpcOption[]>([])
  const [selectedNpcId, setSelectedNpcId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  const [qrCode, setQrCode] = useState<string | null>(null)
  const [fetchingQr, setFetchingQr] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(ROTATION_INTERVAL_SEC)
  const [selectedNpc, setSelectedNpc] = useState<NpcOption | null>(null)

  const isAuthorized =
    session?.user &&
    ((session.user as any).role === 'committee' ||
      (session.user as any).role === 'gl' ||
      (session.user as any).isAdmin)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch committee list on mount
  useEffect(() => {
    fetch('/api/committee')
      .then((res) => res.json())
      .then((data) => {
        const listRaw = data.members || data.committee || data.npcs || []
        const list: NpcOption[] = listRaw.map((m: any) => ({
          id: m.id,
          committeeName: m.committeeName || m.name || '',
          role: m.role || '',
          division: m.division || null,
          points: m.points ?? 0,
        }))
        setNpcs(list)
        if (list.length > 0) {
          setSelectedNpcId(list[0].id)
        }
      })
      .catch(() => setNpcs([]))
      .finally(() => setLoading(false))
  }, [])

  // Filtered list based on search query
  const filteredNpcs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return npcs
    return npcs.filter((n) => n.committeeName.toLowerCase().includes(q))
  }, [npcs, searchQuery])

  // Auto-select first matched option if active selection is filtered out
  useEffect(() => {
    if (filteredNpcs.length > 0 && !filteredNpcs.some((n) => n.id === selectedNpcId)) {
      setSelectedNpcId(filteredNpcs[0].id)
    }
  }, [filteredNpcs, selectedNpcId])

  const fetchLiveQr = useCallback(async (npcId: string) => {
    if (!npcId) return
    setFetchingQr(true)
    try {
      const res = await fetch(`/api/qr/live?npcId=${encodeURIComponent(npcId)}`)
      const data = await res.json()
      if (data.success && data.qrCode) {
        setQrCode(data.qrCode)
        setCountdown(ROTATION_INTERVAL_SEC)
        if (typeof data.points === 'number') {
          setSelectedNpc((prev) => (prev ? { ...prev, points: data.points } : prev))
        }
      }
    } catch {
      // Keep existing QR code on network error
    } finally {
      setFetchingQr(false)
    }
  }, [])

  // When selection changes
  useEffect(() => {
    if (!selectedNpcId) return
    const npc = npcs.find((n) => n.id === selectedNpcId) || null
    setSelectedNpc(npc)
    fetchLiveQr(selectedNpcId)
  }, [selectedNpcId, npcs, fetchLiveQr])

  // Countdown and auto-rotation timer
  useEffect(() => {
    if (!selectedNpcId || !qrCode) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchLiveQr(selectedNpcId)
          return ROTATION_INTERVAL_SEC
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [selectedNpcId, qrCode, fetchLiveQr])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 text-sm">
        <RefreshCw className="animate-spin mr-2" size={18} /> Loading presenter...
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-md mx-auto text-center border border-slate-200 bg-white rounded-xl shadow-sm">
        <Shield className="mx-auto text-red-500 mb-2" size={32} />
        <h1 className="text-lg font-semibold text-slate-900">Restricted Access</h1>
        <p className="mt-1 text-sm text-slate-600">
          Only Committee Members, Group Leaders, or Admins can access the Live QR Presenter.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
            <QrIcon size={22} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Live QR Presenter</h1>
            <p className="text-xs text-slate-500">
              Display live auto-refreshing QR code for students in line to scan.
            </p>
          </div>
        </div>

        {/* Member Search & Selector */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Select Committee Member Profile
          </label>

          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by member name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Member Dropdown */}
          <select
            value={selectedNpcId}
            onChange={(e) => setSelectedNpcId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {filteredNpcs.length === 0 ? (
              <option value="" disabled>No committee members match search</option>
            ) : (
              filteredNpcs.map((npc) => (
                <option key={npc.id} value={npc.id}>
                  {npc.committeeName} — {npc.role} ({divisionName(npc.division)})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Live QR Presenter Card */}
      {selectedNpc && (
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col items-center text-center">
          <span className="text-xs font-semibold tracking-widest text-amber-400 uppercase bg-amber-900/50 px-3 py-1 rounded-full border border-amber-700/50 mb-2">
            {divisionName(selectedNpc.division)}
          </span>

          <h2 className="text-2xl font-bold text-white">{selectedNpc.committeeName}</h2>
          <p className="text-sm text-slate-400 mt-0.5 mb-5">
            {selectedNpc.role} · <span className="text-amber-400 font-semibold">+{selectedNpc.points} pts</span>
          </p>

          {/* QR Display Container */}
          <div className="relative flex items-center justify-center rounded-xl bg-white p-4 w-[280px] h-[280px] shadow-inner">
            {qrCode ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrCode}
                alt={`Live QR Code for ${selectedNpc.committeeName}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <RefreshCw className="animate-spin mb-2" size={24} />
                <span className="text-xs font-medium">Generating QR...</span>
              </div>
            )}
          </div>

          {/* Rotation Progress Bar */}
          <div className="mt-5 w-full max-w-[280px]">
            <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5 font-medium">
              <span>🔄 Auto-rotates every 30s</span>
              <span className="text-amber-400 font-bold">{countdown}s</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-amber-400 transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / ROTATION_INTERVAL_SEC) * 100}%` }}
              />
            </div>
          </div>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => fetchLiveQr(selectedNpcId)}
            disabled={fetchingQr}
            className="mt-5 flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-semibold px-4 py-2 text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={fetchingQr ? 'animate-spin' : ''} />
            {fetchingQr ? 'Refreshing...' : 'Generate New Code Now'}
          </button>
        </div>
      )}

      {/* Security note */}
      <p className="text-center text-xs text-slate-500">
        🔒 Rolling QR presenter with short-lived tokens prevents off-site screenshot sharing.
      </p>
    </div>
  )
}
