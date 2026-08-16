// components/profile/SectionHeading.tsx
// Icon + cream display title, with an optional right-hand slot (a count, or
// the activity log's See All button). The cream/brown treatment is the same
// one the /quests header uses, so the two pages read as one design.
import type { ReactNode } from 'react'

const CREAM_HEADING = {
  color: '#ffecb3',
  textShadow: '3px 3px 0 #3e2723',
}

interface SectionHeadingProps {
  icon: string
  title: string
  right?: ReactNode
}

export default function SectionHeading({ icon, title, right }: SectionHeadingProps) {
  return (
    <div className="mb-2 flex items-center gap-2.5 px-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        aria-hidden
        className="h-9 w-8 shrink-0 object-contain"
        style={{ imageRendering: 'pixelated' }}
      />
      <h2 className="font-bytebounce text-fluid-3xl leading-none" style={CREAM_HEADING}>
        {title}
      </h2>
      {right && <div className="ml-auto shrink-0">{right}</div>}
    </div>
  )
}
