// components/dashboard/Timeline.tsx
// Ring-bound calendar pad built to the Figma "TIMELINE" frame
// (VCnH1k8cwo2dWaLjL7YRVS, node 2:36).
//
// The pad is one 49x51 pixel-art sprite cut into four horizontal slices in
// public/images/timeline/: a fixed top cap (ring loops + the top of the red
// header), a 2px red strip and a 2px cream strip that each stretch vertically
// to whatever they contain, and a fixed bottom edge. That lets the header grow
// with the day title and the body grow with the agenda without the art
// distorting — same trick as SliceBg in app/(game)/quests/page.tsx, rotated.
//
// Every measurement below is a percentage of the pad's own width, lifted
// straight from the Figma frame (where the pad art is 362.3px wide), and
// expressed in `cqw` against the container-query root on the pad wrapper. The
// whole calendar therefore scales as a single unit at any column width, exactly
// as the design does.
//
// The agenda rows are editable from /admin/timeline and arrive as a prop; the
// six days and their dates are fixed in lib/timeline.ts. Type-only import, so
// nothing from the server-side data layer reaches this bundle.
'use client'

import { useState } from 'react'
import type { TimelineDay } from '@/lib/timeline'

/* ── Figma palette (node 2:36) ─────────────────────────────────────────── */
const INK = '#3e2723' // pad border + agenda text
const RULE = '#c29f78' // agenda grid lines
const TITLE_GOLD = '#ffe045'
const DATE_ORANGE = '#ff9800'
const TAB_ON_BLUE = '#ffc20e' // label on the blue TM tab
const TAB_ON_YELLOW = '#bf360c' // label on the yellow day tabs

/* ── Geometry, as a share of the pad's width (Figma pad = 362.3px) ─────── */
const TAB_W = '12.23cqw' // 44.3px sprite, 9:5 aspect
const TAB_H = '6.79cqw' // 24.61px
const TAB_RAISE = '1.66cqw' // 6px lift on the selected tab
const CONTENT_L = '16.62cqw' // clears the wooden spine down the pad's left
const CONTENT_R = '4.56cqw'
const TIME_COL = '43.54%' // 124.35 of the 285.6px agenda table
const CELL_FONT = '6cqw' // 21.73px
const ROW_MIN_H = '6.72cqw' // 24.34px

/** Repeats one 2px-tall slice of the pad sprite over a box of any height. */
function padSlice(file: string): React.CSSProperties {
  return {
    backgroundImage: `url(/images/timeline/${file})`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
  }
}

export default function Timeline({ days }: { days: TimelineDay[] }) {
  const [selectedDay, setSelectedDay] = useState<number>(0)
  const current = days[selectedDay] ?? days[0]

  // Nothing to draw without at least one day. Only reachable if lib/timeline.ts
  // is emptied, since the six days are code rather than data.
  if (!current) return null

  // "DAY 1" is set enormous in the design, on leading so tight the glyphs
  // overflow their line box up over the flat red of the cap — which is exactly
  // where Figma puts them. The technical-meeting title is far too long to
  // survive that, so it steps down and wraps inside the same band.
  const isLongTitle = current.headerTitle.length > 8
  const titleSize = isLongTitle ? '10.5cqw' : '22.92cqw'
  const titleLeading = isLongTitle ? 0.95 : 0.5

  return (
    <div
      className="relative mx-auto w-full max-w-[420px]"
      style={{ containerType: 'inline-size' }}
    >
      {/* ── Top cap: the three ring loops and the head of the red banner ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/timeline/pad-top.png"
        alt=""
        aria-hidden
        className="block w-full"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* ── Red banner: day title + date. Tucks 2px under the cap, whose two
             spare rows of flat red hide the seam. ── */}
      <div
        className="relative -mt-[2px] text-center"
        style={{
          ...padSlice('pad-header.png'),
          paddingLeft: CONTENT_L,
          paddingRight: CONTENT_R,
          paddingBottom: '1.5cqw',
        }}
      >
        <h2
          className="font-bytebounce"
          style={{
            fontSize: titleSize,
            lineHeight: titleLeading,
            color: TITLE_GOLD,
            textShadow: `2px 2px 0 ${INK}`,
          }}
        >
          {current.headerTitle}
        </h2>
        <p
          className="font-bytebounce"
          style={{
            fontSize: '9.23cqw',
            lineHeight: 0.85,
            marginTop: isLongTitle ? undefined : '-1cqw',
            color: DATE_ORANGE,
            textShadow: `1px 1px 0 ${INK}`,
          }}
        >
          {current.date}
        </p>
      </div>

      {/* ── Cream body: day tabs + agenda table ── */}
      <div
        className="relative -mt-[1px]"
        style={{
          ...padSlice('pad-body.png'),
          paddingLeft: CONTENT_L,
          paddingRight: CONTENT_R,
          paddingTop: '3.11cqw',
          paddingBottom: '2cqw',
        }}
      >
        {/* Day selector — the active tab sits 6px proud of the rest */}
        <div className="flex items-start justify-between" role="tablist" aria-label="Event day">
          {days.map((day, idx) => {
            const isActive = idx === selectedDay
            const isMeeting = idx === 0
            return (
              <button
                key={day.tabLabel}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedDay(idx)}
                className="relative shrink-0 transition-[transform,filter] duration-75 hover:brightness-110"
                style={{
                  width: TAB_W,
                  height: TAB_H,
                  transform: isActive ? `translateY(-${TAB_RAISE})` : undefined,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/images/timeline/${isMeeting ? 'tab-blue' : 'tab-yellow'}.png`}
                  alt=""
                  aria-hidden
                  className="absolute left-0 top-0"
                  style={{ width: TAB_W, height: TAB_H, imageRendering: 'pixelated' }}
                />
                <span
                  className="absolute inset-0 flex items-center justify-center font-bytebounce"
                  style={{
                    fontSize: '6.74cqw',
                    lineHeight: 1,
                    color: isMeeting ? TAB_ON_BLUE : TAB_ON_YELLOW,
                    textShadow: `1px 1px 0 ${INK}`,
                  }}
                >
                  {day.tabLabel}
                </span>
              </button>
            )
          })}
        </div>

        {/* Agenda grid — hairline-ruled, no fill, the pad's cream shows through */}
        <table
          className="w-full border-collapse font-bytebounce"
          style={{ tableLayout: 'fixed', marginTop: '3.49cqw' }}
        >
          <caption className="sr-only">
            {current.headerTitle} agenda, {current.date}
          </caption>
          <tbody>
            {current.agenda.map((row) => (
              <tr key={row.id}>
                <th
                  scope="row"
                  className="text-center font-normal"
                  style={{
                    width: TIME_COL,
                    border: `2px solid ${RULE}`,
                    color: INK,
                    fontSize: CELL_FONT,
                    lineHeight: 1.05,
                    height: ROW_MIN_H,
                    padding: '0.4cqw 0.8cqw',
                  }}
                >
                  {row.time}
                </th>
                <td
                  className="text-left"
                  style={{
                    border: `2px solid ${RULE}`,
                    color: INK,
                    fontSize: CELL_FONT,
                    lineHeight: 1.05,
                    padding: '0.4cqw 1cqw 0.4cqw 3.49cqw',
                  }}
                >
                  {row.activity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Bottom edge of the pad ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/timeline/pad-bottom.png"
        alt=""
        aria-hidden
        className="-mt-[1px] block w-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}
