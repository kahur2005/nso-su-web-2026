// app/admin/announcements/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminHeader from '@/components/layout/AdminHeader'
import PixelCard from '@/components/ui/PixelCard'
import { createAnnouncement, toggleAnnouncement } from '../actions'

const inputClass = `w-full bg-gray-900 border-2 border-black text-white
  font-pixel text-xs p-3 focus:outline-none focus:border-pink-500`

export default async function AdminAnnouncementsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-gray-900 scanlines">
      <AdminHeader title="📢 ANNOUNCEMENTS" subtitle="BROADCAST TO ALL PLAYERS" />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Create form */}
          <div>
            <PixelCard className="bg-gray-800">
              <h2 className="font-pixel text-sm text-white mb-4">➕ NEW ANNOUNCEMENT</h2>

              <form action={createAnnouncement} className="space-y-3">
                <div>
                  <label className="font-pixel text-xs text-gray-400 block mb-1">
                    TITLE
                  </label>
                  <input name="title" className={inputClass}
                    placeholder="e.g. Lunch break extended!" required />
                </div>

                <div>
                  <label className="font-pixel text-xs text-gray-400 block mb-1">
                    CONTENT
                  </label>
                  <textarea name="content" rows={4} className={inputClass}
                    placeholder="The message players will see on their dashboard" required />
                </div>

                <button type="submit"
                  className="pixel-btn w-full bg-red-500 hover:bg-red-400
                    text-white font-pixel text-sm px-6 py-3 rounded-none">
                  📣 BROADCAST
                </button>
              </form>
            </PixelCard>
          </div>

          {/* Announcement list */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-pixel text-sm text-white">🗞️ HISTORY</h2>
              <span className="font-pixel text-xs text-gray-400">
                {announcements.length} TOTAL
              </span>
            </div>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <PixelCard
                  key={ann.id}
                  className={`bg-gray-800 ${!ann.isActive ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">🔔</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-pixel text-xs text-white">{ann.title}</p>
                      <p className="font-pixel text-[8px] text-gray-400 mt-1 leading-relaxed">
                        {ann.content}
                      </p>
                      <p className="font-pixel text-[8px] text-gray-600 mt-2">
                        📅 {new Date(ann.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <form action={toggleAnnouncement.bind(null, ann.id)}>
                      <button
                        type="submit"
                        className={`font-pixel text-[8px] px-2 py-1 border-2 border-black
                          transition-colors ${ann.isActive
                            ? 'bg-green-700 text-white hover:bg-green-600'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        style={{ boxShadow: '2px 2px 0 #000' }}
                      >
                        {ann.isActive ? '✅ LIVE' : '⛔ HIDDEN'}
                      </button>
                    </form>
                  </div>
                </PixelCard>
              ))}

              {announcements.length === 0 && (
                <PixelCard className="bg-gray-800 text-center py-8">
                  <span className="text-4xl">📢</span>
                  <p className="font-pixel text-xs text-gray-400 mt-4">
                    NO ANNOUNCEMENTS YET
                  </p>
                </PixelCard>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
