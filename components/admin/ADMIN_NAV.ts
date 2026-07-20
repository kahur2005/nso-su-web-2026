import {
  QrCode, Users, Star, Megaphone, Building2, IdCard,
  type LucideIcon,
} from 'lucide-react'

export interface AdminNavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin/qr', label: 'QR & Fun Facts', icon: QrCode },
  { href: '/admin/groups', label: 'Groups', icon: Users },
  { href: '/admin/points', label: 'Points', icon: Star },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/clubs', label: 'Clubs', icon: Building2 },
  { href: '/admin/committee', label: 'Committee', icon: IdCard },
]
