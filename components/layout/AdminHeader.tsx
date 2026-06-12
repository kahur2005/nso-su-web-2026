// components/layout/AdminHeader.tsx
import Link from 'next/link'

interface AdminHeaderProps {
  title: string
  subtitle?: string
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  return (
    <div className="bg-red-900 border-b-4 border-black py-4 px-6
      flex justify-between items-center">
      <div>
        <h1 className="font-pixel text-lg text-white">{title}</h1>
        <p className="font-pixel text-xs text-red-300 mt-1">
          {subtitle || 'NSO 2026 COMMITTEE'}
        </p>
      </div>
      <div className="flex gap-4">
        <Link href="/admin/dashboard"
          className="font-pixel text-xs text-gray-300 hover:text-white">
          ← ADMIN HOME
        </Link>
      </div>
    </div>
  )
}
