// app/admin/quests/page.tsx
// QR quests. A quest is a mission that isn't tied to a person: one printed code
// is scanned by every student, and QuestProgress's unique (studentId, questId)
// constraint is what stops anyone claiming it twice.
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

export default async function AdminQuestsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const [{ data: questRows }, { data: achievementRows }, { data: progressRows }] =
    await Promise.all([
      supabase
        .from('Quest')
        .select('id, title, description, points, isActive, achievementId, qrToken, qrCode')
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Quests</h1>
        <p className="text-sm text-slate-500 mt-1">
          Missions students complete by scanning a printed QR code. {activeCount} of{' '}
          {quests.length} active. New to this?{' '}
          <Link href="/admin/guide" className="text-blue-600 hover:underline">
            Read the admin guide
          </Link>
          .
        </p>
      </div>

      <QuestForm achievements={achievements} />

      <DataTable headers={['Quest', 'Points', 'Grants', 'Done', 'QR', 'Status', '', '']}>
        {quests.map((q) => (
          <tr key={q.id}>
            <td className="px-4 py-2.5 align-top max-w-sm">
              <p className="font-medium text-slate-800">{q.title}</p>
              <p className="text-sm text-slate-500 mt-0.5">{q.description}</p>
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
              <QuestQrButton
                questId={q.id}
                title={q.title}
                hasQr={Boolean(q.qrToken)}
                qrCode={q.qrCode}
              />
            </td>
            <td className="px-4 py-2.5 align-top whitespace-nowrap">
              <QuestActiveToggle
                id={q.id}
                isActive={q.isActive}
                hasQr={Boolean(q.qrToken)}
              />
            </td>
            <td className="px-4 py-2.5 align-top whitespace-nowrap">
              <QuestForm
                quest={{
                  id: q.id,
                  title: q.title,
                  description: q.description,
                  points: q.points,
                  achievementId: q.achievementId,
                }}
                achievements={achievements}
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
        ))}
        {quests.length === 0 && (
          <tr>
            <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
              No quests yet.
            </td>
          </tr>
        )}
      </DataTable>
    </div>
  )
}
