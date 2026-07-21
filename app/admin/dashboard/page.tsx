// app/admin/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import GroupEmblem from '@/components/ui/GroupEmblem'
import {
  Users, ScanLine as ScanIcon, Sunrise, IdCard, Swords, Star, Megaphone,
  Building2, QrCode as QrIcon,
} from 'lucide-react'

async function getAdminStats() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    students, scans, npcs, quests, groups, announcements, today,
  ] = await Promise.all([
    supabase.from('Student').select('*', { count: 'exact', head: true }),
    supabase.from('ScanLog').select('*', { count: 'exact', head: true }),
    supabase.from('NPC').select('*', { count: 'exact', head: true }).eq('isActive', true),
    supabase.from('Quest').select('*', { count: 'exact', head: true }).eq('isActive', true),
    // Roster points, not the stored `totalPoints` counter, which misses points
    // a student already had when assigned — see app/api/leaderboard/route.ts.
    supabase.from('Group').select('*, members:Student(points)'),
    supabase.from('Announcement').select('*').eq('isActive', true).limit(3),
    supabase
      .from('ScanLog')
      .select('*', { count: 'exact', head: true })
      .gte('scannedAt', todayStart.toISOString()),
  ])

  return {
    totalStudents: students.count ?? 0,
    totalScans: scans.count ?? 0,
    totalNPCs: npcs.count ?? 0,
    activeQuests: quests.count ?? 0,
    groups: (groups.data ?? [])
      .map((g: any) => ({
        ...g,
        totalPoints: (g.members ?? []).reduce(
          (sum: number, m: any) => sum + (m.points ?? 0),
          0
        ),
      }))
      .sort((a: any, b: any) => b.totalPoints - a.totalPoints),
    announcements: announcements.data ?? [],
    todayScans: today.count ?? 0,
  }
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    redirect('/dashboard')
  }

  const stats = await getAdminStats()

  const adminMenus = [
    { href: '/admin/qr', icon: QrIcon, label: 'QR & Fun Facts', desc: 'Generate & print QR codes', color: '#4CAF50' },
    { href: '/admin/committee', icon: IdCard, label: 'Committee', desc: 'Manage the roster by division', color: '#9C27B0' },
    { href: '/admin/quests', icon: Swords, label: 'Quests', desc: 'Create & activate quests', color: '#B8860B' },
    { href: '/admin/groups', icon: Users, label: 'Groups', desc: 'Manage student groups', color: '#2196F3' },
    { href: '/admin/points', icon: Star, label: 'Points', desc: 'Manual point adjustment', color: '#FF9800' },
    { href: '/admin/announcements', icon: Megaphone, label: 'Announcements', desc: 'Push notifications', color: '#E91E63' },
    { href: '/admin/clubs', icon: Building2, label: 'Clubs', desc: 'Manage club listings', color: '#0EA5E9' },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Students', value: stats.totalStudents },
          { icon: ScanIcon, label: 'Total scans', value: stats.totalScans },
          { icon: Sunrise, label: "Today's scans", value: stats.todayScans },
          { icon: IdCard, label: 'Active committee', value: stats.totalNPCs },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-slate-200 rounded-lg p-4 text-center"
          >
            <stat.icon size={22} className="mx-auto mb-2 text-slate-400" />
            <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links to the other sections */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Admin sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {adminMenus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="border border-slate-200 rounded-lg bg-white hover:bg-slate-50
                transition-colors p-4 flex items-center gap-3"
            >
              <menu.icon size={20} style={{ color: menu.color }} className="flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-800">{menu.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{menu.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Current rankings</h2>
          <div className="space-y-2">
            {stats.groups.map((group, i) => (
              <div
                key={group.id}
                className="border border-slate-200 rounded-lg bg-white px-4 py-2.5 flex items-center gap-3"
              >
                <span className="text-sm text-slate-400 w-6">#{i + 1}</span>
                <GroupEmblem emblem={group.emblem} emblemUrl={group.emblemUrl} size={24} />
                <div className="flex-1">
                  <p className="text-sm text-slate-800">{group.name}</p>
                </div>
                <p className="text-sm font-medium text-slate-600">{group.totalPoints} pts</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Announcements */}
        <div>
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Announcements</h2>
          <div className="space-y-2">
            {stats.announcements.map((ann) => (
              <div key={ann.id} className="border border-slate-200 rounded-lg bg-white px-4 py-2.5">
                <p className="text-sm font-medium text-slate-800">{ann.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {ann.content.substring(0, 60)}...
                </p>
              </div>
            ))}
            <Link
              href="/admin/announcements"
              className="block text-center text-sm font-medium text-slate-700 bg-white
                border border-slate-300 rounded-md px-4 py-2 hover:bg-slate-50 transition-colors"
            >
              + Add announcement
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}