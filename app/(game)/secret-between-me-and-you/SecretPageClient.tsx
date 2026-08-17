'use client'

import { useCallback, useEffect, useState } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { SECRET_WARNING } from '@/lib/secret'

type SecretState = {
  claimed: boolean
  qrCode: string | null
}

export default function SecretPageClient() {
  const [state, setState] = useState<SecretState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/secret')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not load.')
        setState(null)
        return
      }
      setState({
        claimed: Boolean(data.claimed),
        qrCode: typeof data.qrCode === 'string' ? data.qrCode : null,
      })
    } catch {
      setError('Could not load. Check your connection.')
      setState(null)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleClaim() {
    if (claiming) return
    setClaiming(true)
    setError(null)
    try {
      const res = await fetch('/api/secret/claim', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Claim failed.')
        setClaiming(false)
        return
      }
      const url = typeof data.youtubeUrl === 'string' ? data.youtubeUrl : null
      if (url) {
        window.location.href = url
        return
      }
      setError('Missing redirect URL.')
      setClaiming(false)
    } catch {
      setError('Claim failed. Check your connection.')
      setClaiming(false)
    }
  }

  return (
    <PageWrapper>
      <div
        className="fixed inset-0 -z-10 bg-cover bg-bottom"
        style={{ backgroundImage: 'url(/images/scan/bg.png)' }}
      />

      <div className="relative game-column flex min-h-[calc(100dvh-11rem)] flex-col items-center justify-center pb-10 pt-8">
        <h1
          className="max-w-[20ch] text-center font-bytebounce text-[clamp(2rem,10vw,3.2rem)] leading-[0.9] text-[#ff180e]"
          style={{
            textShadow:
              '3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000',
          }}
        >
          {SECRET_WARNING}
        </h1>

        <p
          className="mt-4 max-w-[28ch] text-center font-bytebounce text-[22px] leading-tight text-white"
          style={{ textShadow: '2px 2px 0 #3e2723' }}
        >
          This page is between you and the committee. Keep it that way.
        </p>

        <div className="mt-8 w-full">
          {!state && !error && (
            <div className="py-10">
              <LoadingSpinner text="LOADING..." />
            </div>
          )}

          {error && (
            <p className="rounded border-2 border-[#a3402a] bg-[#f6d5cd] px-4 py-3 text-center font-bytebounce text-[22px] leading-tight text-[#8c2d1a]">
              {error}
            </p>
          )}

          {state && !state.claimed && (
            <button
              type="button"
              disabled={claiming}
              onClick={handleClaim}
              className="mx-auto block w-full max-w-sm border-4 border-black bg-[#8a5a37] px-6 py-5 font-bytebounce text-[26px] uppercase leading-none text-[#ffd23f] disabled:opacity-60 active:translate-y-0.5"
              style={{ boxShadow: '4px 4px 0 #000' }}
            >
              {claiming ? 'Claiming…' : 'Claim secret code'}
            </button>
          )}

          {state?.claimed && (
            <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 rounded border-4 border-[#3e2723] bg-[#fff3d9] px-5 py-6">
              <p className="text-center font-bytebounce text-[24px] leading-tight text-[#3e2723]">
                Your secret quest QR
              </p>
              {state.qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={state.qrCode}
                  alt="Secret quest QR code"
                  className="w-full max-w-[280px] rounded border-2 border-[#3e2723] bg-white p-2"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <p className="text-center font-bytebounce text-[20px] leading-tight text-[#8c2d1a]">
                  QR not ready yet — ask committee to seed the quest QR.
                </p>
              )}
              <p className="text-center font-bytebounce text-[18px] leading-tight text-[#6d4c41]">
                Scan this on /scan to complete the easter egg quest.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
