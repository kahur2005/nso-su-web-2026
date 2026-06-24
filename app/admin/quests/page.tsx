// app/admin/quests/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminHeader from '@/components/layout/AdminHeader'
import PixelCard from '@/components/ui/PixelCard'
import { createQuest, toggleQuestActive } from '../actions'

const typeConfig: Record<string, { icon: string; color: string }> = {
  main: { icon: '⭐', color: '#FFD700' },
  daily: { icon: '📋', color: '#2196F3' },
  side: { icon: '🗒️', color: '#4CAF50' },
  hidden: { icon: '🔮', color: '#9C27B0' },
}

const inputClass = `w-full bg-gray-900 border-2 border-black text-white
  font-pixel text-xs p-3 focus:outline-none focus:border-yellow-500`

export default async function AdminQuestsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const { data: questRows } = await supabase
    .from('Quest')
    .select('*')
    .order('createdAt', { ascending: false })

  // Count completed progress rows per quest (Prisma's _count with a filter).
  const { data: completed } = await supabase
    .from('QuestProgress')
    .select('questId')
    .eq('status', 'completed')

  const completedByQuest = new Map<string, number>()
  for (const p of completed ?? []) {
    completedByQuest.set(p.questId, (completedByQuest.get(p.questId) ?? 0) + 1)
  }

  const quests = (questRows ?? []).map((q: any) => ({
    ...q,
    _count: { progress: completedByQuest.get(q.id) ?? 0 },
  }))

  return (
    <div className="min-h-screen bg-gray-900 scanlines">
      <AdminHeader title="⚔️ MANAGE QUESTS" subtitle="CREATE & ACTIVATE QUESTS" />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Create form */}
          <div>
            <PixelCard className="bg-gray-800">
              <h2 className="font-pixel text-sm text-white mb-4">➕ NEW QUEST</h2>

              <form action={createQuest} className="space-y-3">
                <div>
                  <label className="font-pixel text-xs text-gray-400 block mb-1">
                    TITLE
                  </label>
                  <input name="title" className={inputClass}
                    placeholder="e.g. Meet 5 NPCs" required />
                </div>

                <div>
                  <label className="font-pixel text-xs text-gray-400 block mb-1">
                    DESCRIPTION
                  </label>
                  <textarea name="description" rows={3} className={inputClass}
                    placeholder="What must the player do?" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-pixel text-xs text-gray-400 block mb-1">
                      TYPE
                    </label>
                    <select name="type" className={inputClass} defaultValue="side">
                      <option value="main">⭐ MAIN</option>
                      <option value="daily">📋 DAILY</option>
                      <option value="side">🗒️ SIDE</option>
                      <option value="hidden">🔮 HIDDEN</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-pixel text-xs text-gray-400 block mb-1">
                      POINTS
                    </label>
                    <input name="points" type="number" min={1} defaultValue={50}
                      className={inputClass} required />
                  </div>
                </div>

                <div>
                  <label className="font-pixel text-xs text-gray-400 block mb-1">
                    DEADLINE (OPTIONAL)
                  </label>
                  <input name="deadline" type="datetime-local" className={inputClass} />
                </div>

                <button type="submit"
                  className="pixel-btn w-full bg-yellow-400 hover:bg-yellow-300
                    text-black font-pixel text-sm px-6 py-3 rounded-none">
                  ⚡ CREATE QUEST
                </button>
                <p className="font-pixel text-[8px] text-gray-500">
                  NEW QUESTS START INACTIVE — ACTIVATE THEM FROM THE LIST.
                </p>
              </form>
            </PixelCard>
          </div>

          {/* Quest list */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-pixel text-sm text-white">📜 QUEST LOG</h2>
              <span className="font-pixel text-xs text-gray-400">
                {quests.length} TOTAL
              </span>
            </div>

            <div className="space-y-3">
              {quests.map((quest) => {
                const cfg = typeConfig[quest.type] || typeConfig.side
                return (
                  <PixelCard
                    key={quest.id}
                    className={`bg-gray-800 ${!quest.isActive ? 'opacity-60' : ''}`}
                    glowColor={quest.isActive ? cfg.color : undefined}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-pixel text-xs text-white">{quest.title}</p>
                        <p className="font-pixel text-[8px] text-gray-400 mt-1 leading-relaxed">
                          {quest.description.substring(0, 80)}
                          {quest.description.length > 80 ? '...' : ''}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="font-pixel text-[8px] uppercase"
                            style={{ color: cfg.color }}>
                            {quest.type}
                          </span>
                          <span className="font-pixel text-[8px] text-yellow-400">
                            +{quest.points} PTS
                          </span>
                          <span className="font-pixel text-[8px] text-green-400">
                            ✅ {quest._count.progress} DONE
                          </span>
                          {quest.deadline && (
                            <span className="font-pixel text-[8px] text-red-400">
                              ⏰ {new Date(quest.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <form action={toggleQuestActive.bind(null, quest.id)}>
                        <button
                          type="submit"
                          className={`font-pixel text-[8px] px-2 py-1 border-2 border-black
                            transition-colors ${quest.isActive
                              ? 'bg-green-700 text-white hover:bg-green-600'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                          style={{ boxShadow: '2px 2px 0 #000' }}
                        >
                          {quest.isActive ? '✅ ACTIVE' : '⛔ INACTIVE'}
                        </button>
                      </form>
                    </div>
                  </PixelCard>
                )
              })}

              {quests.length === 0 && (
                <PixelCard className="bg-gray-800 text-center py-8">
                  <span className="text-4xl">📜</span>
                  <p className="font-pixel text-xs text-gray-400 mt-4">
                    NO QUESTS YET — WRITE THE FIRST ONE!
                  </p>
                </PixelCard>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
