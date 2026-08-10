// app/api/quests/[id]/submit/route.ts
// Student multi-file upload for submission-type quests. Window gating is enforced
// server-side via assertQuestOpenForStudent (unlike QR scan).
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { uploadQuestFile } from '@/lib/storage'
import { assertQuestOpenForStudent } from '@/lib/quests-data'

async function resolveStudentDbId(session: {
  user: { id?: string; studentId?: string }
}): Promise<string | null> {
  let studentDbId = session.user.id
  if (!studentDbId && session.user.studentId) {
    const { data: student } = await supabase
      .from('Student')
      .select('id')
      .eq('studentId', session.user.studentId)
      .maybeSingle()
    studentDbId = student?.id ?? ''
  }
  return studentDbId || null
}

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

async function abandonSubmission(submissionId: string) {
  const { error } = await supabase.from('QuestSubmission').delete().eq('id', submissionId)
  if (error) console.error('quest submit: abandon submission failed:', error)
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const studentDbId = await resolveStudentDbId(session)
  if (!studentDbId) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const { id } = await ctx.params

  const questGate = await assertQuestOpenForStudent(id)
  if (!questGate.ok) {
    return NextResponse.json({ error: questGate.error }, { status: questGate.status })
  }
  if (questGate.quest.type !== 'submission') {
    return NextResponse.json({ error: 'Not a submission quest' }, { status: 400 })
  }

  const { data: progress } = await supabase
    .from('QuestProgress')
    .select('status')
    .eq('studentId', studentDbId)
    .eq('questId', id)
    .maybeSingle()

  if (progress?.status === 'completed') {
    return NextResponse.json({ error: 'You already completed this quest.' }, { status: 409 })
  }

  const { data: approvedRows, error: approvedError } = await supabase
    .from('QuestSubmission')
    .select('id')
    .eq('studentId', studentDbId)
    .eq('questId', id)
    .eq('status', 'approved')
    .limit(1)

  if (approvedError) {
    console.error('quest submit: approved lookup failed:', approvedError)
    return NextResponse.json({ error: 'Could not verify submission status' }, { status: 500 })
  }

  if (approvedRows?.[0]) {
    return NextResponse.json(
      { error: 'You already have an approved submission for this quest.' },
      { status: 409 },
    )
  }

  const { data: latestRows, error: latestError } = await supabase
    .from('QuestSubmission')
    .select('status')
    .eq('studentId', studentDbId)
    .eq('questId', id)
    .order('createdAt', { ascending: false })
    .limit(1)

  if (latestError) {
    console.error('quest submit: latest submission lookup failed:', latestError)
    return NextResponse.json({ error: 'Could not verify submission status' }, { status: 500 })
  }

  const latestSub = latestRows?.[0]
  if (latestSub?.status === 'approved') {
    return NextResponse.json(
      { error: 'You already have an approved submission for this quest.' },
      { status: 409 },
    )
  }

  const { data: pending } = await supabase
    .from('QuestSubmission')
    .select('id')
    .eq('studentId', studentDbId)
    .eq('questId', id)
    .eq('status', 'awaiting_approval')
    .maybeSingle()

  if (pending) {
    return NextResponse.json(
      { error: 'You already have a submission awaiting review.' },
      { status: 409 },
    )
  }

  const form = await request.formData()
  const files = form
    .getAll('files')
    .filter((f): f is File => f instanceof File && f.size > 0)

  if (files.length === 0) {
    return NextResponse.json({ error: 'Add at least one file' }, { status: 400 })
  }
  if (files.length > 10) {
    return NextResponse.json({ error: 'Too many files' }, { status: 400 })
  }

  const uploaded: { url: string; fileName: string; mimeType: string }[] = []
  for (const file of files) {
    const result = await uploadQuestFile(file)
    if (!result) {
      return NextResponse.json({ error: `Rejected file: ${file.name}` }, { status: 400 })
    }
    uploaded.push(result)
  }

  const { data: sub, error: subError } = await supabase
    .from('QuestSubmission')
    .insert({
      studentId: studentDbId,
      questId: id,
      status: 'awaiting_approval',
    })
    .select('id')
    .single()

  if (subError || !sub) {
    console.error('quest submit: insert failed:', subError)
    if (isUniqueViolation(subError)) {
      return NextResponse.json(
        { error: 'You already have a submission awaiting review.' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: 'Could not save submission' }, { status: 500 })
  }

  const fileRows = uploaded.map((u, i) => ({
    submissionId: sub.id,
    fileUrl: u.url,
    fileName: u.fileName,
    mimeType: u.mimeType,
    sortOrder: i,
  }))

  const { error: filesError } = await supabase.from('QuestSubmissionFile').insert(fileRows)
  if (filesError) {
    console.error('quest submit: files insert failed:', filesError)
    await abandonSubmission(sub.id)
    return NextResponse.json({ error: 'Could not save files' }, { status: 500 })
  }

  const { error: progressError } = await supabase.from('QuestProgress').upsert(
    {
      studentId: studentDbId,
      questId: id,
      status: 'in_progress',
      completedAt: null,
    },
    { onConflict: 'studentId,questId' },
  )
  if (progressError) {
    console.error('quest submit: progress upsert failed:', progressError)
    await abandonSubmission(sub.id)
    return NextResponse.json({ error: 'Could not update quest progress' }, { status: 500 })
  }

  return NextResponse.json({ submissionId: sub.id, status: 'awaiting_approval' as const })
}
