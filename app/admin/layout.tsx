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
    <div className={`${poppins.variable} font-[family-name:var(--font-poppins)] antialiased`}>
      <AdminShell>{children}</AdminShell>
    </div>
  )
}
