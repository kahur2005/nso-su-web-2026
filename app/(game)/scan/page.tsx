// app/(game)/scan/page.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import PixelButton from '@/components/ui/PixelButton'

const rarityConfig = {
  common: { color: '#9E9E9E', label: 'COMMON', stars: '★', bg: 'bg-gray-700' },
  rare: { color: '#2196F3', label: 'RARE', stars: '★★', bg: 'bg-blue-900' },
  epic: { color: '#9C27B0', label: 'EPIC', stars: '★★★', bg: 'bg-purple-900' },
  legendary: { color: '#FFD700', label: 'LEGENDARY', stars: '★★★★', bg: 'bg-yellow-900' },
}

interface ScanResult {
  success: boolean
  npcName?: string
  npcRole?: string
  funFact?: string
  rarity?: string
  pointsAwarded?: number
  error?: string
  alreadyCollected?: boolean
}

export default function ScanPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [recentScans, setRecentScans] = useState<any[]>([])
  const scannerRef = useRef<any>(null)
  const scannerDivRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchRecentScans()
  }, [])

  async function fetchRecentScans() {
    try {
      const res = await fetch('/api/qr/recent')
      const data = await res.json()
      setRecentScans(data.scans || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (!scanning) return

    let html5QrcodeScanner: any

    async function startScanner() {
      const { Html5QrcodeScanner } = await import('html5-qrcode')

      html5QrcodeScanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        false
      )

      html5QrcodeScanner.render(
        async (decodedText: string) => {
          html5QrcodeScanner.clear()
          setScanning(false)
          await processScan(decodedText)
        },
        (error: any) => { /* ignore scan errors */ }
      )

      scannerRef.current = html5QrcodeScanner
    }

    startScanner()

    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.clear() } catch (e) {}
      }
    }
  }, [scanning])

  async function processScan(scannedText: string) {
    setLoading(true)
    try {
      let token = scannedText
      // Extract token from URL if needed
      try {
        const url = new URL(scannedText)
        token = url.searchParams.get('token') || scannedText
      } catch {}

      const response = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        fetchRecentScans()
      }
    } catch {
      setResult({ success: false, error: 'CONNECTION ERROR. TRY AGAIN.' })
    } finally {
      setLoading(false)
    }
  }

  function resetScanner() {
    setResult(null)
    setScanning(false)
  }

  const rarity = result?.rarity
    ? rarityConfig[result.rarity as keyof typeof rarityConfig]
    : null

  return (
    <PageWrapper>
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="font-pixel text-lg text-white text-center mb-6"
          style={{ textShadow: '3px 3px 0 #000' }}>
          📱 SCAN QR CODE
        </h1>

        {/* Scanner Area */}
        {!result && (
          <PixelCard className="bg-gray-800 mb-6">
            <p className="font-pixel text-xs text-gray-400 text-center mb-4">
              FIND A COMMITTEE MEMBER
              <br />
              <span className="text-green-400">SCAN THEIR QR CODE</span>
              <br />
              TO COLLECT A FUN FACT!
            </p>

            {/* Camera viewfinder */}
            <div className="relative mx-auto" style={{ width: 'fit-content' }}>
              {/* Pixel corner decorations */}
              {scanning && (
                <>
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4
                    border-green-400 z-10" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4
                    border-green-400 z-10" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4
                    border-green-400 z-10" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4
                    border-green-400 z-10" />
                  {/* Scan line animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-green-400 z-10"
                    style={{ animation: 'scanLine 2s linear infinite', top: '0%' }} />
                </>
              )}

              {!scanning ? (
                <div className="w-64 h-64 bg-gray-900 border-4 border-gray-700
                  flex flex-col items-center justify-center gap-4">
                  <span className="text-6xl float">📷</span>
                  <p className="font-pixel text-xs text-gray-500 text-center">
                    CAMERA OFFLINE
                  </p>
                </div>
              ) : (
                <div id="qr-reader" ref={scannerDivRef}
                  className="border-4 border-green-500"
                  style={{ width: '300px' }} />
              )}
            </div>

            {/* Controls */}
            <div className="mt-6 flex flex-col gap-3">
              {!scanning ? (
                <PixelButton
                  onClick={() => setScanning(true)}
                  color="green"
                  fullWidth
                >
                  ▶ START SCANNING
                </PixelButton>
              ) : (
                <PixelButton
                  onClick={() => {
                    if (scannerRef.current) {
                      try { scannerRef.current.clear() } catch {}
                    }
                    setScanning(false)
                  }}
                  color="red"
                  fullWidth
                >
                  ⏹ STOP SCANNING
                </PixelButton>
              )}
            </div>

            {loading && (
              <div className="text-center mt-4">
                <p className="font-pixel text-xs text-yellow-400 blink">
                  ⏳ PROCESSING SCAN...
                </p>
              </div>
            )}
          </PixelCard>
        )}

        {/* Scan Result - RPG Dialog Style */}
        {result && (
          <div className="mb-6">
            {result.success ? (
              <div className="rpg-dialog p-6 text-center"
                style={{
                  borderColor: rarity?.color,
                  boxShadow: `0 0 30px ${rarity?.color}40, 6px 6px 0 #000`
                }}>
                {/* NPC Info */}
                <div className="mb-4">
                  <div className="w-20 h-20 mx-auto bg-gray-700 border-4 border-black
                    flex items-center justify-center text-3xl mb-3"
                    style={{ boxShadow: '4px 4px 0 #000' }}>
                    👤
                  </div>
                  <p className="font-pixel text-xs text-gray-400">
                    💬 {result.npcName} ({result.npcRole}) SAYS:
                  </p>
                </div>

                {/* Fun Fact */}
                <div className="p-4 bg-gray-900 border-2 border-gray-700 mb-4"
                  style={{ borderColor: rarity?.color }}>
                  <p className="font-pixel text-xs text-white leading-relaxed">
                    "{result.funFact}"
                  </p>
                </div>

                {/* Rarity & Points */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <span className="font-pixel text-xs px-3 py-1 border-2"
                    style={{ color: rarity?.color, borderColor: rarity?.color }}>
                    {rarity?.stars} {rarity?.label}
                  </span>
                  <span className="font-pixel text-xl text-yellow-400"
                    style={{ textShadow: '2px 2px 0 #000' }}>
                    +{result.pointsAwarded} PTS!
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <PixelButton onClick={resetScanner} color="green" fullWidth>
                    SCAN AGAIN
                  </PixelButton>
                  <PixelButton
                    onClick={() => router.push('/codex')}
                    color="blue"
                    fullWidth
                  >
                    VIEW CODEX
                  </PixelButton>
                </div>
              </div>
            ) : (
              <PixelCard className="bg-red-900/50 border-red-500">
                <div className="text-center p-4">
                  <span className="text-4xl">❌</span>
                  <p className="font-pixel text-sm text-red-300 mt-4">
                    {result.alreadyCollected
                      ? 'ALREADY COLLECTED!'
                      : 'SCAN FAILED!'
                    }
                  </p>
                  <p className="font-pixel text-xs text-gray-400 mt-2">
                    {result.error}
                  </p>
                  <div className="mt-4">
                    <PixelButton onClick={resetScanner} color="gray" fullWidth>
                      TRY AGAIN
                    </PixelButton>
                  </div>
                </div>
              </PixelCard>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <PixelCard className="bg-gray-800 text-center">
            <p className="font-pixel text-xs text-gray-400">TODAY&apos;S SCANS</p>
            <p className="font-pixel text-2xl text-yellow-400 mt-1">
              {recentScans.filter(s => {
                const today = new Date().toDateString()
                return new Date(s.scannedAt).toDateString() === today
              }).length}
            </p>
          </PixelCard>
          <PixelCard className="bg-gray-800 text-center">
            <p className="font-pixel text-xs text-gray-400">TOTAL COLLECTED</p>
            <p className="font-pixel text-2xl text-purple-400 mt-1">
              {recentScans.length}
            </p>
          </PixelCard>
        </div>

        {/* Recent Scans */}
        <div>
          <h3 className="font-pixel text-sm text-white mb-3">🕐 RECENT SCANS</h3>
          <div className="space-y-2">
            {recentScans.slice(0, 5).map((scan, i) => {
              const r = rarityConfig[scan.npc?.rarity as keyof typeof rarityConfig] || rarityConfig.common
              return (
                <PixelCard key={i} className="bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-pixel text-xs text-white">
                        ✅ {scan.npc?.committeeName}
                      </p>
                      <p className="font-pixel text-xs mt-1"
                        style={{ color: r.color }}>
                        {r.stars} {r.label}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-pixel text-xs text-yellow-400">
                        +{scan.pointsAwarded} pts
                      </p>
                      <p className="font-pixel text-xs text-gray-500">
                        {new Date(scan.scannedAt).toLocaleTimeString('en', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </PixelCard>
              )
            })}
            {recentScans.length === 0 && (
              <PixelCard className="bg-gray-800">
                <p className="font-pixel text-xs text-gray-500 text-center py-4">
                  NO SCANS YET — GO FIND AN NPC!
                </p>
              </PixelCard>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}