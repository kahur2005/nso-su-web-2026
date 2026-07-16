// app/admin/quests/onboarding/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminHeader from '@/components/layout/AdminHeader'

const steps = [
  {
    num: '01',
    icon: '📝',
    title: 'Go to Manage Quests',
    desc: 'Navigate to Admin → Quests. You\'ll see a create form on the left and the quest log on the right.',
    tip: null,
  },
  {
    num: '02',
    icon: '✍️',
    title: 'Fill in the Quest Details',
    desc: 'Enter a short Title (e.g. "Meet 5 NPCs"), a clear Description of what the player must do, choose a Type, and set the Points reward.',
    tip: 'Types: ⭐ MAIN = story quests · 📋 DAILY = reset each day · 🗒️ SIDE = bonus missions · 🔮 HIDDEN = secret',
  },
  {
    num: '03',
    icon: '⏰',
    title: 'Set a Deadline (optional)',
    desc: 'If the quest expires, pick a date/time. Leave blank for permanent quests.',
    tip: null,
  },
  {
    num: '04',
    icon: '⚡',
    title: 'Click CREATE QUEST',
    desc: 'The quest is saved immediately but starts INACTIVE — students cannot see or claim it yet.',
    tip: null,
  },
  {
    num: '05',
    icon: '✅',
    title: 'Activate when ready',
    desc: 'In the Quest Log on the right, find your quest and click the ⛔ INACTIVE button to toggle it ACTIVE. Students can now see and complete it.',
    tip: 'You can deactivate a quest at any time to hide it from students without deleting it.',
  },
]

const questTypes = [
  { emoji: '⭐', label: 'MAIN', color: '#FFD700', desc: 'Core story missions. High points.' },
  { emoji: '📋', label: 'DAILY', color: '#2196F3', desc: 'Reset-able daily check-ins.' },
  { emoji: '🗒️', label: 'SIDE', color: '#4CAF50', desc: 'Optional bonus quests.' },
  { emoji: '🔮', label: 'HIDDEN', color: '#9C27B0', desc: 'Secret quests — invisible to students until triggered.' },
]

export default async function QuestOnboardingPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-900 scanlines">
      <AdminHeader title="📖 QUEST GUIDE" subtitle="HOW TO UPLOAD QUESTS" />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">

        {/* Intro banner */}
        <div className="border-2 border-yellow-400 bg-gray-800 p-5"
          style={{ boxShadow: '4px 4px 0 #000' }}>
          <p className="font-pixel text-xs text-yellow-300 leading-relaxed">
            This guide walks you through creating and publishing quests for NSO 2026 students.
            Quests are the core XP source — players complete them to earn points and level up.
          </p>
        </div>

        {/* Step-by-step */}
        <section>
          <h2 className="font-pixel text-sm text-white mb-5">🗺️ STEP-BY-STEP</h2>
          <div className="space-y-4">
            {steps.map((s) => (
              <div key={s.num}
                className="flex gap-4 border-2 border-gray-600 bg-gray-800 p-4"
                style={{ boxShadow: '3px 3px 0 #000' }}>
                <div className="flex-shrink-0 w-10 h-10 border-2 border-yellow-400 bg-gray-900
                  flex items-center justify-center font-pixel text-[10px] text-yellow-400">
                  {s.num}
                </div>
                <div className="flex-1">
                  <p className="font-pixel text-xs text-white mb-1">
                    {s.icon} {s.title}
                  </p>
                  <p className="font-pixel text-[9px] text-gray-300 leading-relaxed">
                    {s.desc}
                  </p>
                  {s.tip && (
                    <p className="mt-2 font-pixel text-[8px] text-cyan-400 leading-relaxed border-l-2 border-cyan-600 pl-2">
                      💡 {s.tip}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quest type reference */}
        <section>
          <h2 className="font-pixel text-sm text-white mb-5">🏷️ QUEST TYPES</h2>
          <div className="grid grid-cols-2 gap-3">
            {questTypes.map((t) => (
              <div key={t.label}
                className="border-2 border-gray-600 bg-gray-800 p-4"
                style={{ boxShadow: '3px 3px 0 #000', borderLeftColor: t.color, borderLeftWidth: 4 }}>
                <p className="font-pixel text-xs mb-1" style={{ color: t.color }}>
                  {t.emoji} {t.label}
                </p>
                <p className="font-pixel text-[8px] text-gray-400 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Points tip */}
        <div className="border-2 border-green-600 bg-gray-800 p-4"
          style={{ boxShadow: '3px 3px 0 #000' }}>
          <p className="font-pixel text-[9px] text-green-300 leading-relaxed">
            💰 POINTS GUIDE: Side quests → 25–75 pts · Daily → 50–100 pts · Main → 100–300 pts · Hidden → 150–500 pts
          </p>
        </div>

        {/* CTA */}
        <div className="flex gap-4">
          <Link href="/admin/quests"
            className="pixel-btn flex-1 text-center bg-yellow-400 hover:bg-yellow-300
              text-black font-pixel text-sm px-6 py-3 rounded-none">
            ⚔️ GO CREATE QUESTS
          </Link>
          <Link href="/admin/dashboard"
            className="pixel-btn flex-1 text-center bg-gray-700 hover:bg-gray-600
              text-white font-pixel text-xs px-6 py-3 rounded-none">
            ← BACK TO ADMIN
          </Link>
        </div>

      </div>
    </div>
  )
}
