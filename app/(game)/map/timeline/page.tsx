// app/(game)/map/timeline/page.tsx
'use client'
import { useRouter } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'
import Timeline from '@/components/dashboard/Timeline'

const OUTLINE_GOLD = {
  color: '#ffd23f',
  textShadow:
    '3px 3px 0 #4e342e, -3px 3px 0 #4e342e, 3px -3px 0 #4e342e, -3px -3px 0 #4e342e, 0 5px 0 #4e342e',
}

export default function TimelinePage() {
  const router = useRouter()

  return (
    <PageWrapper>
      {/* ── Forest background ── */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-bottom"
        style={{ backgroundImage: 'url(/images/scan/bg.png)' }}
      />

      <div className="relative mx-auto w-full max-w-md px-3 pb-28 pt-12 lg:max-w-lg">

        {/* Back button sprite */}
        <button
          type="button"
          onClick={() => router.push('/map')}
          aria-label="Back to info station"
          className="absolute left-2 top-0 z-20 w-[64px] transition-transform duration-75 hover:brightness-110 active:translate-y-0.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/login/back-button.png" alt="" className="w-full" />
        </button>

        {/* Title */}
        <h1
          className="text-center font-bytebounce text-[clamp(2.4rem,12vw,3.2rem)] leading-[0.85] mb-1"
          style={OUTLINE_GOLD}
        >
          TIMELINE
        </h1>
        <p
          className="mb-4 text-center font-bytebounce text-[18px] leading-tight text-white"
          style={{ textShadow: '2px 2px 0 #4e342e' }}
        >
          Day-by-day event agenda
        </p>

        <Timeline />
      </div>
    </PageWrapper>
  )
}
