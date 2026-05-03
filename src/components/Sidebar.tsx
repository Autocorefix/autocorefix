'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardPlus,
  ClipboardList,
  Users,
  BookOpen,
  BarChart2,
  LogOut,
  Wrench,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/nueva-orden', label: 'Nueva Orden', icon: ClipboardPlus },
  { href: '/dashboard/ordenes', label: 'Órdenes', icon: ClipboardList },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/catalogo', label: 'Catálogo', icon: BookOpen },
  { href: '/dashboard/reportes', label: 'Reportes', icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col bg-white border-r border-zinc-100 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#2563EB]">
          <Wrench className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-semibold text-zinc-900 tracking-tight">
          AutoCoreFix
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#2563EB] text-white'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-zinc-100">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={2} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
