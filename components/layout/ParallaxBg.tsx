'use client'

export default function ParallaxBg({ src = '/images/scan/bg.png' }: { src?: string }) {
  return (
    <div
      className="fixed inset-0 -z-10 bg-cover bg-bottom pointer-events-none"
      style={{
        backgroundImage: `url(${src})`,
      }}
    />
  )
}
