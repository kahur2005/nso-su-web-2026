// components/dashboard/Timeline.tsx
'use client'

import { useState } from 'react'

type AgendaRow = { time: string; activity: string }

type TimelineDay = {
  label: string
  title: string
  date: string
  agenda: AgendaRow[]
}

const TIMELINE: TimelineDay[] = [
  {
    label: 'TECHNICAL MEETING DAY',
    title: 'Lorem Ipsum',
    date: 'June 17, 2026',
    agenda: [
      { time: '08:00 - 09:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '09:00 - 10:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '10:00 - 11:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '11:00 - 12:00', activity: 'Lorem ipsum dolor sit amet' },
    ],
  },
  {
    label: 'DAY 0 — PRE-ORIENTATION DAY',
    title: 'Lorem Ipsum',
    date: 'June 18, 2026',
    agenda: [
      { time: '08:00 - 09:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '09:00 - 10:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '10:00 - 11:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '11:00 - 12:00', activity: 'Lorem ipsum dolor sit amet' },
    ],
  },
  {
    label: 'DAY 1',
    title: 'Lorem Ipsum',
    date: 'June 19, 2026',
    agenda: [
      { time: '08:00 - 09:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '09:00 - 10:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '10:00 - 11:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '11:00 - 12:00', activity: 'Lorem ipsum dolor sit amet' },
    ],
  },
  {
    label: 'DAY 2',
    title: 'Lorem Ipsum',
    date: 'June 20, 2026',
    agenda: [
      { time: '08:00 - 09:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '09:00 - 10:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '10:00 - 11:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '11:00 - 12:00', activity: 'Lorem ipsum dolor sit amet' },
    ],
  },
  {
    label: 'DAY 3',
    title: 'Lorem Ipsum',
    date: 'June 21, 2026',
    agenda: [
      { time: '08:00 - 09:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '09:00 - 10:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '10:00 - 11:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '11:00 - 12:00', activity: 'Lorem ipsum dolor sit amet' },
    ],
  },
  {
    label: 'DAY 4',
    title: 'Lorem Ipsum',
    date: 'June 22, 2026',
    agenda: [
      { time: '08:00 - 09:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '09:00 - 10:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '10:00 - 11:00', activity: 'Lorem ipsum dolor sit amet' },
      { time: '11:00 - 12:00', activity: 'Lorem ipsum dolor sit amet' },
    ],
  },
]

export default function Timeline() {
  const [open, setOpen] = useState<Set<number>>(new Set())

  const toggle = (index: number) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {TIMELINE.map((day, index) => {
        const isOpen = open.has(index)
        return (
          <div key={index} className="wood-plank px-4 py-3">
            {/* Header / collapse toggle */}
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-3 text-left"
            >
              <div className="flex-1">
                <p
                  className="font-bytebounce text-[14px] leading-tight text-[#ffd23f]"
                  style={{ textShadow: '1px 1px 0 #3e2723' }}
                >
                  {day.label}
                </p>
                <p
                  className="font-bytebounce text-[18px] leading-tight text-[#fff3d9] mt-0.5"
                  style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
                >
                  {day.title}
                </p>
                <p
                  className="font-bytebounce text-[13px] leading-tight text-[#e0b391] mt-0.5"
                  style={{ textShadow: '1px 1px 0 #3e2723' }}
                >
                  📅 {day.date}
                </p>
              </div>
              <span
                className={`font-bytebounce text-[20px] text-[#ffd23f] transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
                style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
              >
                ▼
              </span>
            </button>

            {/* Collapsible agenda table */}
            {isOpen && (
              <div className="mt-3 overflow-x-auto rounded border-2 border-[#b08a5e] bg-[#f5e7c6] p-2">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="font-bytebounce text-[14px] text-[#5d4330] text-left border border-[#b08a5e] bg-[#e9d3ab] px-3 py-2 w-1/3">
                        TIME
                      </th>
                      <th className="font-bytebounce text-[14px] text-[#5d4330] text-left border border-[#b08a5e] bg-[#e9d3ab] px-3 py-2">
                        AGENDA
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.agenda.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="font-bytebounce text-[13px] text-[#8a5c2e] border border-[#b08a5e] px-3 py-2 align-top">
                          {row.time}
                        </td>
                        <td className="font-bytebounce text-[13px] text-[#3e2723] border border-[#b08a5e] px-3 py-2">
                          {row.activity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
