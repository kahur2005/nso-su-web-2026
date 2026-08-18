import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import QuestTabs from '../QuestTabs'
import { approveQuestSubmission, rejectQuestSubmission } from '../actions'
import { formatJakartaDateTime } from '@/lib/time'

type SubmissionStatus = 'awaiting_approval' | 'approved' | 'rejected'

const STATUSES: SubmissionStatus[] = ['awaiting_approval', 'approved', 'rejected']

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  awaiting_approval: 'Awaiting approval',
  approved: 'Approved',
  rejected: 'Rejected',
}

const STATUS_STYLE: Record<SubmissionStatus, string> = {
  awaiting_approval: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
}

function formatDateTime(iso: string) {
  return formatJakartaDateTime(iso, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function relationOne<T>(value: unknown): T | null {
  if (value == null) return null
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null
  return value as T
}

function isImageMime(mimeType: string) {
  return mimeType.startsWith('image/')
}

export default async function AdminQuestSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const { status: statusParam } = await searchParams
  const status = STATUSES.includes(statusParam as SubmissionStatus)
    ? (statusParam as SubmissionStatus)
    : statusParam === 'all'
      ? undefined
      : 'awaiting_approval'

  let query = supabase
    .from('QuestSubmission')
    .select(
      `
      id,
      status,
      createdAt,
      reviewedAt,
      student:Student(id, name, email, studentId),
      quest:Quest(id, title, points, type),
      files:QuestSubmissionFile(id, fileUrl, fileName, mimeType, sortOrder)
    `,
    )
    .order('createdAt', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data: submissionRows } = await query

  const submissions = (submissionRows ?? []).map((row) => ({
    ...row,
    student: relationOne<{
      id: string
      name: string
      email: string
      studentId: string
    }>(row.student),
    quest: relationOne<{ id: string; title: string; points: number; type: string }>(row.quest),
    files: [...(Array.isArray(row.files) ? row.files : row.files ? [row.files] : [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    ),
  }))

  const filterHref = (nextStatus?: string) => {
    const params = new URLSearchParams()
    const s = nextStatus ?? status ?? 'all'
    if (s) params.set('status', s)
    const query = params.toString()
    return query ? `/admin/quests/submissions?${query}` : '/admin/quests/submissions'
  }

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? 'border-slate-900 bg-slate-900 text-white'
        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
    }`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Quest submissions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review files students uploaded for submission quests. Approve to award
          points; reject to let them resubmit.
        </p>
      </div>

      <QuestTabs />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Status</span>
        <Link href={filterHref('all')} className={chip(!status)}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={filterHref(s)} className={chip(status === s)}>
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
          No submissions match this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const student = sub.student
            const quest = sub.quest

            return (
              <section
                key={sub.id}
                className="rounded-lg border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-medium text-slate-900">
                        {student?.name ?? 'Unknown student'}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[sub.status as SubmissionStatus]}`}
                      >
                        {STATUS_LABEL[sub.status as SubmissionStatus] ?? sub.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {student?.studentId ? (
                        <span className="font-mono">{student.studentId}</span>
                      ) : null}
                      {student?.email ? ` · ${student.email}` : ''}
                      {quest ? ` · ${quest.title}` : ''}
                      {' · submitted '}
                      {formatDateTime(sub.createdAt)}
                      {sub.reviewedAt ? ` · reviewed ${formatDateTime(sub.reviewedAt)}` : ''}
                    </p>
                  </div>
                  {quest && (
                    <div className="text-right text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">{quest.points}</span> pts
                    </div>
                  )}
                </div>

                {sub.files.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {sub.files.map((file) =>
                      isImageMime(file.mimeType) ? (
                        <a
                          key={file.id}
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-36"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={file.fileUrl}
                            alt={file.fileName}
                            className="h-36 w-full rounded-md border border-slate-200 object-cover"
                          />
                          <span className="mt-1 block truncate text-xs text-slate-500 underline">
                            {file.fileName}
                          </span>
                        </a>
                      ) : (
                        <a
                          key={file.id}
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-36 w-36 flex-col items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 text-center text-xs text-slate-600 hover:bg-slate-100"
                        >
                          <span className="font-medium">{file.fileName}</span>
                          <span className="mt-1 underline">Open file</span>
                        </a>
                      ),
                    )}
                  </div>
                )}

                {sub.status === 'awaiting_approval' && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                    <form action={approveQuestSubmission}>
                      <input type="hidden" name="id" value={sub.id} />
                      <button
                        type="submit"
                        className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={rejectQuestSubmission}>
                      <input type="hidden" name="id" value={sub.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
