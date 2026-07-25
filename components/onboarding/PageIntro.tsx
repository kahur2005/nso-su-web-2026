// components/onboarding/PageIntro.tsx
'use client'
import { useEffect, useState } from 'react'
import IntroOverlay from './IntroOverlay'
import { TOURS } from '@/lib/tours'

const STORAGE_PREFIX = 'nso-intro-seen:'

/** Shows a one-time guided tour for a page, tracked per-browser via
 *  localStorage (so it survives reloads but not a fresh device/browser). */
export default function PageIntro({ page }: { page: keyof typeof TOURS }) {
  const [open, setOpen] = useState(false)
  const steps = TOURS[page]

  useEffect(() => {
    let seen = false
    try {
      seen = !!localStorage.getItem(STORAGE_PREFIX + page)
    } catch {
      // Storage unavailable (private mode, etc.) — just don't persist.
    }
    if (!seen) setOpen(true)
  }, [page])

  function finish() {
    setOpen(false)
    try {
      localStorage.setItem(STORAGE_PREFIX + page, '1')
    } catch {}
  }

  if (!steps?.length) return null
  return <IntroOverlay steps={steps} open={open} onFinish={finish} />
}
