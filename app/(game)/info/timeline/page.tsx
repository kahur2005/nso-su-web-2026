// app/(game)/info/timeline/page.tsx
// NSO 2026 day-by-day event agenda, built to the Figma "TIMELINE" frame
// (VCnH1k8cwo2dWaLjL7YRVS, node 2:6). The frame's sky backdrop is the one
// PageWrapper already paints for every logged-in page, so this page adds no
// background of its own; the calendar pad itself lives in <Timeline>.
'use client'
import { useRouter } from 'next/navigation'
import PageWrapper from '@/components/layout/PageWrapper'
import Timeline from '@/components/dashboard/Timeline'

/** Figma node 2:9 — gold display type with a single brown drop shadow. */
const TITLE_GOLD = {
  color: '#ffe045',
  textShadow: '2px 2px 0 #3e2723',
}

export default function TimelinePage() {
  const router = useRouter()

  return (
    <PageWrapper>
      <div className="relative game-column pb-28 pt-10">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push('/info')}
          aria-label="Back to info station"
          className="absolute left-2 top-0 z-20 w-[64px] transition-transform duration-75 hover:brightness-110 active:translate-y-0.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/login/back-button.png" alt="" className="w-full" />
        </button>

        {/* Title */}
        <h1
          className="mb-1 text-center font-bytebounce text-[clamp(2.4rem,16vw,4rem)] leading-[0.9]"
          style={TITLE_GOLD}
        >
          TIMELINE
        </h1>

        <Timeline />
      </div>
    </PageWrapper>
  )
}
