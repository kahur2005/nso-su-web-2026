// app/(game)/leaderboard/page.tsx
'use client'
import { useState, useEffect } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import ProgressBar from '@/components/ui/ProgressBar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

type Tab = 'groups' | 'individual' | 'daily'

interface Group {
  id: string
  name: string
  emblem: string
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
  group: { name: string; emblem: string; color: string }
}

const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']
const rankIcons = ['👑', '🥈', '🥉']

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('groups')
  const [groups, setGroups] = useState<Group[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchData()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/leaderboard')
      const data = await res.json()
      setGroups(data.groups || [])
      setStudents(data.topStudents || [])
      setLastUpdate(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'groups', label: 'GROUPS', icon: '⚔️' },
    { key: 'individual', label: 'PLAYERS', icon: '👤' },
    { key: 'daily', label: 'DAILY', icon: '🌅' },
  ]

  if (loading) return <PageWrapper><LoadingSpinner text="LOADING SCORES..." /></PageWrapper>

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

        {/* #1 Spotlight */}
        {groups[0] && activeTab === 'groups' && (
          <PixelCard
            className="bg-yellow-900/30 mb-6 text-center"
            glowColor="#FFD700"
          >
            <p className="font-pixel text-xs text-yellow-400 mb-2">
              👑 CURRENT LEADER 👑
            </p>
            <div className="text-5xl mb-2 float inline-block">{groups[0].emblem}</div>
            <h2 className="font-pixel text-xl text-white">{groups[0].name}</h2>
            <p className="font-pixel text-2xl text-yellow-400 mt-2">
              {groups[0].totalPoints.toLocaleString()} PTS
            </p>
            <p className="font-pixel text-xs text-gray-400 mt-1">
              {groups[0]._count.members} MEMBERS
            </p>
          </PixelCard>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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

        {/* Groups Tab */}
        {activeTab === 'groups' && !selectedGroup && (
          <div className="space-y-3">
            {groups.map((group, index) => (
              <PixelCard
                key={group.id}
                className="bg-gray-800 cursor-pointer hover:bg-gray-700 transition-colors"
                glowColor={index < 3 ? rankColors[index] : undefined}
              >
                <button
                  className="w-full text-left"
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-10 text-center flex-shrink-0">
                      {index < 3 ? (
                        <span className="text-2xl">{rankIcons[index]}</span>
                      ) : (
                        <span className="font-pixel text-lg text-gray-400">
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    {/* Emblem */}
                    <span className="text-3xl">{group.emblem}</span>

                    {/* Info */}
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

                    {/* Points */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-pixel text-lg"
                        style={{ color: index < 3 ? rankColors[index] : '#fff' }}>
                        {group.totalPoints.toLocaleString()}
                      </p>
                      <p className="font-pixel text-xs text-gray-500">PTS</p>
                    </div>
                  </div>
                </button>
              </PixelCard>
            ))}
          </div>
        )}

        {/* Group Detail */}
        {activeTab === 'groups' && selectedGroup && (
          <div>
            <button
              onClick={() => setSelectedGroup(null)}
              className="font-pixel text-xs text-gray-400 hover:text-white mb-4
                flex items-center gap-2"
            >
              ← BACK TO RANKINGS
            </button>

            <PixelCard
              className="bg-gray-800 mb-4 text-center"
              glowColor={selectedGroup.color}
            >
              <div className="text-5xl mb-2">{selectedGroup.emblem}</div>
              <h2 className="font-pixel text-xl text-white">{selectedGroup.name}</h2>
              <p className="font-pixel text-3xl text-yellow-400 mt-2">
                {selectedGroup.totalPoints.toLocaleString()} PTS
              </p>
            </PixelCard>

            {/* Point breakdown placeholder */}
            <PixelCard className="bg-gray-800 mb-4">
              <h3 className="font-pixel text-sm text-white mb-4">
                📊 POINT BREAKDOWN
              </h3>
              {[
                { label: 'Quest Completions', points: Math.floor(selectedGroup.totalPoints * 0.5), icon: '⚔️' },
                { label: 'Fun Fact Scans', points: Math.floor(selectedGroup.totalPoints * 0.29), icon: '📖' },
                { label: 'Daily Check-ins', points: Math.floor(selectedGroup.totalPoints * 0.125), icon: '📋' },
                { label: 'Bonus Events', points: Math.floor(selectedGroup.totalPoints * 0.085), icon: '🎉' },
              ].map((item) => (
                <div key={item.label}
                  className="flex justify-between items-center py-2
                    border-b border-gray-700 last:border-0">
                  <span className="font-pixel text-xs text-gray-300">
                    {item.icon} {item.label}
                  </span>
                  <span className="font-pixel text-xs text-yellow-400">
                    +{item.points} pts
                  </span>
                </div>
              ))}
            </PixelCard>
          </div>
        )}

        {/* Individual Tab */}
        {activeTab === 'individual' && (
          <div className="space-y-3">
            {students.map((student, index) => (
              <PixelCard key={student.id} className="bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 text-center">
                    {index < 3 ? (
                      <span className="text-xl">{rankIcons[index]}</span>
                    ) : (
                      <span className="font-pixel text-sm text-gray-400">
                        #{index + 1}
                      </span>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-gray-700 border-2 border-black
                    flex items-center justify-center text-lg">
                    👤
                  </div>
                  <div className="flex-1">
                    <p className="font-pixel text-xs text-white">{student.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm">{student.group?.emblem}</span>
                      <span className="font-pixel text-xs"
                        style={{ color: student.group?.color || '#fff' }}>
                        {student.group?.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-pixel text-sm text-yellow-400">
                      {student.points.toLocaleString()}
                    </p>
                    <p className="font-pixel text-xs text-purple-400">
                      📖 {student.funFactsCollected}
                    </p>
                  </div>
                </div>
              </PixelCard>
            ))}
          </div>
        )}

        {/* Daily Tab */}
        {activeTab === 'daily' && (
          <PixelCard className="bg-gray-800 text-center py-8">
            <span className="text-4xl">🌅</span>
            <p className="font-pixel text-sm text-white mt-4">DAILY RANKINGS</p>
            <p className="font-pixel text-xs text-gray-400 mt-2">
              RESETS AT MIDNIGHT
            </p>
            <p className="font-pixel text-xs text-yellow-400 mt-4">
              COMING SOON...
            </p>
          </PixelCard>
        )}

      </div>
    </PageWrapper>
  )
}