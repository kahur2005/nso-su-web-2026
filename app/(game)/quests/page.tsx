// app/(game)/quests/page.tsx
'use client'
import { useState, useEffect } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'
import PixelCard from '@/components/ui/PixelCard'
import ProgressBar from '@/components/ui/ProgressBar'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

type QuestType = 'all' | 'main' | 'daily' | 'side' | 'hidden'
type QuestStatus = 'pending' | 'in_progress' | 'completed' | 'locked'

interface Quest {
  id: string
  title: string
  description: string
  type: string
  points: number
  isActive: boolean
  isHidden: boolean
  deadline?: string
  progress?: {
    status: QuestStatus
    completedAt?: string
  }
}

const statusConfig = {
  pending: { label: 'PENDING', color: '#FFD700', icon: '⏳' },
  in_progress: { label: 'IN PROGRESS', color: '#2196F3', icon: '🔄' },
  completed: { label: 'COMPLETED', color: '#4CAF50', icon: '✅' },
  locked: { label: 'LOCKED', color: '#9E9E9E', icon: '🔒' },
}

const typeConfig = {
  main: { label: 'MAIN QUEST', color: '#FFD700', icon: '⭐', bg: 'bg-yellow-900/30' },
  daily: { label: 'DAILY QUEST', color: '#2196F3', icon: '📋', bg: 'bg-blue-900/30' },
  side: { label: 'SIDE QUEST', color: '#4CAF50', icon: '🗒️', bg: 'bg-green-900/30' },
  hidden: { label: 'HIDDEN', color: '#9C27B0', icon: '🔮', bg: 'bg-purple-900/30' },
}

export default function QuestsPage() {
  const [activeTab, setActiveTab] = useState<QuestType>('all')
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null)

  useEffect(() => {
    fetchQuests()
  }, [])

  async function fetchQuests() {
    try {
      const res = await fetch('/api/quests')
      const data = await res.json()
      setQuests(data.quests || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuests = activeTab === 'all'
    ? quests
    : quests.filter(q => q.type === activeTab)

  const completedCount = quests.filter(q => q.progress?.status === 'completed').length
  const totalActive = quests.filter(q => q.isActive && !q.isHidden).length

  const tabs: { key: QuestType; label: string; icon: string }[] = [
    { key: 'all', label: 'ALL', icon: '📜' },
    { key: 'main', label: 'MAIN', icon: '⭐' },
    { key: 'daily', label: 'DAILY', icon: '📋' },
    { key: 'side', label: 'SIDE', icon: '🗒️' },
    { key: 'hidden', label: 'HIDDEN', icon: '🔮' },
  ]

  if (loading) return <PageWrapper><LoadingSpinner text="LOADING QUESTS..." /></PageWrapper>

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-pixel text-2xl text-white"
            style={{ textShadow: '3px 3px 0 #000' }}>
            ⚔️ QUEST BOARD
          </h1>
          <ProgressBar
            value={completedCount}
            max={totalActive}
            color="#FFD700"
            label={`QUESTS COMPLETED`}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex-shrink-0 font-pixel text-xs py-2 px-3
                border-2 border-black transition-all whitespace-nowrap
                ${activeTab === tab.key
                  ? 'bg-yellow-600 text-black border-yellow-800'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }
              `}
              style={{
                boxShadow: activeTab === tab.key ? '3px 3px 0 #000' : 'none'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Quest List */}
        <div className="space-y-4">
          {/* Group by type */}
          {['main', 'daily', 'side', 'hidden'].map((type) => {
            const typeQuests = filteredQuests.filter(q => q.type === type)
            if (typeQuests.length === 0 && activeTab !== 'all') return null
            if (typeQuests.length === 0) return null
            if (activeTab !== 'all' && activeTab !== type) return null

            const config = typeConfig[type as keyof typeof typeConfig]

            return (
              <div key={type}>
                {activeTab === 'all' && (
                  <div className="flex items-center gap-2 mb-2">
                    <span>{config.icon}</span>
                    <h3 className="font-pixel text-xs" style={{ color: config.color }}>
                      {config.label}S
                    </h3>
                    <div className="flex-1 h-px bg-gray-700" />
                  </div>
                )}

                {typeQuests.map((quest) => {
                  const status = quest.progress?.status || 'pending'
                  const statusCfg = statusConfig[status]
                  const isExpanded = expandedQuest === quest.id
                  const isLocked = !quest.isActive || quest.isHidden

                  return (
                    <PixelCard
                      key={quest.id}
                      className={`${config.bg} ${isLocked ? 'opacity-60' : 'cursor-pointer hover:opacity-90'} transition-opacity`}
                      glowColor={status === 'completed' ? '#4CAF50' : undefined}
                    >
                      <button
                        className="w-full text-left"
                        onClick={() => !isLocked && setExpandedQuest(
                          isExpanded ? null : quest.id
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl flex-shrink-0">
                            {isLocked ? '🔒' : statusCfg.icon}
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="font-pixel text-xs text-white">
                                {isLocked ? '????? ?????' : quest.title}
                              </p>
                              <span className="font-pixel text-xs text-yellow-400 ml-2 flex-shrink-0">
                                +{quest.points} PTS
                              </span>
                            </div>

                            {!isLocked && (
                              <p className="font-pixel text-xs text-gray-400 mt-1">
                                {quest.description.substring(0, 60)}
                                {quest.description.length > 60 ? '...' : ''}
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-2">
                              <span className="font-pixel text-xs"
                                style={{ color: statusCfg.color }}>
                                {statusCfg.label}
                              </span>
                              {quest.deadline && !isLocked && (
                                <span className="font-pixel text-xs text-red-400">
                                  ⏰ {new Date(quest.deadline).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && !isLocked && (
                        <div className="mt-4 pt-4 border-t-2 border-gray-700">
                          <p className="font-pixel text-xs text-gray-300 leading-relaxed">
                            {quest.description}
                          </p>
                          {quest.deadline && (
                            <p className="font-pixel text-xs text-red-400 mt-3">
                              ⏰ DEADLINE: {new Date(quest.deadline).toLocaleString()}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                            <span className="font-pixel text-xs px-2 py-1 border border-current"
                              style={{ color: config.color }}>
                              {config.icon} {config.label}
                            </span>
                            <span className="font-pixel text-xs text-yellow-400">
                              REWARD: {quest.points} PTS
                            </span>
                          </div>
                        </div>
                      )}
                    </PixelCard>
                  )
                })}
              </div>
            )
          })}

          {filteredQuests.length === 0 && (
            <PixelCard className="bg-gray-800 text-center py-8">
              <span className="text-4xl">📜</span>
              <p className="font-pixel text-xs text-gray-400 mt-4">
                NO QUESTS AVAILABLE
              </p>
            </PixelCard>
          )}
        </div>

      </div>
    </PageWrapper>
  )
}