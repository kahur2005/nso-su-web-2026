// app/(game)/map/timeline/page.tsx
import PageWrapper from '@/components/layout/PageWrapper'
import Timeline from '@/components/dashboard/Timeline'
import Link from 'next/link'

export default function TimelinePage() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-2">
          <Link href="/map"
            className="font-pixel text-xs text-green-400 hover:text-green-300">
            ‹ BACK
          </Link>
          <h1 className="font-pixel text-lg text-white text-center flex-1"
            style={{ textShadow: '3px 3px 0 #000' }}>
            🗓️ TIMELINE
          </h1>
          <span className="w-12" />
        </div>
        <Timeline />
      </div>
    </PageWrapper>
  )
}
