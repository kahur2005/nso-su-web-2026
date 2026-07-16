// app/api/auth/register/route.ts
import { supabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/password'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const name = String(body.name || '').trim()
  const email = String(body.email || '').toLowerCase().trim()
  const password = String(body.password || '')
  const medicalNote = String(body.medicalNote || '').trim()
  const achievements = String(body.achievements || '').trim()
  const instagram = String(body.instagram || '').trim()
  const major = String(body.major || '').trim()
  const hobby = String(body.hobby || '').trim()
  const avatarSkin = String(body.avatarSkin || 'skin1').trim()
  const avatarHair = body.avatarHair ? String(body.avatarHair).trim() : null
  const avatarEyes = body.avatarEyes ? String(body.avatarEyes).trim() : null
  const avatarBrows = body.avatarBrows ? String(body.avatarBrows).trim() : null

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: 'Name, email, and password are required.' },
      { status: 400 }
    )
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters.' },
      { status: 400 }
    )
  }
  // Questionnaire steps are required (instagram is optional).
  if (!major || !hobby || !medicalNote || !achievements) {
    return NextResponse.json(
      { error: 'Please answer the major, hobby, achievement, and health questions.' },
      { status: 400 }
    )
  }

  const { data: existing } = await supabase
    .from('Student')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists.' },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('Student').insert({
    studentId: `NSO-${randomUUID().slice(0, 8).toUpperCase()}`,
    name,
    email,
    password: hashPassword(password),
    medicalNote,
    pastAchievements: achievements,
    instagram: instagram || null,
    major,
    hobby,
    avatarSkin,
    avatarHair,
    avatarEyes,
    avatarBrows,
  })

  if (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Could not create account. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
