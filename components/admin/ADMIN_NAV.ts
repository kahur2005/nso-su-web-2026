import {
  LayoutDashboard, Smartphone, Users, Star, Megaphone, Building2, IdCard,
  Swords, Award, BookOpen, CalendarDays, UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

export interface AdminNavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/committee', label: 'Committee Info', icon: IdCard },
  { href: '/admin/present', label: 'Live Presenter', icon: Smartphone },
  { href: '/admin/quests', label: 'Quests', icon: Swords },
  { href: '/admin/achievements', label: 'Achievements', icon: Award },
  { href: '/admin/groups', label: 'Groups', icon: Users },
  { href: '/admin/points', label: 'Points', icon: Star },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/timeline', label: 'Timeline', icon: CalendarDays },
  { href: '/admin/lunch', label: 'Lunch', icon: UtensilsCrossed },
  { href: '/admin/clubs', label: 'Clubs', icon: Building2 },
  { href: '/admin/guide', label: 'Guide', icon: BookOpen },
]
