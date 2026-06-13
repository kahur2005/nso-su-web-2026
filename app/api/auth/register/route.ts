// app/api/auth/register/route.ts
import { prisma } from '@/lib/prisma'
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
  // Questionnaire Q1 and Q2 are required (Q3 / instagram is optional).
  if (!medicalNote || !achievements) {
    return NextResponse.json(
      { error: 'Please answer the medical and achievement questions.' },
      { status: 400 }
    )
  }

  const existing = await prisma.student.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists.' },
      { status: 409 }
    )
  }

  await prisma.student.create({
    data: {
      studentId: `NSO-${randomUUID().slice(0, 8).toUpperCase()}`,
      name,
      email,
      password: hashPassword(password),
      medicalNote,
      pastAchievements: achievements,
      instagram: instagram || null,
    },
  })

  return NextResponse.json({ success: true })
}
