// app/(game)/rulebook/page.tsx
import PageWrapper from '@/components/layout/PageWrapper'
import Link from 'next/link'

const OUTLINE_GOLD = {
  color: '#ffd23f',
  textShadow:
    '3px 3px 0 #4e342e, -3px 3px 0 #4e342e, 3px -3px 0 #4e342e, -3px -3px 0 #4e342e, 0 5px 0 #4e342e',
}

const rarities = [
  { name: 'COMMON', stars: '★', color: '#8a5a37', points: '10 PTS' },
  { name: 'RARE', stars: '★★', color: '#1d4ed8', points: '25 PTS' },
  { name: 'EPIC', stars: '★★★', color: '#7e22ce', points: '50 PTS' },
  { name: 'LEGENDARY', stars: '★★★★', color: '#b8860b', points: '100 PTS' },
]

const questTypes = [
  { icon: '⭐', name: 'MAIN QUEST', color: '#b8860b', desc: 'Required missions during orientation week. Big rewards.' },
  { icon: '📋', name: 'DAILY QUEST', color: '#1d4ed8', desc: 'New challenges every day. Complete before midnight!' },
  { icon: '🗒️', name: 'SIDE QUEST', color: '#15803d', desc: 'Optional missions for extra points.' },
  { icon: '🔮', name: 'HIDDEN QUEST', color: '#7e22ce', desc: 'Secret quests. Find them yourself...' },
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
      <div className="game-column min-h-dvh flex flex-col justify-between py-6 px-4">
        <div>
          {/* Header */}
          <div className="text-center mb-6">
            <h1
              className="font-bytebounce text-[clamp(2.2rem,10vw,3.2rem)] leading-none"
              style={OUTLINE_GOLD}
            >
              GAME RULEBOOK
            </h1>
            <p
              className="mt-1 font-bytebounce text-[16px] text-white"
              style={{ textShadow: '1.5px 1.5px 0 #4e342e' }}
            >
              OFFICIAL MANUAL — NSO 2026
            </p>
          </div>

          {/* Chapter 1: Objective */}
          <div className="mb-5">
            <h2 className="font-bytebounce text-[20px] text-[#ffd23f] mb-2" style={{ textShadow: '1.5px 1.5px 0 #4e342e' }}>
              ▶ CHAPTER 1: YOUR MISSION
            </h2>
            <div className="rounded-lg border-2 border-[#3a2418] bg-[#fdf6e3] p-3.5">
              <p className="font-bytebounce text-[16px] text-[#5d4330] leading-relaxed">
                Welcome, new student! During orientation week the campus becomes
                your game world. Explore zones, meet committee members (NPCs),
                collect their fun facts, complete quests and lead your group to
                the top of the leaderboard.
              </p>
            </div>
          </div>

          {/* Chapter 2: Scanning */}
          <div className="mb-5">
            <h2 className="font-bytebounce text-[20px] text-[#22c55e] mb-2" style={{ textShadow: '1.5px 1.5px 0 #4e342e' }}>
              ▶ CHAPTER 2: SCANNING NPCs
            </h2>
            <div className="rounded-lg border-2 border-[#3a2418] bg-[#fdf6e3] p-3.5">
              <ol className="space-y-2.5">
                {[
                  'Find a committee member wearing an NPC badge.',
                  'Open the SCAN page and point your camera at their QR code.',
                  'Collect their fun fact and earn points instantly.',
                  'Each NPC can be scanned only ONCE per player.',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="font-bytebounce text-[14px] text-white bg-[#8a5a37] border border-[#3a2418] w-5 h-5 rounded flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <p className="font-bytebounce text-[16px] text-[#5d4330]">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Chapter 3: Rarities */}
          <div className="mb-5">
            <h2 className="font-bytebounce text-[20px] text-[#a855f7] mb-2" style={{ textShadow: '1.5px 1.5px 0 #4e342e' }}>
              ▶ CHAPTER 3: NPC RARITIES
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {rarities.map((r) => (
                <div key={r.name} className="rounded-lg border-2 border-[#3a2418] bg-[#fdf6e3] p-3 text-center">
                  <p className="font-bytebounce text-[16px]" style={{ color: r.color }}>
                    {r.stars}
                  </p>
                  <p className="font-bytebounce text-[18px]" style={{ color: r.color }}>
                    {r.name}
                  </p>
                  <p className="font-bytebounce text-[13px] text-[#8a5a37]">
                    UP TO {r.points}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Chapter 4: Quests */}
          <div className="mb-5">
            <h2 className="font-bytebounce text-[20px] text-[#3b82f6] mb-2" style={{ textShadow: '1.5px 1.5px 0 #4e342e' }}>
              ▶ CHAPTER 4: QUEST TYPES
            </h2>
            <div className="space-y-2">
              {questTypes.map((q) => (
                <div key={q.name} className="rounded-lg border-2 border-[#3a2418] bg-[#fdf6e3] p-3 flex items-center gap-3">
                  <span className="text-2xl shrink-0">{q.icon}</span>
                  <div>
                    <p className="font-bytebounce text-[18px]" style={{ color: q.color }}>
                      {q.name}
                    </p>
                    <p className="font-bytebounce text-[14px] text-[#5d4330] leading-snug">
                      {q.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chapter 5: Code of Conduct */}
          <div className="mb-6">
            <h2 className="font-bytebounce text-[20px] text-[#ef4444] mb-2" style={{ textShadow: '1.5px 1.5px 0 #4e342e' }}>
              ▶ CHAPTER 5: CODE OF CONDUCT
            </h2>
            <div className="rounded-lg border-2 border-[#800000] bg-[#fff5f5] p-3.5">
              <ul className="space-y-2">
                {conduct.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-bytebounce text-[16px] text-[#ef4444] shrink-0">
                      ❗
                    </span>
                    <p className="font-bytebounce text-[15px] text-[#5d4330] leading-relaxed">
                      {rule}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center pb-6">
          <Link
            href="/scan"
            className="wood-plank inline-block px-8 py-3 font-bytebounce text-[26px] text-[#ffd23f] active:translate-y-0.5"
            style={{ textShadow: '2px 2px 0 #3e2723' }}
          >
            ▶ START SCANNING NOW
          </Link>
        </div>
      </div>
    </PageWrapper>
  )
}
