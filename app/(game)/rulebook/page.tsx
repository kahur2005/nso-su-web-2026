// app/(game)/rulebook/page.tsx
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import Link from 'next/link'

const rarities = [
  { name: 'COMMON', stars: '★', color: '#9E9E9E', points: '10 PTS' },
  { name: 'RARE', stars: '★★', color: '#2196F3', points: '25 PTS' },
  { name: 'EPIC', stars: '★★★', color: '#9C27B0', points: '50 PTS' },
  { name: 'LEGENDARY', stars: '★★★★', color: '#FFD700', points: '100 PTS' },
]

const questTypes = [
  { icon: '⭐', name: 'MAIN QUEST', color: '#FFD700', desc: 'Required missions during orientation week. Big rewards.' },
  { icon: '📋', name: 'DAILY QUEST', color: '#2196F3', desc: 'New challenges every day. Complete before midnight!' },
  { icon: '🗒️', name: 'SIDE QUEST', color: '#4CAF50', desc: 'Optional missions for extra points.' },
  { icon: '🔮', name: 'HIDDEN QUEST', color: '#9C27B0', desc: 'Secret quests. Find them yourself...' },
]

const conduct = [
  'Respect all players, NPCs and campus staff.',
  'One scan per NPC — sharing QR screenshots is cheating.',
  'No trading, selling or faking QR codes.',
  'Stay within campus zones during activities.',
  'Have fun. It is a game, after all!',
]

export default function RulebookPage() {
  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 float inline-block">📜</div>
          <h1 className="font-pixel text-2xl text-white"
            style={{ textShadow: '3px 3px 0 #000' }}>
            GAME RULEBOOK
          </h1>
          <p className="font-pixel text-xs text-gray-400 mt-2">
            OFFICIAL MANUAL — NSO 2026
          </p>
        </div>

        {/* Chapter 1: Objective */}
        <div className="mb-8">
          <h2 className="font-pixel text-sm text-yellow-400 mb-3">
            ▶ CHAPTER 1: YOUR MISSION
          </h2>
          <div className="rpg-dialog p-4">
            <p className="font-pixel text-xs text-gray-300 leading-relaxed">
              Welcome, new student! During orientation week the campus becomes
              your game world. Explore zones, meet committee members (NPCs),
              collect their fun facts, complete quests and lead your group to
              the top of the leaderboard.
            </p>
          </div>
        </div>

        {/* Chapter 2: Scanning */}
        <div className="mb-8">
          <h2 className="font-pixel text-sm text-green-400 mb-3">
            ▶ CHAPTER 2: SCANNING NPCs
          </h2>
          <PixelCard className="bg-gray-800">
            <ol className="space-y-3">
              {[
                'Find a committee member wearing an NPC badge.',
                'Open the SCAN page and point your camera at their QR code.',
                'Collect their fun fact and earn points instantly.',
                'Each NPC can be scanned only ONCE per player.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="font-pixel text-xs text-black bg-green-400
                    border-2 border-black w-6 h-6 flex items-center justify-center
                    flex-shrink-0" style={{ boxShadow: '2px 2px 0 #000' }}>
                    {i + 1}
                  </span>
                  <p className="font-pixel text-xs text-gray-300 leading-relaxed">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </PixelCard>
        </div>

        {/* Chapter 3: Rarities */}
        <div className="mb-8">
          <h2 className="font-pixel text-sm text-purple-400 mb-3">
            ▶ CHAPTER 3: NPC RARITIES
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {rarities.map((r) => (
              <PixelCard key={r.name} className="bg-gray-800 text-center"
                glowColor={r.color}>
                <p className="font-pixel text-sm" style={{ color: r.color }}>
                  {r.stars}
                </p>
                <p className="font-pixel text-xs mt-2" style={{ color: r.color }}>
                  {r.name}
                </p>
                <p className="font-pixel text-[8px] text-gray-400 mt-1">
                  UP TO {r.points}
                </p>
              </PixelCard>
            ))}
          </div>
        </div>

        {/* Chapter 4: Quests */}
        <div className="mb-8">
          <h2 className="font-pixel text-sm text-blue-400 mb-3">
            ▶ CHAPTER 4: QUEST TYPES
          </h2>
          <div className="space-y-2">
            {questTypes.map((q) => (
              <PixelCard key={q.name} className="bg-gray-800">
                <div className="flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">{q.icon}</span>
                  <div>
                    <p className="font-pixel text-xs" style={{ color: q.color }}>
                      {q.name}
                    </p>
                    <p className="font-pixel text-[8px] text-gray-400 mt-1 leading-relaxed">
                      {q.desc}
                    </p>
                  </div>
                </div>
              </PixelCard>
            ))}
          </div>
        </div>

        {/* Chapter 5: Levels & Leaderboard */}
        <div className="mb-8">
          <h2 className="font-pixel text-sm text-orange-400 mb-3">
            ▶ CHAPTER 5: LEVELS & RANKINGS
          </h2>
          <PixelCard className="bg-gray-800">
            <p className="font-pixel text-xs text-gray-300 leading-relaxed">
              Every point you earn is also XP. Leveling up gets tougher each
              time: the first level costs{' '}
              <span className="text-yellow-400">10 XP</span>, and the cost
              doubles every level after that (
              <span className="text-yellow-400">10 → 20 → 40 → 80 → 160 …</span>).
              Your points feed your group&apos;s total — the group with the
              most points at the end of the week wins the{' '}
              <span className="text-yellow-400">GRAND PRIZE</span>. Solo
              champions get glory on the player leaderboard too.
            </p>
          </PixelCard>
        </div>

        {/* Chapter 6: Code of Conduct */}
        <div className="mb-8">
          <h2 className="font-pixel text-sm text-red-400 mb-3">
            ▶ CHAPTER 6: CODE OF CONDUCT
          </h2>
          <PixelCard className="bg-red-900/30 border-red-700">
            <ul className="space-y-2">
              {conduct.map((rule, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-pixel text-xs text-red-400 flex-shrink-0">
                    ❗
                  </span>
                  <p className="font-pixel text-xs text-gray-300 leading-relaxed">
                    {rule}
                  </p>
                </li>
              ))}
            </ul>
          </PixelCard>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/scan">
            <span className="inline-block font-pixel text-sm text-white
              bg-green-600 border-4 border-black px-8 py-4 hover:bg-green-500
              transition-colors" style={{ boxShadow: '4px 4px 0 #000' }}>
              ▶ START YOUR ADVENTURE
            </span>
          </Link>
        </div>

      </div>
    </PageWrapper>
  )
}
