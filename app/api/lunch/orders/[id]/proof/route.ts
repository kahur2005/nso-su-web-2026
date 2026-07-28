// app/api/lunch/orders/[id]/proof/route.ts
// The student submits their proof of payment: a screenshot of the QRIS receipt
// from their banking app. Uploading it is what moves the order from
// 'pending_payment' to 'awaiting_approval' and puts it in the admin queue.
//
// Note on privacy: uploadImage() creates a PUBLIC Supabase Storage bucket, so
// proofs are readable by anyone who has the URL. The filename is a random
// UUID, so the URL is not guessable, but this is not access control. It is the
// same tradeoff the avatar and committee-photo buckets already make.
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/lib/storage'
import { resolveStudentDbId } from '@/lib/lunch-data'

const MAX_PROOF_BYTES = 8 * 1024 * 1024

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
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

  const { data: order, error: orderError } = await supabase
    .from('LunchOrder')
    .select('id, studentId, status')
    .eq('id', id)
    .maybeSingle()

  if (orderError) {
    console.error('lunch proof: order lookup failed:', orderError)
    return NextResponse.json({ error: 'Could not submit proof' }, { status: 500 })
  }
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  // Owner only — an admin has no reason to upload on a student's behalf, and
  // allowing it would muddy who actually paid.
  if (order.studentId !== studentDbId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (order.status !== 'pending_payment') {
    return NextResponse.json(
      { error: 'This order has already been submitted.' },
      { status: 409 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('proof')

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Please attach a payment screenshot.' }, { status: 400 })
  }
  if (file.size > MAX_PROOF_BYTES) {
    return NextResponse.json({ error: 'That image is too large (max 8 MB).' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Proof of payment must be an image.' }, { status: 400 })
  }

  const paymentProofUrl = await uploadImage('lunch-proofs', file)
  if (!paymentProofUrl) {
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  // The status guard is repeated in the WHERE clause so two submits racing each
  // other cannot both win — the second matches no rows.
  const { data: updated, error: updateError } = await supabase
    .from('LunchOrder')
    .update({
      paymentProofUrl,
      status: 'awaiting_approval',
      submittedAt: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending_payment')
    .select('id')

  if (updateError) {
    console.error('lunch proof: update failed:', updateError)
    return NextResponse.json({ error: 'Could not submit proof' }, { status: 500 })
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: 'This order has already been submitted.' },
      { status: 409 }
    )
  }

  return NextResponse.json({ ok: true, paymentProofUrl })
}
