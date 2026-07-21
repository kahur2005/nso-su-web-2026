import {
  LayoutDashboard, QrCode, Users, Star, Megaphone, Building2, IdCard,
  type LucideIcon,
} from 'lucide-react'

export interface AdminNavItem {
  href: string
  label: string
  icon: LucideIcon
}

// Order matters here: AdminShell highlights the active item via
// `pathname.startsWith(href)`, so a more specific href must not come after a
// shorter one it would collide with. `/admin/dashboard` doesn't prefix-match
// (or get prefix-matched by) any other entry, so its position is otherwise
// free — kept first as the panel's landing/overview page.
export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/qr', label: 'QR & Fun Facts', icon: QrCode },
  { href: '/admin/groups', label: 'Groups', icon: Users },
  { href: '/admin/points', label: 'Points', icon: Star },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/clubs', label: 'Clubs', icon: Building2 },
  { href: '/admin/committee', label: 'Committee', icon: IdCard },
]
