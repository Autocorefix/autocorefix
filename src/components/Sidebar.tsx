'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ClipboardPlus, ClipboardList, Users,
  BookOpen, BarChart2, LogOut, Wrench, Settings, UserCircle, CreditCard,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

type NavItem = { href: string; label: string; icon: React.ElementType; adminOnly?: boolean }

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',             label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/dashboard/nueva-orden', label: 'Nueva Orden', icon: ClipboardPlus },
  { href: '/dashboard/ordenes',     label: 'Órdenes',     icon: ClipboardList },
  { href: '/dashboard/clientes',    label: 'Clientes',    icon: Users },
  { href: '/dashboard/catalogo',    label: 'Catálogo',    icon: BookOpen,   adminOnly: true },
  { href: '/dashboard/reportes',    label: 'Reportes',    icon: BarChart2,  adminOnly: true },
  { href: '/dashboard/billing',     label: 'Facturación', icon: CreditCard, adminOnly: true },
  { href: '/dashboard/settings',    label: 'Ajustes',     icon: Settings,   adminOnly: true },
]

export default function Sidebar({ rol }: { rol: string }) {
  const pathname = usePathname()
  const router   = useRouter()
  const isAdmin  = rol === 'admin'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col bg-white z-20"
      style={{ borderRight: '1px solid #e4e4e7', boxShadow: '2px 0 8px rgba(0,0,0,0.06)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: '1px solid #f4f4f5' }}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: '#2563EB' }}>
          <Wrench className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-semibold text-zinc-900 tracking-tight">AutoCoreFix</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={
                isActive
                  ? { background: '#2563EB', color: '#fff' }
                  : { color: '#52525b' }
              }
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom — botones visibles */}
      <div className="px-3 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid #e4e4e7' }}>
        <Link
          href="/dashboard/perfil"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={
            pathname === '/dashboard/perfil'
              ? { background: '#2563EB', color: '#fff', border: '1px solid #2563EB' }
              : { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
          }
        >
          <UserCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
          Mi perfil
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full text-left transition-all"
          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2' }}
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={2} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
