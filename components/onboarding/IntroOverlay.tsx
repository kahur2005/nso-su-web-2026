// components/onboarding/IntroOverlay.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'

export interface IntroStep {
  target: string // matches a `data-tour="<target>"` attribute on the page
  title: string
  description: string
}

interface IntroOverlayProps {
  steps: IntroStep[]
  open: boolean
  onFinish: () => void
}

const PAD = 8
const TOOLTIP_WIDTH = 300

export default function IntroOverlay({ steps, open, onFinish }: IntroOverlayProps) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const measure = useCallback(() => {
    const el = document.querySelector(`[data-tour="${steps[step]?.target}"]`)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [step, steps])

  useEffect(() => {
    if (!open) return
    const el = document.querySelector(`[data-tour="${steps[step]?.target}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const raf = window.requestAnimationFrame(measure)
    const onScrollOrResize = () => measure()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    // Smooth-scrolling needs a re-measure once it settles into place.
    const settle = window.setTimeout(measure, 400)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
      window.clearTimeout(settle)
    }
  }, [open, step, steps, measure])

  if (!open || !mounted) return null

  const last = step === steps.length - 1
  const current = steps[step]

  const highlightStyle = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null

  // Place the tooltip below the highlighted area if there's room, otherwise above.
  const tooltipWidth = Math.min(TOOLTIP_WIDTH, window.innerWidth - 32)
  const left = rect
    ? Math.min(Math.max(rect.left, 16), window.innerWidth - tooltipWidth - 16)
    : (window.innerWidth - tooltipWidth) / 2
  const spaceBelow = rect ? window.innerHeight - rect.bottom : 0
  const top = rect
    ? spaceBelow > 220
      ? rect.bottom + PAD + 8
      : Math.max(16, rect.top - PAD - 8 - 200)
    : window.innerHeight / 2 - 100

  return (
    <div className="fixed inset-0 z-[10000]">
      {/* Click-blocker — keeps the tour modal until Next/Skip is pressed. */}
      <div className="absolute inset-0" style={{ pointerEvents: 'auto' }} />

      {/* Darken everything except a spotlight cutout around the target. */}
      {highlightStyle ? (
        <div
          className="absolute border-4 border-[#fbc94c] rounded transition-all duration-300 pointer-events-none"
          style={{ ...highlightStyle, boxShadow: '0 0 0 9999px rgba(0,0,0,0.85)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/85" />
      )}

      {/* Tooltip card */}
      <div
        className="absolute transition-all duration-300 z-50"
        style={{ top, left, width: tooltipWidth }}
      >
        <div className="rounded-lg border-4 border-[#3a2418] bg-[#fdf6e3] p-4 shadow-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bytebounce text-fluid-sm text-[#b8860b]">
              STEP {step + 1}/{steps.length}
            </span>
            <button
              onClick={onFinish}
              className="font-bytebounce text-fluid-sm text-[#8a5a37] hover:text-[#3e2723] underline"
            >
              SKIP ✕
            </button>
          </div>
          <h3 className="font-bytebounce text-fluid-md leading-tight text-[#3e2723] mb-1">
            {current.title}
          </h3>
          <p className="font-bytebounce text-fluid-sm leading-relaxed text-[#5d4330] mb-4">
            {current.description}
          </p>
          <div className="flex justify-between gap-3">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded border-2 border-[#3a2418] bg-[#f5e7c6] px-3 py-1.5 font-bytebounce text-fluid-sm text-[#3e2723] disabled:opacity-40"
            >
              ← PREV
            </button>
            <button
              type="button"
              onClick={() => (last ? onFinish() : setStep((s) => s + 1))}
              className="rounded border-2 border-[#3a2418] bg-[#8a5a37] px-4 py-1.5 font-bytebounce text-fluid-sm text-[#ffd23f] active:translate-y-0.5"
            >
              {last ? 'FINISH ✓' : 'NEXT →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
