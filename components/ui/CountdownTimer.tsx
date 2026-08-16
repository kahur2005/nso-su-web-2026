// components/ui/CountdownTimer.tsx
'use client'
import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  targetDate: Date
  label?: string
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-md border-2 border-[#3a2418] bg-[#fdf6e3] px-3 py-2 min-w-[clamp(44px,12vw,58px)] text-center shadow">
        <span className="font-bytebounce text-fluid-xl text-[#b8860b]">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span
        className="mt-1 font-bytebounce text-fluid-xs text-[#e0b391]"
        style={{ textShadow: '1px 1px 0 #3a2418' }}
      >
        {label}
      </span>
    </div>
  )
}

export default function CountdownTimer({
  targetDate,
  label = 'EVENT STARTS IN',
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const target = targetDate.getTime()
      const diff = target - now

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className="text-center">
      <p
        className="font-bytebounce text-fluid-sm text-white mb-2"
        style={{ textShadow: '1.5px 1.5px 0 #4e342e', color: '#ffd23f' }}
      >
        {label}
      </p>
      <div className="flex gap-2 justify-center items-center">
        <TimeBox value={timeLeft.days} label="DAYS" />
        <span className="font-bytebounce text-fluid-md text-[#ffd23f] mb-4 blink">:</span>
        <TimeBox value={timeLeft.hours} label="HRS" />
        <span className="font-bytebounce text-fluid-md text-[#ffd23f] mb-4 blink">:</span>
        <TimeBox value={timeLeft.minutes} label="MIN" />
        <span className="font-bytebounce text-fluid-md text-[#ffd23f] mb-4 blink">:</span>
        <TimeBox value={timeLeft.seconds} label="SEC" />
      </div>
    </div>
  )
}