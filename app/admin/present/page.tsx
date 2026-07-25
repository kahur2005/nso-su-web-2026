// app/admin/present/page.tsx
// Mobile Live 1-Time QR Presenter Page for Committee Members, Group Leaders, and Admins.
// Displays a high-contrast auto-refreshing QR code (rotates every 30 seconds).
// Uses stateless short-lived JWTs (valid for 60 seconds) so screenshot sharing
// off-site is prevented, while keeping DB load at 0.
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface NpcOption {
  id: string
  committeeName: string
  role: string
  division: string | null
  points: number
}

const OUTLINE_GOLD = {
  color: '#ffd23f',
  textShadow:
    '3px 3px 0 #4e342e, -3px 3px 0 #4e342e, 3px -3px 0 #4e342e, -3px -3px 0 #4e342e, 0 5px 0 #4e342e',
}

const ROTATION_INTERVAL_SEC = 30

export default function AdminPresenterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [npcs, setNpcs] = useState<NpcOption[]>([])
  const [selectedNpcId, setSelectedNpcId] = useState<string>('')
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
      <PageWrapper>
        <LoadingSpinner text="LOADING PRESENTER..." />
      </PageWrapper>
    )
  }

  if (!isAuthorized) {
    return (
      <PageWrapper>
        <div className="game-column py-12 text-center">
          <h1 className="font-bytebounce text-[28px] text-[#ffd23f]" style={OUTLINE_GOLD}>
            RESTRICTED ACCESS
          </h1>
          <p className="mt-2 font-bytebounce text-[18px] text-white">
            Only Committee Members, Group Leaders, or Admins can access the QR Presenter.
          </p>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="game-column min-h-dvh flex flex-col justify-between py-4 px-3">
        {/* Header */}
        <div>
          <h1
            className="text-center font-bytebounce text-[clamp(2.2rem,10vw,3rem)] leading-none"
            style={OUTLINE_GOLD}
          >
            LIVE QR PRESENTER
          </h1>
          <p
            className="mt-1 text-center font-bytebounce text-[16px] text-white"
            style={{ textShadow: '1.5px 1.5px 0 #4e342e' }}
          >
            Show code for students in line to scan
          </p>

          {/* Committee member selector */}
          <div className="mt-4 rounded-md border-2 border-[#3a2418] bg-[#fdf6e3] p-3">
            <label className="block font-bytebounce text-[15px] text-[#5d4330] mb-1">
              Select Committee Member Profile:
            </label>
            <select
              value={selectedNpcId}
              onChange={(e) => setSelectedNpcId(e.target.value)}
              className="w-full rounded border-2 border-[#3a2418] bg-white px-3 py-2 font-bytebounce text-[18px] text-[#3e2723] focus:outline-none"
            >
              {npcs.map((npc) => (
                <option key={npc.id} value={npc.id}>
                  {npc.committeeName} ({npc.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live QR Display Box */}
        {selectedNpc && (
          <div className="my-4 flex flex-col items-center justify-center rounded-lg border-4 border-[#3a2418] bg-[#f5e7c6] p-4 text-center shadow-lg">
            <h2 className="font-bytebounce text-[24px] uppercase text-[#3e2723]">
              {selectedNpc.committeeName}
            </h2>
            <p className="font-bytebounce text-[16px] text-[#8a5a37] mb-3">
              {selectedNpc.role} · <span className="text-[#b8860b]">+{selectedNpc.points} pts</span>
            </p>

            {/* QR Code Container */}
            <div className="relative flex items-center justify-center rounded-md border-2 border-[#3a2418] bg-white p-2 w-[280px] h-[280px]">
              {qrCode ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrCode}
                  alt={`1-Time QR Code for ${selectedNpc.committeeName}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <LoadingSpinner text="GENERATING QR..." />
              )}
            </div>

            {/* Countdown Progress Bar */}
            <div className="mt-4 w-full max-w-[280px]">
              <div className="flex justify-between items-center font-bytebounce text-[15px] text-[#5d4330] mb-1">
                <span>🔄 Auto-rotates every 30s</span>
                <span className="font-bold text-[#b8860b]">{countdown}s</span>
              </div>
              <div className="h-2.5 w-full rounded-full border border-[#3a2418] bg-[#e0d3ae] overflow-hidden">
                <div
                  className="h-full bg-[#fbc94c] transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / ROTATION_INTERVAL_SEC) * 100}%` }}
                />
              </div>
            </div>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={() => fetchLiveQr(selectedNpcId)}
              disabled={fetchingQr}
              className="mt-3 rounded border-2 border-[#3a2418] bg-[#8a5a37] px-4 py-1.5 font-bytebounce text-[16px] text-[#ffd23f] active:translate-y-0.5 disabled:opacity-50"
            >
              {fetchingQr ? 'Refreshing...' : '⚡ Generate New Code Now'}
            </button>
          </div>
        )}

        {/* Security badge */}
        <p
          className="text-center font-bytebounce text-[14px] text-[#e0b391]"
          style={{ textShadow: '1px 1px 0 #4e342e' }}
        >
          🔒 Live rolling QR presenter · Prevents off-site screenshot sharing
        </p>
      </div>
    </PageWrapper>
  )
}
