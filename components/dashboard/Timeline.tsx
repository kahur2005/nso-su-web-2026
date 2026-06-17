// components/dashboard/Timeline.tsx
'use client'

import { useState } from 'react'
import PixelCard from '@/components/ui/PixelCard'

/* ────────────────────────────────────────────────────────────────────────
 * EDIT YOUR TIMELINE HERE
 * Each day has:
 *   - label:  the day name shown in the header (e.g. "DAY 1")
 *   - title:  the day's theme/title (placeholder for now)
 *   - date:   the date shown under the title
 *   - agenda: hour-by-hour rows -> add / remove / edit { time, activity }
 * ──────────────────────────────────────────────────────────────────────── */
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
/* ──────────────────────────────────────────────────────────────────────── */

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
    <div className="mt-6">
      <h3 className="font-pixel text-sm text-white mb-3">🗓️ TIMELINE</h3>
      <div className="space-y-2">
        {TIMELINE.map((day, index) => {
          const isOpen = open.has(index)
          return (
            <PixelCard key={index} className="bg-gray-800">
              {/* Header / collapse toggle */}
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-3 text-left"
              >
                <div className="flex-1">
                  <p className="font-pixel text-xs text-green-400">
                    {day.label}
                  </p>
                  <p className="font-pixel text-sm text-white mt-1">
                    {day.title}
                  </p>
                  <p className="font-pixel text-xs text-gray-400 mt-1">
                    📅 {day.date}
                  </p>
                </div>
                <span
                  className={`font-pixel text-lg text-yellow-400 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>

              {/* Collapsible agenda table */}
              {isOpen && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="font-pixel text-xs text-gray-400 text-left border-2 border-black bg-gray-900 px-3 py-2 w-1/3">
                          TIME
                        </th>
                        <th className="font-pixel text-xs text-gray-400 text-left border-2 border-black bg-gray-900 px-3 py-2">
                          AGENDA
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.agenda.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="font-pixel text-xs text-yellow-400 border-2 border-black px-3 py-2 align-top">
                            {row.time}
                          </td>
                          <td className="font-pixel text-xs text-gray-200 border-2 border-black px-3 py-2">
                            {row.activity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PixelCard>
          )
        })}
      </div>
    </div>
  )
}
