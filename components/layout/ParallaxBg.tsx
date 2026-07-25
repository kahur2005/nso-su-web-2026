// components/layout/ParallaxBg.tsx
// Subtle parallax background wrapper — drifts down gently as the user scrolls down the page.
'use client'
import { useEffect, useState } from 'react'

export default function ParallaxBg({ src = '/images/scan/bg.png' }: { src?: string }) {
  const [offsetY, setOffsetY] = useState(0)

  useEffect(() => {
    let requestRef: number
    const handleScroll = () => {
      requestRef = requestAnimationFrame(() => {
        // Drift background down by 15% of scroll distance
        setOffsetY(window.scrollY * 0.15)
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (requestRef) cancelAnimationFrame(requestRef)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 -z-10 bg-cover bg-bottom pointer-events-none"
      style={{
        backgroundImage: `url(${src})`,
        transform: `translate3d(0, ${offsetY}px, 0)`,
        willChange: 'transform',
      }}
    />
  )
}
