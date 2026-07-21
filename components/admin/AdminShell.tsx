'use client'
// ERP-style admin frame: a collapsible left rail plus the content column.
// Collapsed state persists in localStorage so it survives navigation.
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react'
import { ADMIN_NAV } from './ADMIN_NAV'

const STORAGE_KEY = 'admin-sidebar-collapsed'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Read persisted state after mount so server and client markup agree.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === '1')
    } catch (e) {
      console.warn('localStorage is not accessible:', e)
    }
  }, [])

  function toggle() {
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch (e) {
        console.warn('Failed to write to localStorage:', e)
      }
      return next
    })
  }

  const current = ADMIN_NAV.find((i) => pathname.startsWith(i.href))

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <aside
        className={`${collapsed ? 'w-16' : 'w-60'} shrink-0 border-r border-slate-200
          bg-white transition-[width] duration-200 flex flex-col`}
      >
        <div className="h-14 flex items-center gap-2 px-4 border-b border-slate-200">
          {!collapsed && (
            <span className="font-semibold text-sm tracking-tight">NSO 2026</span>
          )}
          <button
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="ml-auto p-1.5 rounded hover:bg-slate-100 text-slate-500"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-2">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                aria-label={label}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm
                  ${active
                    ? 'bg-slate-100 text-slate-900 font-medium border-r-2 border-slate-900'
                    : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/dashboard"
          title={collapsed ? 'Back to app' : undefined}
          aria-label="Back to app"
          className="flex items-center gap-3 px-4 py-3 text-sm text-slate-500
            border-t border-slate-200 hover:bg-slate-50"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Back to app</span>}
        </Link>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 flex items-center px-6 border-b border-slate-200 bg-white">
          <h1 className="text-base font-semibold">{current?.label ?? 'Admin'}</h1>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
