// app/api/qr/scan/route.ts
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Please login first!' }, { status: 401 })
  }

  const { token } = await request.json()
  const sessionStudentId = (session.user as any).studentId

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.QR_SECRET_KEY!) as any
    const { npcId, points } = decoded

    // Get student (resolve public studentId -> internal id)
    const { data: student } = await supabase
      .from('Student')
      .select('id')
      .eq('studentId', sessionStudentId)
      .maybeSingle()

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' })
    }

    // Atomically record the scan and award points (duplicate check + NPC
    // lookup happen inside the RPC). Returns the response payload as JSON.
    const { data: result, error } = await supabase.rpc('scan_npc', {
      p_student_id: student.id,
      p_npc_id: npcId,
      p_points: points,
    })

    if (error) {
      console.error(error)
      return NextResponse.json(
        { success: false, error: 'Server error' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ success: false, error: 'Invalid QR Code!' })
    }
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ success: false, error: 'QR Code expired!' })
    }
    console.error(error)
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}