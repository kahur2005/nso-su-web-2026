// app/(game)/info/timeline/page.tsx
// NSO 2026 day-by-day event agenda, built to the Figma "TIMELINE" frame
// (VCnH1k8cwo2dWaLjL7YRVS, node 2:6). The frame's sky backdrop is the one
// PageWrapper already paints for every logged-in page, so this page adds no
// background of its own; the calendar pad itself lives in <Timeline>.
//
// A server component so the agenda can be read from the database — the rows
// are maintained at /admin/timeline. The days and dates themselves are fixed
// in lib/timeline.ts. The back control lives in Navbar, not here.
import PageWrapper from '@/components/layout/PageWrapper'
import Timeline from '@/components/dashboard/Timeline'
import { getTimelineDays } from '@/lib/timeline-data'

// Rendered per request. Without this the agenda is baked in at build time and
// an admin's edit would not reach students until the next deploy. Valid here
// because Cache Components is not enabled in next.config.ts — see
// node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md.
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
