// app/admin/quests/page.tsx
// Quest admin: QR, submission, and quiz missions.
//
// Rebuilt in the AdminShell style the rest of the panel uses; this page
// previously rendered the student app's dark pixel styling via AdminHeader and
// was not reachable from the nav at all.
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import DataTable from '@/components/admin/DataTable'
import QuestForm from '@/components/admin/QuestForm'
import QuestQrButton from '@/components/admin/QuestQrButton'
import { QuestActiveToggle, DeleteQuestButton } from '@/components/admin/QuestRowActions'
import { QUEST_TYPE_LABEL, isQuestType, type QuestType } from '@/lib/quests'
import type { QuestionDraft } from '@/components/admin/QuestQuestionEditor'

export default async function AdminQuestsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const [{ data: questRows }, { data: achievementRows }, { data: progressRows }] =
    await Promise.all([
      supabase
        .from('Quest')
        .select(
          'id, title, description, points, type, isActive, achievementId, qrToken, qrCode, availableFrom, availableUntil',
        )
        .eq('isDeleted', false)
        .order('createdAt', { ascending: false }),
      supabase.from('Achievement').select('id, name').order('name'),
      supabase.from('QuestProgress').select('questId').eq('status', 'completed'),
    ])

  const achievements = achievementRows ?? []
  const achievementName = new Map(achievements.map((a) => [a.id, a.name]))

  const completions = new Map<string, number>()
  for (const p of progressRows ?? []) {
    completions.set(p.questId, (completions.get(p.questId) ?? 0) + 1)
  }

  const quests = questRows ?? []
  const activeCount = quests.filter((q) => q.isActive).length

  const quizQuestIds = quests
    .filter((q) => (isQuestType(q.type) ? q.type : 'qr') === 'quiz')
    .map((q) => q.id)

  const { data: questionRows } =
    quizQuestIds.length > 0
      ? await supabase
          .from('QuestQuestion')
          .select('id, questId, prompt, points, sortOrder')
          .in('questId', quizQuestIds)
          .order('sortOrder')
      : { data: [] as { id: string; questId: string; prompt: string; points: number; sortOrder: number }[] }

  const questionIds = (questionRows ?? []).map((q) => q.id)

  const { data: optionRows } =
    questionIds.length > 0
      ? await supabase
          .from('QuestQuestionOption')
          .select('questionId, label, isCorrect, sortOrder')
          .in('questionId', questionIds)
          .order('sortOrder')
      : { data: [] as { questionId: string; label: string; isCorrect: boolean; sortOrder: number }[] }

  const { data: answerRows } =
    questionIds.length > 0
      ? await supabase.from('QuestAnswer').select('questionId').in('questionId', questionIds)
      : { data: [] as { questionId: string }[] }

  const questionToQuest = new Map((questionRows ?? []).map((q) => [q.id, q.questId]))
  const frozenQuestIds = new Set<string>()
  for (const a of answerRows ?? []) {
    const questId = questionToQuest.get(a.questionId)
    if (questId) frozenQuestIds.add(questId)
  }

  const quizQuestionsByQuest = new Map<string, QuestionDraft[]>()
  for (const questId of quizQuestIds) {
    const drafts: QuestionDraft[] = (questionRows ?? [])
      .filter((q) => q.questId === questId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((q) => ({
        prompt: q.prompt,
        points: q.points,
        options: (optionRows ?? [])
          .filter((o) => o.questionId === q.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((o) => ({ label: o.label, isCorrect: o.isCorrect })),
      }))
    quizQuestionsByQuest.set(questId, drafts)
  }

  function questTypeOf(raw: string | null | undefined): QuestType {
    return isQuestType(raw) ? raw : 'qr'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Quests</h1>
        <p className="text-sm text-slate-500 mt-1">
          Missions students complete via QR scan, file submission, or quiz. {activeCount} of{' '}
          {quests.length} active. New to this?{' '}
          <Link href="/admin/guide" className="text-blue-600 hover:underline">
            Read the admin guide
          </Link>
          .
        </p>
      </div>

      <QuestForm achievements={achievements} />

      <DataTable headers={['Quest', 'Type', 'Points', 'Grants', 'Done', 'QR', 'Status', '', '']}>
        {quests.map((q) => {
          const type = questTypeOf(q.type)
          return (
            <tr key={q.id}>
              <td className="px-4 py-2.5 align-top max-w-sm">
                <p className="font-medium text-slate-800">{q.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{q.description}</p>
              </td>
              <td className="px-4 py-2.5 text-slate-600 align-top whitespace-nowrap">
                {QUEST_TYPE_LABEL[type]}
              </td>
              <td className="px-4 py-2.5 text-slate-600 align-top whitespace-nowrap">
                {q.points}
              </td>
              <td className="px-4 py-2.5 align-top whitespace-nowrap">
                {q.achievementId ? (
                  <span className="text-sm text-slate-600">
                    {achievementName.get(q.achievementId) ?? 'Unknown badge'}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-slate-600 align-top whitespace-nowrap">
                {completions.get(q.id) ?? 0}
              </td>
              <td className="px-4 py-2.5 align-top whitespace-nowrap">
                {type === 'qr' ? (
                  <QuestQrButton
                    questId={q.id}
                    title={q.title}
                    hasQr={Boolean(q.qrToken)}
                    qrCode={q.qrCode}
                  />
                ) : (
                  <span className="text-sm text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 align-top whitespace-nowrap">
                <QuestActiveToggle
                  id={q.id}
                  isActive={q.isActive}
                  hasQr={Boolean(q.qrToken)}
                  type={type}
                />
              </td>
              <td className="px-4 py-2.5 align-top whitespace-nowrap">
                <QuestForm
                  quest={{
                    id: q.id,
                    title: q.title,
                    description: q.description,
                    points: q.points,
                    type,
                    achievementId: q.achievementId,
                    availableFrom: q.availableFrom,
                    availableUntil: q.availableUntil,
                  }}
                  achievements={achievements}
                  quizQuestions={quizQuestionsByQuest.get(q.id)}
                  questionsFrozen={frozenQuestIds.has(q.id)}
                />
              </td>
              <td className="px-4 py-2.5 align-top whitespace-nowrap">
                <DeleteQuestButton
                  id={q.id}
                  title={q.title}
                  completions={completions.get(q.id) ?? 0}
                />
              </td>
            </tr>
          )
        })}
        {quests.length === 0 && (
          <tr>
            <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
              No quests yet.
            </td>
          </tr>
        )}
      </DataTable>
    </div>
  )
}
