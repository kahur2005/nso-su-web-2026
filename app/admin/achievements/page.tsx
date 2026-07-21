// app/admin/achievements/page.tsx
// Achievement badges. An achievement is only ever unlocked by completing a
// quest that links to it, so one with no quest pointing at it is unobtainable —
// the table calls that out rather than letting it sit there silently.
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DataTable from '@/components/admin/DataTable'
import AchievementForm from '@/components/admin/AchievementForm'
import DeleteAchievementButton from '@/components/admin/DeleteAchievementButton'

export default async function AdminAchievementsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const [{ data: achievementRows }, { data: questRows }, { data: unlockRows }] =
    await Promise.all([
      supabase
        .from('Achievement')
        .select('id, name, description, imageUrl')
        .order('createdAt', { ascending: false }),
      supabase.from('Quest').select('achievementId').eq('isDeleted', false),
      supabase.from('StudentAchievement').select('achievementId'),
    ])

  const questCount = new Map<string, number>()
  for (const q of questRows ?? []) {
    if (q.achievementId) questCount.set(q.achievementId, (questCount.get(q.achievementId) ?? 0) + 1)
  }
  const unlockCount = new Map<string, number>()
  for (const u of unlockRows ?? []) {
    unlockCount.set(u.achievementId, (unlockCount.get(u.achievementId) ?? 0) + 1)
  }

  const achievements = achievementRows ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Achievements</h1>
        <p className="text-sm text-slate-500 mt-1">
          Badges students earn. Create one here first, then link it from a quest
          in <span className="font-medium text-slate-700">Quests</span> — an
          achievement is only awarded when a student completes a quest that
          grants it. Unlocked badges show on a student&apos;s profile.
        </p>
      </div>

      <AchievementForm />

      <DataTable headers={['Badge', 'Name', 'Description', 'Granted by', 'Unlocked', '', '']}>
        {achievements.map((a) => {
          const quests = questCount.get(a.id) ?? 0
          return (
            <tr key={a.id}>
              <td className="px-4 py-2.5 align-top">
                {a.imageUrl ? (
                  <img
                    src={a.imageUrl}
                    alt=""
                    className="h-10 w-10 rounded object-contain"
                  />
                ) : (
                  <span className="text-sm text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 font-medium text-slate-800 align-top whitespace-nowrap">
                {a.name}
              </td>
              <td className="px-4 py-2.5 text-slate-600 align-top max-w-xs">
                {a.description}
              </td>
              <td className="px-4 py-2.5 align-top whitespace-nowrap">
                {quests > 0 ? (
                  <span className="text-sm text-slate-600">
                    {quests} quest{quests === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="text-sm text-amber-600" title="No quest grants this badge, so nobody can earn it">
                    No quest — unobtainable
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-slate-600 align-top whitespace-nowrap">
                {unlockCount.get(a.id) ?? 0}
              </td>
              <td className="px-4 py-2.5 align-top whitespace-nowrap">
                <AchievementForm achievement={a} />
              </td>
              <td className="px-4 py-2.5 align-top whitespace-nowrap">
                <DeleteAchievementButton
                  id={a.id}
                  name={a.name}
                  unlocked={unlockCount.get(a.id) ?? 0}
                />
              </td>
            </tr>
          )
        })}
        {achievements.length === 0 && (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
              No achievements yet.
            </td>
          </tr>
        )}
      </DataTable>
    </div>
  )
}
