// app/admin/actions.ts
'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    throw new Error('Unauthorized')
  }
}

// --- Quests ---

export async function createQuest(formData: FormData) {
  await requireAdmin()

  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const type = String(formData.get('type') || 'side')
  const points = parseInt(String(formData.get('points') || '0'), 10)
  const deadline = String(formData.get('deadline') || '')

  if (!title || !description || !points) return

  await prisma.quest.create({
    data: {
      title,
      description,
      type,
      points,
      isHidden: type === 'hidden',
      deadline: deadline ? new Date(deadline) : null,
    }
  })

  revalidatePath('/admin/quests')
}

export async function toggleQuestActive(questId: string) {
  await requireAdmin()

  const quest = await prisma.quest.findUnique({ where: { id: questId } })
  if (!quest) return

  await prisma.quest.update({
    where: { id: questId },
    data: { isActive: !quest.isActive }
  })

  revalidatePath('/admin/quests')
}

// --- Groups ---

export async function createGroup(formData: FormData) {
  await requireAdmin()

  const name = String(formData.get('name') || '').trim()
  const emblem = String(formData.get('emblem') || '🛡️').trim()
  const color = String(formData.get('color') || '#4CAF50')

  if (!name) return

  await prisma.group.create({
    data: { name, emblem, color }
  })

  revalidatePath('/admin/groups')
}

export async function assignStudentToGroup(formData: FormData) {
  await requireAdmin()

  const studentId = String(formData.get('studentId') || '').trim()
  const groupId = String(formData.get('groupId') || '')

  if (!studentId || !groupId) return

  await prisma.student.update({
    where: { studentId },
    data: { groupId }
  })

  revalidatePath('/admin/groups')
}

// --- Points ---

export async function adjustPoints(formData: FormData) {
  await requireAdmin()

  const studentId = String(formData.get('studentId') || '').trim()
  const amount = parseInt(String(formData.get('amount') || '0'), 10)

  if (!studentId || !amount) return

  const student = await prisma.student.findUnique({
    where: { studentId }
  })
  if (!student) return

  await prisma.$transaction([
    prisma.student.update({
      where: { id: student.id },
      data: {
        points: { increment: amount },
        ...(amount > 0 ? { xp: { increment: amount } } : {})
      }
    }),
    ...(student.groupId ? [
      prisma.group.update({
        where: { id: student.groupId },
        data: { totalPoints: { increment: amount } }
      })
    ] : [])
  ])

  revalidatePath('/admin/points')
}

// --- Announcements ---

export async function createAnnouncement(formData: FormData) {
  await requireAdmin()

  const title = String(formData.get('title') || '').trim()
  const content = String(formData.get('content') || '').trim()

  if (!title || !content) return

  await prisma.announcement.create({
    data: { title, content }
  })

  revalidatePath('/admin/announcements')
}

export async function toggleAnnouncement(announcementId: string) {
  await requireAdmin()

  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId }
  })
  if (!announcement) return

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { isActive: !announcement.isActive }
  })

  revalidatePath('/admin/announcements')
}

// --- NPCs ---

export async function toggleNpcActive(npcId: string) {
  await requireAdmin()

  const npc = await prisma.nPC.findUnique({ where: { id: npcId } })
  if (!npc) return

  await prisma.nPC.update({
    where: { id: npcId },
    data: { isActive: !npc.isActive }
  })

  revalidatePath('/admin/npc')
}
