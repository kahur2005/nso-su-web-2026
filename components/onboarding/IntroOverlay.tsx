// components/onboarding/IntroOverlay.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import PixelButton from '@/components/ui/PixelButton'

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

  if (!open) return null

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
          className="absolute border-4 border-yellow-400 rounded transition-all duration-300 pointer-events-none"
          style={{ ...highlightStyle, boxShadow: '0 0 0 9999px rgba(0,0,0,0.8)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/80" />
      )}

      {/* Tooltip card */}
      <div
        className="absolute transition-all duration-300"
        style={{ top, left, width: tooltipWidth }}
      >
        <div className="pixel-card bg-gray-900 p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="font-pixel text-xs text-yellow-400">
              {step + 1}/{steps.length}
            </span>
            <button
              onClick={onFinish}
              className="font-pixel text-xs text-gray-500 hover:text-gray-300"
            >
              SKIP ✕
            </button>
          </div>
          <h3 className="font-pixel text-sm text-white mb-2">{current.title}</h3>
          <p className="font-pixel text-xs text-gray-300 leading-relaxed mb-4">
            {current.description}
          </p>
          <div className="flex justify-between gap-3">
            <PixelButton
              color="gray"
              size="sm"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              ← PREV
            </PixelButton>
            <PixelButton
              color="yellow"
              size="sm"
              onClick={() => (last ? onFinish() : setStep((s) => s + 1))}
            >
              {last ? 'FINISH ✓' : 'NEXT →'}
            </PixelButton>
          </div>
        </div>
      </div>
    </div>
  )
}
