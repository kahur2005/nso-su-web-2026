'use client'
import { useState } from 'react'
import SectionHeading from './SectionHeading'
import { formatJakartaDate } from '@/lib/time'

export interface ActivityRow {
  id: string
  title: string
  points: number
  scannedAt: string
  kind?: 'scan' | 'guidebook'
}

const COLLAPSED_ROWS = 3

function formatDate(iso: string) {
  return formatJakartaDate(iso, { month: 'short', day: 'numeric' })
}

const PAPER = {
  backgroundImage: 'url(/images/quests/paper.png)',
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  imageRendering: 'pixelated' as const,
}

export default function ActivityLog({ rows }: { rows: ActivityRow[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? rows : rows.slice(0, COLLAPSED_ROWS)
  const canExpand = rows.length > COLLAPSED_ROWS

  return (
    <section data-tour="profile-activity">
      <SectionHeading
        icon="/images/dashboard/quest.svg"
        title="Activity Log"
        right={
          canExpand ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="font-bytebounce text-[17px] leading-none text-[#a1887f] transition-colors hover:text-[#ffecb3]"
              style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
            >
              {expanded ? 'Show Less ◀' : 'See All ▶'}
            </button>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <div className="px-5 py-4" style={PAPER}>
          <p className="font-bytebounce text-[22px] leading-[1.05] text-[#6d4c41]">
            No scans yet — go scan a committee member!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((row) => {
            const isQuiz = row.kind === 'guidebook'
            return (
            <div key={row.id} className="flex items-center gap-3 px-5 py-4" style={PAPER}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bytebounce text-[24px] leading-[1.05] text-[#3e2723]">
                  {isQuiz ? row.title : `Scanned ${row.title}`}
                </p>
                <p className="mt-2 font-bytebounce text-[20px] leading-none text-[#4e342e]">
                  <span aria-hidden>{isQuiz ? '📖' : '💡'}</span>{' '}
                  {isQuiz ? 'Guidebook quiz' : 'FunFact collected'} · {formatDate(row.scannedAt)}
                </p>
              </div>
              <p
                className={`shrink-0 font-bytebounce text-[22px] leading-none ${
                  row.points < 0 ? 'text-[#d6101d]' : 'text-[#328b36]'
                }`}
              >
                {row.points < 0 ? '−' : '+'} {Math.abs(row.points)} Points
              </p>
            </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
