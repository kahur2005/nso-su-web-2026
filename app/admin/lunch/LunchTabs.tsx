'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin/lunch', label: 'Orders' },
  { href: '/admin/lunch/recap', label: 'Recap' },
  { href: '/admin/lunch/menu', label: 'Restaurants & Menu' },
  { href: '/admin/lunch/settings', label: 'Payment & Days' },
]

export default function LunchTabs() {
  const pathname = usePathname()

  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-200">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
