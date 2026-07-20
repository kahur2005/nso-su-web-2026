// Scopes the light ERP design system to /admin/*. This is the repo's first
// nested layout -- the student app deliberately has none, but the admin panel
// swaps the entire design system, so a layout is the right tool here.
import { Poppins } from 'next/font/google'
import AdminShell from '@/components/admin/AdminShell'

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${poppins.variable} font-[var(--font-poppins)] antialiased`}>
      <AdminShell>{children}</AdminShell>
    </div>
  )
}
