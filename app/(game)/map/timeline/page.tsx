// app/(game)/map/timeline/page.tsx
import PageWrapper from '@/components/layout/PageWrapper'
import Timeline from '@/components/dashboard/Timeline'
import Link from 'next/link'
import { getTimelineDays } from '@/lib/timeline-data'

// Same reason as /info/timeline: the agenda is admin-editable, so it must be
// read per request rather than frozen into the build.
export const dynamic = 'force-dynamic'

export default async function TimelinePage() {
  const days = await getTimelineDays()

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-2">
          <Link href="/map"
            className="font-pixel text-xs text-green-400 hover:text-green-300">
            ‹ BACK
          </Link>
          <h1 className="font-pixel text-lg text-yellow-400 text-center flex-1"
            style={{ textShadow: '3px 3px 0 #000' }}>
            🗓️ TIMELINE
          </h1>
          <span className="w-12" />
        </div>
        <Timeline days={days} />
      </div>
    </PageWrapper>
  )
}
