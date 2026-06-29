// components/dashboard/DashboardIntro.tsx
'use client'
import { useState } from 'react'
import IntroOverlay, { IntroStep } from '@/components/onboarding/IntroOverlay'

const steps: IntroStep[] = [
  {
    target: 'profile',
    title: 'THIS IS YOU',
    description: 'Your avatar, group, and total points live up here. Keep scanning to climb the ranks!',
  },
  {
    target: 'xp',
    title: 'LEVEL & XP',
    description: 'Scanning NPCs and finishing quests earns XP — fill the bar to level up.',
  },
  {
    target: 'actions',
    title: 'QUICK ACTIONS',
    description: 'Jump straight into scanning QR codes, quests, the codex, or the map from here.',
  },
  {
    target: 'quests',
    title: 'ACTIVE QUESTS',
    description: 'Track quests you can complete right now. Tap VIEW ALL to see everything available.',
  },
  {
    target: 'leaderboard',
    title: 'GROUP LEADERBOARD',
    description: "See how your group stacks up against everyone else's.",
  },
  {
    target: 'codex',
    title: 'CODEX PROGRESS',
    description: 'Every NPC you scan unlocks a fun fact in your codex — try to collect them all!',
  },
]

export default function DashboardIntro({ show }: { show: boolean }) {
  const [open, setOpen] = useState(show)

  const finish = () => {
    setOpen(false)
    fetch('/api/onboarding/complete', { method: 'POST' }).catch(() => {})
  }

  return <IntroOverlay steps={steps} open={open} onFinish={finish} />
}
