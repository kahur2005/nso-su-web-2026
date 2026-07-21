// app/admin/guide/page.tsx
// Onboarding for admins: what every tab in this panel is for and the order to
// use them in. Replaces app/admin/quests/onboarding, which only covered quest
// uploads and described a flow that no longer exists.
//
// Static content — kept in one array so adding a tab here is a one-line change
// next to adding it to ADMIN_NAV.
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, QrCode, Swords, Award, Users, Star, Megaphone,
  Building2, IdCard, type LucideIcon,
} from 'lucide-react'

interface GuideSection {
  href: string
  label: string
  icon: LucideIcon
  what: string
  steps: string[]
  note?: string
}

const SECTIONS: GuideSection[] = [
  {
    href: '/admin/dashboard',
    label: 'Overview',
    icon: LayoutDashboard,
    what: 'The landing page: totals for students, scans, active committee members and quests, plus the group ranking and today’s scan count.',
    steps: ['Read-only — nothing here changes data.'],
    note: 'Group totals are added up from each member’s points, so they stay right even when you move a student between groups.',
  },
  {
    href: '/admin/qr',
    label: 'QR & Fun Facts',
    icon: QrCode,
    what: 'Committee members and their personal fun-fact QR codes. Each member carries their own code; a student who scans it collects that person’s fun fact and earns their points.',
    steps: [
      'Add a committee member with their name, role, division, fun fact and points.',
      'Generate their QR, then download and print it.',
      'A student can only collect each member once.',
    ],
    note: 'Regenerating someone’s QR immediately stops the old printout working. Only do it if a code is lost.',
  },
  {
    href: '/admin/quests',
    label: 'Quests',
    icon: Swords,
    what: 'Missions that are not tied to a person — “visit the club fair”, “find the banner”. One printed code is scanned by every student.',
    steps: [
      'Create the quest with a title, description, points, and optionally the achievement it grants.',
      'Generate its QR and print it. Put the code wherever the mission happens.',
      'Flip the quest to Active when students should be able to complete it.',
      'Deactivate to pause it; Delete hides it but keeps everyone’s completion record.',
    ],
    note: 'The description is visible to students before they complete it, so write it as instructions — tell them where to go.',
  },
  {
    href: '/admin/achievements',
    label: 'Achievements',
    icon: Award,
    what: 'Badges shown on a student’s profile. A badge is only ever earned by completing a quest that grants it.',
    steps: [
      'Create the achievement with a name, description and badge image.',
      'Go to Quests and link it from the quest that should award it.',
    ],
    note: 'An achievement no quest points at can never be earned — the list flags those as “unobtainable”.',
  },
  {
    href: '/admin/groups',
    label: 'Groups',
    icon: Users,
    what: 'The fifteen guilds and who belongs to which. Group scores on the leaderboard are the sum of their members’ points.',
    steps: [
      'Assign a student to a group, or move them to another one.',
      'Points follow the student, so moving someone moves their score with them.',
    ],
  },
  {
    href: '/admin/points',
    label: 'Points',
    icon: Star,
    what: 'Manual point adjustments for a single student — corrections, penalties, prizes awarded off-app.',
    steps: [
      'Find the student and enter an amount. Negative values subtract.',
    ],
    note: 'Positive adjustments also grant XP, which can raise a student’s level. Negative ones do not take XP away.',
  },
  {
    href: '/admin/announcements',
    label: 'Announcements',
    icon: Megaphone,
    what: 'Messages shown to students in the app.',
    steps: ['Write the announcement and activate it.', 'Deactivate it when it is no longer relevant.'],
  },
  {
    href: '/admin/clubs',
    label: 'Clubs',
    icon: Building2,
    what: 'The student society directory students browse at /map/clubs.',
    steps: ['Add a club with its name, category, photos, Instagram and sign-up link.'],
  },
  {
    href: '/admin/committee',
    label: 'Committee',
    icon: IdCard,
    what: 'The same people as QR & Fun Facts, shown as a roster grouped by division — this is what students see at /map/committee.',
    steps: [
      'Edit a member’s details, or generate a QR for someone added here.',
      'Removing a member hides them from students but keeps their scan history.',
    ],
  },
]

export default async function AdminGuidePage() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Admin guide</h1>
        <p className="text-sm text-slate-500 mt-1">
          What each tab does and the order to use it in. Everything you change
          here is live for students immediately.
        </p>
      </div>

      <div className="border border-slate-200 rounded-lg bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Setting up from scratch</h2>
        <ol className="mt-3 space-y-1.5 text-sm text-slate-600 list-decimal list-inside">
          <li>Add the committee in <span className="font-medium text-slate-700">QR &amp; Fun Facts</span> and print their codes.</li>
          <li>Create badges in <span className="font-medium text-slate-700">Achievements</span>.</li>
          <li>Create missions in <span className="font-medium text-slate-700">Quests</span>, link any badges, print the codes.</li>
          <li>Put students into guilds in <span className="font-medium text-slate-700">Groups</span>.</li>
          <li>Activate the quests when the event starts.</li>
        </ol>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.href} className="border border-slate-200 rounded-lg bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-md bg-slate-100 p-2 text-slate-600">
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={section.href}
                    className="text-sm font-semibold text-slate-900 hover:underline"
                  >
                    {section.label}
                  </Link>
                  <p className="text-sm text-slate-600 mt-1">{section.what}</p>

                  <ul className="mt-3 space-y-1 text-sm text-slate-600 list-disc list-inside">
                    {section.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>

                  {section.note && (
                    <p className="mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                      {section.note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
