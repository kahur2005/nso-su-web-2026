// components/dashboard/Timeline.tsx
// Ring-bound calendar pad timeline matching the Figma reference design.
'use client'

import { useState } from 'react'

type AgendaRow = { time: string; activity: string }

type TimelineDay = {
  tabLabel: string
  headerTitle: string
  date: string
  agenda: AgendaRow[]
}

const TIMELINE_DATA: TimelineDay[] = [
  {
    tabLabel: 'TM',
    headerTitle: 'TECHNICAL MEETING (ONLINE)',
    date: '11 Aug 2026',
    agenda: [
      { time: '09:00 - 09:05', activity: 'Opening Greetings' },
      { time: '09:05 - 09:55', activity: 'NSO Technical Meeting' },
      { time: '09:55 - 10:15', activity: 'Games Session' },
      { time: '10:15 - 10:45', activity: 'Gem Sorting Ceremony' },
      { time: '10:45 - 11:00', activity: 'Web Explanation' },
      { time: '11:00 - 11:35', activity: 'Gems Discussion' },
    ],
  },
  {
    tabLabel: '1',
    headerTitle: 'DAY 1',
    date: '18 Aug 2026',
    agenda: [
      { time: '09:00 - 09:05', activity: 'Opening Greetings' },
      { time: '09:05 - 09:55', activity: 'NSO Technical Meeting' },
      { time: '09:55 - 10:15', activity: 'Games Session' },
      { time: '10:15 - 10:45', activity: 'Gem Sorting Ceremony' },
      { time: '10:45 - 11:00', activity: 'Web Explanation' },
      { time: '11:00 - 11:35', activity: 'Gems Discussion' },
      { time: '09:00 - 09:05', activity: 'Opening Greetings' },
      { time: '09:05 - 09:55', activity: 'NSO Technical Meeting' },
      { time: '09:55 - 10:15', activity: 'Games Session' },
      { time: '10:15 - 10:45', activity: 'Gem Sorting Ceremony' },
      { time: '10:45 - 11:00', activity: 'Web Explanation' },
    ],
  },
  {
    tabLabel: '2',
    headerTitle: 'DAY 2',
    date: '19 Aug 2026',
    agenda: [
      { time: '08:00 - 09:00', activity: 'Morning Assembly & Briefing' },
      { time: '09:00 - 12:00', activity: 'Faculty & Campus Exploration' },
      { time: '12:00 - 13:00', activity: 'Lunch Break & Club Booths' },
      { time: '13:00 - 16:00', activity: 'Team Building Challenges' },
    ],
  },
  {
    tabLabel: '3',
    headerTitle: 'DAY 3',
    date: '20 Aug 2026',
    agenda: [
      { time: '08:00 - 09:00', activity: 'Morning Warm-up' },
      { time: '09:00 - 12:00', activity: 'Quest Rally & QR Scanning' },
      { time: '12:00 - 13:00', activity: 'Lunch Break' },
      { time: '13:00 - 16:00', activity: 'Talent Showcase & Games' },
    ],
  },
  {
    tabLabel: '4',
    headerTitle: 'DAY 4',
    date: '21 Aug 2026',
    agenda: [
      { time: '08:00 - 09:00', activity: 'Group Reflection' },
      { time: '09:00 - 12:00', activity: 'UKM Clubs Exhibition' },
      { time: '12:00 - 13:00', activity: 'Lunch Break' },
      { time: '13:00 - 16:00', activity: 'Closing Ceremony Preparation' },
    ],
  },
  {
    tabLabel: '5',
    headerTitle: 'DAY 5',
    date: '22 Aug 2026',
    agenda: [
      { time: '09:00 - 12:00', activity: 'Final Leaderboard Announcement' },
      { time: '12:00 - 13:00', activity: 'Celebration Lunch' },
      { time: '13:00 - 17:00', activity: 'NSO 2026 Grand Closing Ceremony' },
    ],
  },
]

export default function Timeline() {
  const [selectedDay, setSelectedDay] = useState<number>(0)
  const current = TIMELINE_DATA[selectedDay] ?? TIMELINE_DATA[0]

  return (
    <div className="relative mx-auto w-full max-w-md">

      {/* ── Ring binder top loops ── */}
      <div className="flex justify-center gap-6 relative z-10 -mb-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative flex flex-col items-center">
            {/* Metal ring arc */}
            <div className="w-9 h-9 rounded-t-full border-4 border-[#3e2723] bg-[#d9d9d9] flex items-center justify-center shadow-md">
              <div className="w-5 h-5 rounded-t-full bg-[#8c8c8c] border border-[#3e2723]" />
            </div>
            {/* Ring hole cutout */}
            <div className="w-4 h-2 bg-[#2a170e] border border-[#3e2723] rounded-sm -mt-1" />
          </div>
        ))}
      </div>

      {/* ── Main calendar pad container ── */}
      <div className="rounded-lg border-4 border-[#3e2723] bg-[#f5e7c6] shadow-[4px_4px_0_#3e2723] overflow-hidden">

        {/* ── Red header block ── */}
        <div className="bg-[#a02c12] border-b-4 border-[#3e2723] px-4 py-4 text-center">
          <h2
            className="font-bytebounce text-[clamp(20px,6vw,28px)] leading-tight text-[#ffd23f]"
            style={{ textShadow: '2px 2px 0 #3e2723' }}
          >
            {current.headerTitle}
          </h2>
          <p
            className="font-bytebounce text-[18px] leading-tight text-[#ffeb3b] mt-0.5"
            style={{ textShadow: '1.5px 1.5px 0 #3e2723' }}
          >
            {current.date}
          </p>
        </div>

        {/* ── Day selector tabs row ── */}
        <div className="bg-[#e9d3ab] border-b-2 border-[#b08a5e] px-2 py-2 flex justify-center gap-1.5 overflow-x-auto">
          {TIMELINE_DATA.map((day, idx) => {
            const isActive = idx === selectedDay
            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                className={`font-bytebounce text-[16px] leading-none px-3 py-1.5 rounded border-2 transition-all ${
                  isActive
                    ? 'bg-[#2a75bb] border-[#3e2723] text-[#ffd23f] scale-105 shadow-[1px_1px_0_#3e2723]'
                    : 'bg-[#ffd23f] border-[#3e2723] text-[#3e2723] hover:brightness-110'
                }`}
                style={{ textShadow: isActive ? '1px 1px 0 #3e2723' : undefined }}
              >
                {day.tabLabel}
              </button>
            )
          })}
        </div>

        {/* ── Agenda table on cream parchment paper ── */}
        <div className="p-3 bg-[#fdf3e3]">
          <div className="rounded border-2 border-[#b08a5e] overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[#b08a5e] bg-[#e9d3ab]">
                  <th className="font-bytebounce text-[15px] text-[#3e2723] text-left px-3 py-2 w-2/5 border-r border-[#b08a5e]">
                    TIME
                  </th>
                  <th className="font-bytebounce text-[15px] text-[#3e2723] text-left px-3 py-2">
                    AGENDA
                  </th>
                </tr>
              </thead>
              <tbody>
                {current.agenda.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="border-b border-[#e5cb9f] last:border-0 hover:bg-[#f5e7c6]/60 transition-colors"
                  >
                    <td className="font-bytebounce text-[14px] text-[#3e2723] px-3 py-2.5 border-r border-[#b08a5e] align-top whitespace-nowrap">
                      {row.time}
                    </td>
                    <td className="font-bytebounce text-[14px] text-[#3e2723] px-3 py-2.5 align-top leading-tight">
                      {row.activity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
