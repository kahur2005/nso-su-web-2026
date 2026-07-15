// app/(game)/leaderboard/page.tsx
'use client'
import { useState, useEffect } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import ProgressBar from '@/components/ui/ProgressBar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import GroupEmblem from '@/components/ui/GroupEmblem'
import PixelAvatar from '@/components/ui/PixelAvatar'

type Tab = 'groups' | 'individual' | 'record'

interface Group {
  id: string
  name: string
  emblem: string
  emblemUrl?: string | null
  color: string
  totalPoints: number
  _count: { members: number }
}

interface Student {
  id: string
  name: string
  studentId: string
  points: number
  funFactsCollected: number
  avatarSkin?: string | null
  avatarHair?: string | null
  avatarEyes?: string | null
  avatarBrows?: string | null
  group: { name: string; emblem: string; emblemUrl?: string | null; color: string }
}

const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']
const trophies = [
  '/images/trophy_1.png',
  '/images/trophy_2.png',
  '/images/trophy_3.png',
]

// Pillar heights (2nd tallest in middle-left, 1st tallest in center, 3rd shorter on right)
// Order on screen: 2nd · 1st · 3rd
const podiumOrder = [1, 0, 2] // indexes into the top-3 array
const podiumHeights = ['h-20', 'h-28', 'h-14'] // heights for 2nd, 1st, 3rd pillars

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('groups')
  const [groups, setGroups] = useState<Group[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [feed, setFeed] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      const [lb, fd] = await Promise.all([
        fetch('/api/leaderboard').then(r => r.json()),
        fetch('/api/leaderboard/feed').then(r => r.json()),
      ])
      setGroups(lb.groups || [])
      setStudents(lb.topStudents || [])
      setFeed(fd.feed || [])
      setLastUpdate(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const typeIcon: Record<string, string> = {
    main: '⭐', daily: '📋', side: '🗒️', hidden: '🔮', scan: '📸',
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'groups', label: 'GROUPS', icon: '⚔️' },
    { key: 'individual', label: 'PLAYERS', icon: '👤' },
    { key: 'record', label: 'RECORD', icon: '📜' },
  ]

  if (loading) return <PageWrapper><LoadingSpinner text="LOADING SCORES..." /></PageWrapper>

  // Shared podium renderer
  function Podium({ list }: { list: Array<{ name: string; points: number; sub?: string; emblem?: string; emblemUrl?: string | null; color?: string; skin?: string | null; hair?: string | null; eyes?: string | null; brow?: string | null }> }) {
    if (list.length < 1) return null
    const top3 = list.slice(0, 3)

    return (
      <div className="mb-8">
        {/* Podium pillars */}
        <div className="flex items-end justify-center gap-2 mb-0">
          {podiumOrder.map((dataIdx, pillarIdx) => {
            const entry = top3[dataIdx]
            if (!entry) return <div key={pillarIdx} className="flex-1" />
            const rank = dataIdx + 1
            const color = rankColors[dataIdx]
            return (
              <div key={pillarIdx} className="flex-1 flex flex-col items-center gap-1 max-w-[110px]">
                {/* Trophy icon */}
                <img
                  src={trophies[dataIdx]}
                  alt={`${rank}st place`}
                  className="w-10 h-10 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
                {/* Entry emblem/name */}
                {entry.emblem && (
                  <GroupEmblem emblem={entry.emblem} emblemUrl={entry.emblemUrl} size={28} />
                )}
                {entry.skin && (
                  <PixelAvatar skin={entry.skin} hair={entry.hair ?? undefined} eyes={entry.eyes ?? undefined} brow={entry.brow ?? undefined} size={36} />
                )}
                <p
                  className="font-pixel text-[8px] text-center leading-tight px-1"
                  style={{ color }}
                >
                  {entry.name.length > 12 ? entry.name.slice(0, 11) + '…' : entry.name}
                </p>
                <p className="font-pixel text-[9px] text-yellow-400 text-center">
                  {entry.points.toLocaleString()}
                </p>
                {/* The pillar */}
                <div
                  className={`w-full ${podiumHeights[pillarIdx]} flex items-center justify-center border-2 border-black`}
                  style={{
                    background: dataIdx === 0
                      ? 'linear-gradient(180deg,#a67c00 0%,#7a5c00 100%)'
                      : dataIdx === 1
                      ? 'linear-gradient(180deg,#888 0%,#555 100%)'
                      : 'linear-gradient(180deg,#a0522d 0%,#6b3318 100%)',
                    boxShadow: '3px 3px 0 #000',
                  }}
                >
                  <span className="font-pixel text-sm text-white/80">#{rank}</span>
                </div>
              </div>
            )
          })}
        </div>
        {/* Ground line */}
        <div className="h-[3px] bg-black mt-0 mb-4" />
      </div>
    )
  }

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-pixel text-2xl text-yellow-400"
            style={{ textShadow: '3px 3px 0 #000' }}>
            🏆 LEADERBOARD
          </h1>
          <p className="font-pixel text-xs text-gray-500 mt-2">
            UPDATED {lastUpdate.toLocaleTimeString()}
            <button onClick={fetchData} className="ml-3 text-green-400 hover:text-green-300">
              [REFRESH]
            </button>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedGroup(null) }}
              className={`
                flex-1 font-pixel text-xs py-3 px-2
                border-2 border-black transition-all
                ${activeTab === tab.key
                  ? 'bg-green-600 text-white border-green-800'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }
              `}
              style={{ boxShadow: activeTab === tab.key ? '3px 3px 0 #000' : 'none' }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Groups Tab ── */}
        {activeTab === 'groups' && !selectedGroup && (
          <div>
            {/* Podium for top 3 groups */}
            <Podium
              list={groups.map(g => ({
                name: g.name,
                points: g.totalPoints,
                emblem: g.emblem,
                emblemUrl: g.emblemUrl,
                color: g.color,
              }))}
            />

            {/* Rows for 4th place onwards */}
            <div className="space-y-3">
              {groups.slice(3).map((group, i) => (
                <PixelCard
                  key={group.id}
                  className="bg-gray-800 cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <button className="w-full text-left" onClick={() => setSelectedGroup(group)}>
                    <div className="flex items-center gap-4">
                      <span className="font-pixel text-lg text-gray-400 w-10 text-center flex-shrink-0">
                        #{i + 4}
                      </span>
                      <GroupEmblem emblem={group.emblem} emblemUrl={group.emblemUrl} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="font-pixel text-sm text-white">{group.name}</p>
                        <ProgressBar
                          value={group.totalPoints}
                          max={groups[0]?.totalPoints || 1}
                          color={group.color}
                          showText={false}
                        />
                        <p className="font-pixel text-xs text-gray-400 mt-1">
                          {group._count.members} members
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-pixel text-lg text-white">
                          {group.totalPoints.toLocaleString()}
                        </p>
                        <p className="font-pixel text-xs text-gray-500">PTS</p>
                      </div>
                    </div>
                  </button>
                </PixelCard>
              ))}
            </div>
          </div>
        )}

        {/* Group Detail */}
        {activeTab === 'groups' && selectedGroup && (
          <div>
            <button
              onClick={() => setSelectedGroup(null)}
              className="font-pixel text-xs text-gray-400 hover:text-white mb-4 flex items-center gap-2"
            >
              ← BACK TO RANKINGS
            </button>
            <PixelCard className="bg-gray-800 mb-4 text-center" glowColor={selectedGroup.color}>
              <div className="mb-2">
                <GroupEmblem emblem={selectedGroup.emblem} emblemUrl={selectedGroup.emblemUrl} size={56} />
              </div>
              <h2 className="font-pixel text-xl text-white">{selectedGroup.name}</h2>
              <p className="font-pixel text-3xl text-yellow-400 mt-2">
                {selectedGroup.totalPoints.toLocaleString()} PTS
              </p>
            </PixelCard>
            <PixelCard className="bg-gray-800 mb-4">
              <h3 className="font-pixel text-sm text-white mb-4">📊 POINT BREAKDOWN</h3>
              {[
                { label: 'Quest Completions', points: Math.floor(selectedGroup.totalPoints * 0.5), icon: '⚔️' },
                { label: 'Fun Fact Scans', points: Math.floor(selectedGroup.totalPoints * 0.29), icon: '📖' },
                { label: 'Daily Check-ins', points: Math.floor(selectedGroup.totalPoints * 0.125), icon: '📋' },
                { label: 'Bonus Events', points: Math.floor(selectedGroup.totalPoints * 0.085), icon: '🎉' },
              ].map((item) => (
                <div key={item.label}
                  className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                  <span className="font-pixel text-xs text-gray-300">{item.icon} {item.label}</span>
                  <span className="font-pixel text-xs text-yellow-400">+{item.points} pts</span>
                </div>
              ))}
            </PixelCard>
          </div>
        )}

        {/* ── Individual Tab ── */}
        {activeTab === 'individual' && (
          <div>
            <Podium
              list={students.map(s => ({
                name: s.name,
                points: s.points,
                emblem: s.group?.emblem,
                emblemUrl: s.group?.emblemUrl,
                color: s.group?.color,
                skin: s.avatarSkin,
                hair: s.avatarHair,
                eyes: s.avatarEyes,
                brow: s.avatarBrows,
              }))}
            />
            <div className="space-y-3">
              {students.slice(3).map((student, index) => (
                <PixelCard key={student.id} className="bg-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="font-pixel text-sm text-gray-400 w-10 text-center">
                      #{index + 4}
                    </span>
                     <PixelAvatar
                      skin={student.avatarSkin ?? 'skin1'}
                      hair={student.avatarHair ?? undefined}
                      eyes={student.avatarEyes ?? undefined}
                      brow={student.avatarBrows ?? undefined}
                      size={40}
                      className="border-2 border-black"
                    />
                    <div className="flex-1">
                      <p className="font-pixel text-xs text-white">{student.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <GroupEmblem emblem={student.group?.emblem} emblemUrl={student.group?.emblemUrl} size={18} />
                        <span className="font-pixel text-xs" style={{ color: student.group?.color || '#fff' }}>
                          {student.group?.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-pixel text-sm text-yellow-400">{student.points.toLocaleString()}</p>
                      <p className="font-pixel text-xs text-purple-400">📖 {student.funFactsCollected}</p>
                    </div>
                  </div>
                </PixelCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Record Tab ── */}
        {activeTab === 'record' && (
          <div className="space-y-2">
            <p className="font-pixel text-[9px] text-gray-500 mb-3">LATEST POINTS EVENTS</p>
            {feed.length === 0 && (
              <PixelCard className="bg-gray-800 text-center py-8">
                <p className="font-pixel text-xs text-gray-400">NO RECORDS YET</p>
              </PixelCard>
            )}
            {feed.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 border-2 border-gray-700 bg-gray-800 px-3 py-2"
                style={{ boxShadow: '2px 2px 0 #000' }}
              >
                <span className="text-lg flex-shrink-0">{typeIcon[ev.questType] ?? '📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-pixel text-[9px] text-white truncate">{ev.studentName}</p>
                  <p className="font-pixel text-[8px] text-gray-400 truncate">{ev.label}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-pixel text-[10px] text-yellow-400">+{ev.points} PTS</p>
                  <p className="font-pixel text-[8px] text-gray-600">
                    {new Date(ev.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </PageWrapper>
  )
}