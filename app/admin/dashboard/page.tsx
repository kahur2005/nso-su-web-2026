// app/admin/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import PixelCard from '@/components/ui/PixelCard'

async function getAdminStats() {
  const [
    totalStudents, totalScans, totalNPCs,
    activeQuests, groups, announcements
  ] = await Promise.all([
    prisma.student.count(),
    prisma.scanLog.count(),
    prisma.nPC.count({ where: { isActive: true } }),
    prisma.quest.count({ where: { isActive: true } }),
    prisma.group.findMany({ orderBy: { totalPoints: 'desc' } }),
    prisma.announcement.findMany({
      where: { isActive: true },
      take: 3
    })
  ])

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayScans = await prisma.scanLog.count({
    where: { scannedAt: { gte: todayStart } }
  })

  return {
    totalStudents, totalScans, totalNPCs,
    activeQuests, groups, announcements, todayScans
  }
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    redirect('/dashboard')
  }

  const stats = await getAdminStats()

  const adminMenus = [
    { href: '/admin/npc', icon: '👤', label: 'MANAGE NPCs', desc: 'Add & generate QR codes', color: '#4CAF50' },
    { href: '/admin/quests', icon: '⚔️', label: 'QUESTS', desc: 'Create & activate quests', color: '#FFD700' },
    { href: '/admin/groups', icon: '⚔️', label: 'GROUPS', desc: 'Manage student groups', color: '#2196F3' },
    { href: '/admin/points', icon: '⭐', label: 'POINTS', desc: 'Manual point adjustment', color: '#FF9800' },
    { href: '/admin/announcements', icon: '📢', label: 'ANNOUNCEMENTS', desc: 'Push notifications', color: '#E91E63' },
  ]

  return (
    <div className="min-h-screen bg-gray-900 scanlines">
      {/* Admin Header */}
      <div className="bg-red-900 border-b-4 border-black py-4 px-6
        flex justify-between items-center">
        <div>
          <h1 className="font-pixel text-lg text-white">⚙️ ADMIN PANEL</h1>
          <p className="font-pixel text-xs text-red-300 mt-1">NSO 2026 COMMITTEE</p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard"
            className="font-pixel text-xs text-gray-300 hover:text-white">
            ← BACK TO GAME
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '👥', label: 'STUDENTS', value: stats.totalStudents, color: '#4CAF50' },
            { icon: '📊', label: 'TOTAL SCANS', value: stats.totalScans, color: '#2196F3' },
            { icon: '🌅', label: "TODAY'S SCANS", value: stats.todayScans, color: '#FF9800' },
            { icon: '👤', label: 'ACTIVE NPCs', value: stats.totalNPCs, color: '#9C27B0' },
          ].map((stat) => (
            <PixelCard key={stat.label} className="bg-gray-800 text-center">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <p className="font-pixel text-2xl" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="font-pixel text-xs text-gray-400 mt-1">{stat.label}</p>
            </PixelCard>
          ))}
        </div>

        {/* Quick Actions Grid */}
        <h2 className="font-pixel text-sm text-white mb-4">⚙️ ADMIN CONTROLS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {adminMenus.map((menu) => (
            <Link key={menu.href} href={menu.href}>
              <PixelCard
                className="bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer"
                glowColor={menu.color}
              >
                <div className="flex items-center gap-4 p-2">
                  <span className="text-3xl">{menu.icon}</span>
                  <div>
                    <p className="font-pixel text-sm text-white">{menu.label}</p>
                    <p className="font-pixel text-xs text-gray-400 mt-1">
                      {menu.desc}
                    </p>
                  </div>
                </div>
              </PixelCard>
            </Link>
          ))}
        </div>

        {/* Leaderboard Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-pixel text-sm text-white mb-4">
              🏆 CURRENT RANKINGS
            </h2>
            <div className="space-y-2">
              {stats.groups.map((group, i) => (
                <PixelCard key={group.id} className="bg-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="font-pixel text-sm text-gray-400 w-8">
                      #{i + 1}
                    </span>
                    <span className="text-xl">{group.emblem}</span>
                    <div className="flex-1">
                      <p className="font-pixel text-xs text-white">{group.name}</p>
                    </div>
                    <p className="font-pixel text-xs text-yellow-400">
                      {group.totalPoints} pts
                    </p>
                  </div>
                </PixelCard>
              ))}
            </div>
          </div>

          {/* Recent Announcements */}
          <div>
            <h2 className="font-pixel text-sm text-white mb-4">
              📢 ANNOUNCEMENTS
            </h2>
            <div className="space-y-2">
              {stats.announcements.map((ann) => (
                <PixelCard key={ann.id} className="bg-gray-800">
                  <p className="font-pixel text-xs text-white">{ann.title}</p>
                  <p className="font-pixel text-xs text-gray-400 mt-1">
                    {ann.content.substring(0, 60)}...
                  </p>
                </PixelCard>
              ))}
              <Link href="/admin/announcements">
                <button className="w-full font-pixel text-xs text-green-400
                  border border-green-700 py-3 hover:bg-green-900/30 transition-colors">
                  + ADD ANNOUNCEMENT
                </button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}