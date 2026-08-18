import PageWrapper from '@/components/layout/PageWrapper'
import Timeline from '@/components/dashboard/Timeline'
import { getTimelineDays } from '@/lib/timeline-data'

export const dynamic = 'force-dynamic'

export default async function TimelinePage() {
  const days = await getTimelineDays()

  return (
    <PageWrapper>
      <div className="relative game-column pb-28 pt-10">
        {/* Title */}
        <h1 className="title-gold mb-1 text-center font-bytebounce text-[clamp(2.4rem,16vw,4rem)] leading-[0.9]">
          TIMELINE
        </h1>

        <Timeline days={days} />
      </div>
    </PageWrapper>
  )
}
