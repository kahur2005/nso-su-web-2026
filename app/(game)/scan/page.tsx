'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'
import PageIntro from '@/components/onboarding/PageIntro'
import PixelCard from '@/components/ui/PixelCard'
import PixelButton from '@/components/ui/PixelButton'
import WoodButton from '@/components/ui/WoodButton'
import RecentScansPopup from './RecentScansPopup'
import { isSameJakartaDay } from '@/lib/time'

const ACCENT = '#4CAF50'

interface ScanResult {
  success: boolean
  kind?: 'npc' | 'quest'
  npcName?: string
  npcRole?: string
  funFact?: string
  questTitle?: string
  questDescription?: string
  achievement?: { name: string; description: string; imageUrl: string | null } | null
  pointsAwarded?: number
  error?: string
  alreadyCollected?: boolean
  alreadyCompleted?: boolean
}

interface RecentScan {
  scannedAt: string
  pointsAwarded: number
  npc?: { committeeName?: string }
}

export default function ScanPage() {
  const router = useRouter()
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [recentScans, setRecentScans] = useState<RecentScan[]>([])
  const [totalScans, setTotalScans] = useState(0)
  const [showRecent, setShowRecent] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const processingRef = useRef(false)
  const startingRef = useRef(false)
  const startPromiseRef = useRef<Promise<unknown> | null>(null)
  const unmountedRef = useRef(false)

  const fetchRecentScans = useCallback(async () => {
    try {
      const res = await fetch('/api/qr/recent')
      const data = await res.json()
      setRecentScans(data.scans || [])
      setTotalScans(data.total ?? (data.scans?.length || 0))
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
    try { await startPromiseRef.current } catch {}
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
      if (unmountedRef.current) return
      try { await scanner.stop() } catch {}
      const startPromise = scanner.start(
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
        () => {}
      )
      startPromiseRef.current = startPromise
      await startPromise
      if (unmountedRef.current) {
        try { await scanner.stop() } catch {}
        try { scanner.clear() } catch {}
        qrRef.current = null
        return
      }
      setCameraOn(true)
    } catch (e) {
      console.error('camera start failed:', e)
      setCameraError('CAMERA UNAVAILABLE — ALLOW ACCESS OR UPLOAD AN IMAGE')
      setCameraOn(false)
    } finally {
      startingRef.current = false
      startPromiseRef.current = null
    }
  }, [getScanner, handleDecoded])

  useEffect(() => {
    unmountedRef.current = false

    // Intercept media play to catch unhandled abort errors during navigation.
    const nativePlay = HTMLMediaElement.prototype.play
    function playWithHandler(this: HTMLMediaElement) {
      const playing = nativePlay.call(this)
      playing?.catch(() => {})
      return playing
    }
    HTMLMediaElement.prototype.play = playWithHandler

    return () => {
      unmountedRef.current = true
      if (HTMLMediaElement.prototype.play === playWithHandler) {
        HTMLMediaElement.prototype.play = nativePlay
      }
      const teardown = async () => {
        try { await startPromiseRef.current } catch {}
        const scanner = qrRef.current
        if (!scanner) return
        try { await scanner.stop() } catch {}
        try { scanner.clear() } catch {}
        qrRef.current = null
      }
      teardown()
    }
  }, [])

  useEffect(() => {
    if (result) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      stopCamera()
    } else {
      startCamera(facingMode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  const flipCamera = useCallback(async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    await startCamera(next)
  }, [facingMode, startCamera])

  const onUploadClick = () => fileInputRef.current?.click()

  const onFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
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
    setResult(null)
  }

  return (
    <PageWrapper>
      <PageIntro page="scan" />
      {/* Forest artwork background (scan-page section of the grand design) */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(/images/scan/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          imageRendering: 'pixelated',
        }}
      />

      <div className="max-w-lg mx-auto px-4 py-4">
        <h1 className="title-gold font-bytebounce text-fluid-6xl leading-none text-center mb-4">
          Scan QR Code
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
          {/* Paper panel */}
          <div
            className="px-7 py-6 mb-4"
            style={{
              backgroundImage: 'url(/images/scan/paper.png)',
              backgroundSize: '100% 100%',
              imageRendering: 'pixelated',
            }}
          >
            <div className="font-bytebounce text-fluid-md leading-[0.8] text-[#7d5a3d] text-center mb-3">
              <p>Point your camera at a</p>
              <p className="text-[#2eaa31]">Committee QR Code</p>
              <p>to get a fun fact!</p>
            </div>

            {/* Camera viewfinder */}
            <div className="relative mx-auto w-full max-w-[250px]" data-tour="scan-camera">
              {/* Pixel corner decorations + scan line (only while camera live) */}
              {cameraOn && (
                <>
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4
                    border-[#2eaa31] z-10 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4
                    border-[#2eaa31] z-10 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4
                    border-[#2eaa31] z-10 pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4
                    border-[#2eaa31] z-10 pointer-events-none" />
                  <div className="absolute left-0 right-0 h-0.5 bg-[#2eaa31] z-10 pointer-events-none"
                    style={{ animation: 'scanLine 2s linear infinite', top: '0%' }} />
                </>
              )}

              {/* html5-qrcode renders the live camera here */}
              <div id="qr-reader" className="w-full overflow-hidden border-4 border-[#2eaa31]
                bg-[#3e2723] min-h-[200px]" />

              {/* Overlay shown when the camera could not start */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center
                  gap-3 bg-[#3e2723]/95 border-4 border-red-700 p-4 text-center">
                  <span className="text-4xl">🚫</span>
                  <p className="font-pixel text-fluid-2xs text-red-300 leading-relaxed">
                    {cameraError}
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-5 flex gap-4 justify-center" data-tour="scan-controls">
              <WoodButton onClick={flipCamera} className="h-[54px] flex-1 max-w-[130px]" textClassName="text-fluid-4xl">
                Flip
              </WoodButton>
              <WoodButton onClick={onUploadClick} className="h-[54px] flex-1 max-w-[130px]" textClassName="text-fluid-4xl">
                Upload
              </WoodButton>
            </div>

            <div className="mt-3 flex justify-center">
              {cameraOn ? (
                <WoodButton onClick={stopCamera} className="h-[54px] w-full max-w-[276px]" textClassName="text-fluid-3xl">
                  Close Camera
                </WoodButton>
              ) : (
                <WoodButton onClick={() => startCamera(facingMode)} className="h-[54px] w-full max-w-[276px]" textClassName="text-fluid-3xl">
                  {cameraError ? 'Retry Camera' : 'Start Camera'}
                </WoodButton>
              )}
            </div>

            {loading && (
              <div className="text-center mt-3">
                <p className="font-bytebounce text-fluid-md text-[#7d5a3d] blink">
                  Processing scan...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Scan Result - RPG Dialog Style */}
        {result && (
          <div className="mb-6">
            {result.success ? (
              <div className="rpg-dialog p-6 text-center"
                style={{
                  borderColor: ACCENT,
                  boxShadow: `0 0 30px ${ACCENT}40, 6px 6px 0 #000`
                }}>
                {result.kind === 'quest' ? (
                  <>
                    {/* Quest header */}
                    <div className="mb-4">
                      <div className="w-20 h-20 mx-auto bg-gray-700 border-4 border-black
                        flex items-center justify-center text-3xl mb-3"
                        style={{ boxShadow: '4px 4px 0 #000' }}>
                        ⚔️
                      </div>
                      <p className="font-pixel text-xs text-gray-400">QUEST COMPLETE!</p>
                    </div>

                    <div className="p-4 bg-gray-900 border-2 mb-4" style={{ borderColor: ACCENT }}>
                      <p className="font-pixel text-sm text-yellow-400 leading-relaxed">
                        {result.questTitle}
                      </p>
                      {result.questDescription && (
                        <p className="font-pixel text-fluid-2xs text-gray-400 mt-2 leading-relaxed">
                          {result.questDescription}
                        </p>
                      )}
                    </div>

                    {/* Achievement, when this quest grants one */}
                    {result.achievement && (
                      <div className="p-4 bg-yellow-900/40 border-2 border-yellow-600 mb-4 flex items-center gap-3">
                        {result.achievement.imageUrl ? (
                          <img
                            src={result.achievement.imageUrl}
                            alt=""
                            className="h-12 w-12 flex-shrink-0 object-contain"
                          />
                        ) : (
                          <span className="text-3xl">🏅</span>
                        )}
                        <div className="min-w-0 text-left">
                          <p className="font-pixel text-fluid-2xs text-yellow-300">
                            ACHIEVEMENT UNLOCKED
                          </p>
                          <p className="font-pixel text-xs text-white mt-1">
                            {result.achievement.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* NPC Info */}
                    <div className="mb-4">
                      <div className="w-20 h-20 mx-auto bg-[#d7b98a] border-4 border-[#8d6e63]
                        flex items-center justify-center text-3xl mb-3"
                        style={{ boxShadow: '4px 4px 0 #000' }}>
                        👤
                      </div>
                      <p className="font-pixel text-xs text-[#6d4c41]">
                        💬 {result.npcName} ({result.npcRole}) SAYS:
                      </p>
                    </div>

                    {/* Fun Fact */}
                    <div className="p-4 bg-[#f5e6c8] border-2 border-[#8d6e63] mb-4"
                      style={{ borderColor: ACCENT }}>
                      <p className="font-pixel text-xs text-[#3e2723] leading-relaxed">
                        &ldquo;{result.funFact}&rdquo;
                      </p>
                    </div>
                  </>
                )}

                {/* Points */}
                <div className="flex items-center justify-center mb-6">
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
                    onClick={() => router.push(result.kind === 'quest' ? '/quests' : '/info/committee')}
                    color="blue"
                    fullWidth
                  >
                    {result.kind === 'quest' ? 'VIEW QUESTS' : 'VIEW COMMITTEE'}
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
                      : result.alreadyCompleted
                        ? 'QUEST ALREADY DONE!'
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

        {/* Stats — paper cards */}
        <div className="grid grid-cols-2 gap-4 mb-4" data-tour="scan-stats">
          {[
            {
              label: "Today's scans",
              value: recentScans.filter((s) => isSameJakartaDay(s.scannedAt)).length,
            },
            { label: 'Total Collected', value: totalScans },
          ].map((stat) => (
            <div
              key={stat.label}
              className="h-[124px] flex flex-col items-center pt-4 pb-2"
              style={{
                backgroundImage: 'url(/images/scan/paper.png)',
                backgroundSize: '100% 100%',
                imageRendering: 'pixelated',
              }}
            >
              <p className="font-bytebounce text-fluid-lg leading-none text-[#6d4c41]">
                {stat.label}
              </p>
              <p className="font-bytebounce text-[106px] leading-[0.75] text-[#3e2723] flex-1 flex items-start -mt-1">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Scans — opens the receipt popup */}
        <div data-tour="scan-recent">
          <WoodButton
            onClick={() => setShowRecent(true)}
            className="h-[48px] w-full"
            textClassName="text-fluid-3xl"
          >
            Recent Scans
          </WoodButton>
        </div>
      </div>

      {showRecent && (
        <RecentScansPopup
          scans={recentScans}
          total={totalScans}
          onClose={() => setShowRecent(false)}
        />
      )}
    </PageWrapper>
  )
}
