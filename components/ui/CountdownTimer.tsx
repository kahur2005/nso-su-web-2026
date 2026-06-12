// components/ui/CountdownTimer.tsx
'use client'
import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  targetDate: Date
  label?: string
}

export default function CountdownTimer({ 
  targetDate,
  label = "EVENT STARTS IN"
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
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

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="pixel-card bg-gray-900 border-2 border-white px-3 py-2 min-w-[60px] text-center">
        <span className="text-yellow-400 text-lg font-pixel">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-gray-400 mt-1 font-pixel">{label}</span>
    </div>
  )

  return (
    <div className="text-center">
      <p className="text-xs text-gray-400 font-pixel mb-3">{label}</p>
      <div className="flex gap-3 justify-center">
        <TimeBox value={timeLeft.days} label="DAYS" />
        <span className="text-white text-xl self-start mt-2 blink">:</span>
        <TimeBox value={timeLeft.hours} label="HRS" />
        <span className="text-white text-xl self-start mt-2 blink">:</span>
        <TimeBox value={timeLeft.minutes} label="MIN" />
        <span className="text-white text-xl self-start mt-2 blink">:</span>
        <TimeBox value={timeLeft.seconds} label="SEC" />
      </div>
    </div>
  )
}