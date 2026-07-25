// app/admin/daily-qr/page.tsx
// Daily / time-gated QRs are now managed directly under Quests (/admin/quests)
import { redirect } from 'next/navigation'

export default function AdminDailyQrRedirectPage() {
  redirect('/admin/quests')
}
