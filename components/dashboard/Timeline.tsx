'use client'

import { useState } from 'react'
import type { TimelineDay } from '@/lib/timeline'

const INK = '#3e2723'
const RULE = '#c29f78'
const TITLE_GOLD = '#ffe045'
const DATE_ORANGE = '#ff9800'
const TAB_ON_BLUE = '#ffc20e'
const TAB_ON_YELLOW = '#bf360c'

const TAB_W = '12.23cqw'
const TAB_H = '6.79cqw'
const TAB_RAISE = '1.66cqw'
const CONTENT_L = '16.62cqw'
const CONTENT_R = '4.56cqw'
const TIME_COL = '43.54%'
const CELL_FONT = '6cqw'
const ROW_MIN_H = '6.72cqw'

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

  if (!current) return null

  const isLongTitle = current.headerTitle.length > 8
  const titleSize = isLongTitle ? '10.5cqw' : '22.92cqw'
  const titleLeading = isLongTitle ? 0.95 : 0.5

  return (
    <div
      className="relative mx-auto w-full max-w-[420px]"
      style={{ containerType: 'inline-size' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/timeline/pad-top.png"
        alt=""
        aria-hidden
        className="block w-full"
        style={{ imageRendering: 'pixelated' }}
      />

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
