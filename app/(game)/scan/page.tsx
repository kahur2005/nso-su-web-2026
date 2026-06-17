// app/(game)/scan/page.tsx
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
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

interface RecentScan {
  scannedAt: string
  pointsAwarded: number
  npc?: { committeeName?: string; rarity?: string }
}

export default function ScanPage() {
  const router = useRouter()
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [recentScans, setRecentScans] = useState<RecentScan[]>([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrRef = useRef<any>(null)            // Html5Qrcode instance
  const fileInputRef = useRef<HTMLInputElement>(null)
  const processingRef = useRef(false)        // guard against double-decode
  const startingRef = useRef(false)          // guard against overlapping starts

  const fetchRecentScans = useCallback(async () => {
    try {
      const res = await fetch('/api/qr/recent')
      const data = await res.json()
      setRecentScans(data.scans || [])
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRecentScans()
  }, [fetchRecentScans])

  const processScan = useCallback(async (scannedText: string) => {
    setLoading(true)
    try {
      let token = scannedText
      // Extract token from URL if the QR encodes the full scan link
      try {
        const url = new URL(scannedText)
        token = url.searchParams.get('token') || scannedText
      } catch {}

      const response = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await response.json()
      setResult(data)
      if (data.success) fetchRecentScans()
    } catch {
      setResult({ success: false, error: 'CONNECTION ERROR. TRY AGAIN.' })
    } finally {
      setLoading(false)
    }
  }, [fetchRecentScans])

  const getScanner = useCallback(async () => {
    if (!qrRef.current) {
      const { Html5Qrcode } = await import('html5-qrcode')
      qrRef.current = new Html5Qrcode('qr-reader')
    }
    return qrRef.current
  }, [])

  const stopCamera = useCallback(async () => {
    const scanner = qrRef.current
    if (scanner) {
      try { await scanner.stop() } catch {}
    }
    setCameraOn(false)
  }, [])

  const handleDecoded = useCallback(async (decodedText: string) => {
    if (processingRef.current) return
    processingRef.current = true
    await stopCamera()
    await processScan(decodedText)
    processingRef.current = false
  }, [stopCamera, processScan])

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    if (startingRef.current) return
    startingRef.current = true
    setCameraError(null)
    try {
      const scanner = await getScanner()
      try { await scanner.stop() } catch {}
      await scanner.start(
        { facingMode: mode },
        {
          fps: 10,
          qrbox: (vw: number, vh: number) => {
            const size = Math.floor(Math.min(vw, vh) * 0.8)
            return { width: size, height: size }
          },
          aspectRatio: 1,
        },
        (decodedText: string) => { handleDecoded(decodedText) },
        () => { /* ignore per-frame decode errors */ }
      )
      setCameraOn(true)
    } catch {
      setCameraError('CAMERA UNAVAILABLE — ALLOW ACCESS OR UPLOAD AN IMAGE')
      setCameraOn(false)
    } finally {
      startingRef.current = false
    }
  }, [getScanner, handleDecoded])

  // Auto-open the camera on the scanner view; stop it while a result is shown.
  // The #qr-reader element stays mounted (just hidden) so the scanner instance
  // keeps a valid DOM node across result toggles.
  useEffect(() => {
    if (result) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      stopCamera()
    } else {
      startCamera(facingMode)
    }
    // Restart only when entering/leaving the scanner view; flip is handled manually.
    // startingRef guards against overlapping starts (incl. StrictMode double-mount).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  // Tear down the scanner instance once, on unmount.
  useEffect(() => {
    return () => {
      const scanner = qrRef.current
      if (scanner) {
        scanner.stop().catch(() => {}).finally(() => {
          try { scanner.clear() } catch {}
          qrRef.current = null
        })
      }
    }
  }, [])

  const flipCamera = useCallback(async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    await startCamera(next)
  }, [facingMode, startCamera])

  const onUploadClick = () => fileInputRef.current?.click()

  const onFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    await stopCamera()
    setLoading(true)
    try {
      const scanner = await getScanner()
      const decodedText = await scanner.scanFile(file, false)
      await handleDecoded(decodedText)
    } catch {
      setResult({ success: false, error: 'NO QR CODE FOUND IN THAT IMAGE.' })
    } finally {
      setLoading(false)
    }
  }, [stopCamera, getScanner, handleDecoded])

  function resetScanner() {
    setResult(null) // triggers the effect that re-opens the camera
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

        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileSelected}
        />

        {/* Scanner Area — kept mounted (hidden under a result) so #qr-reader
            always exists in the DOM for the html5-qrcode instance. */}
        <div className={result ? 'hidden' : ''}>
          <PixelCard className="bg-gray-800 mb-6">
            <p className="font-pixel text-xs text-gray-400 text-center mb-4">
              POINT YOUR CAMERA AT A
              <br />
              <span className="text-green-400">COMMITTEE QR CODE</span>
              <br />
              TO COLLECT A FUN FACT!
            </p>

            {/* Camera viewfinder */}
            <div className="relative mx-auto w-full max-w-[280px]">
              {/* Pixel corner decorations + scan line (only while camera live) */}
              {cameraOn && (
                <>
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4
                    border-green-400 z-10 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4
                    border-green-400 z-10 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4
                    border-green-400 z-10 pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4
                    border-green-400 z-10 pointer-events-none" />
                  <div className="absolute left-0 right-0 h-0.5 bg-green-400 z-10 pointer-events-none"
                    style={{ animation: 'scanLine 2s linear infinite', top: '0%' }} />
                </>
              )}

              {/* html5-qrcode renders the live camera here */}
              <div id="qr-reader" className="w-full overflow-hidden border-4 border-green-500
                bg-gray-900 min-h-[200px]" />

              {/* Overlay shown when the camera could not start */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center
                  gap-3 bg-gray-900/95 border-4 border-red-700 p-4 text-center">
                  <span className="text-4xl">🚫</span>
                  <p className="font-pixel text-[10px] text-red-300 leading-relaxed">
                    {cameraError}
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-6 flex gap-3">
              <PixelButton onClick={flipCamera} color="blue" fullWidth>
                🔄 FLIP
              </PixelButton>
              <PixelButton onClick={onUploadClick} color="yellow" fullWidth>
                🖼️ UPLOAD
              </PixelButton>
            </div>

            {cameraError && (
              <div className="mt-3">
                <PixelButton onClick={() => startCamera(facingMode)} color="green" fullWidth>
                  ▶ RETRY CAMERA
                </PixelButton>
              </div>
            )}

            {loading && (
              <div className="text-center mt-4">
                <p className="font-pixel text-xs text-yellow-400 blink">
                  ⏳ PROCESSING SCAN...
                </p>
              </div>
            )}
          </PixelCard>
        </div>

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
                    &ldquo;{result.funFact}&rdquo;
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
