'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, Users,
  BookOpen, BarChart2, LogOut, Wrench, Settings, UserCircle, CreditCard, Lock,
  Menu, X, FileSearch, Wallet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { useSubscription } from '@/components/SubscriptionContext'

type NavItem = { href: string; label: string; icon: React.ElementType; adminOnly?: boolean }

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/diagnostico',  label: 'Diagnóstico',  icon: FileSearch },
  { href: '/ordenes',      label: 'Ordenes',      icon: ClipboardList },
  { href: '/clientes',     label: 'Clientes',    icon: Users },
  { href: '/catalogo',     label: 'Catalogo',    icon: BookOpen,   adminOnly: true },
  { href: '/reportes',     label: 'Reportes',    icon: BarChart2,  adminOnly: true },
  { href: '/finanzas',     label: 'Finanzas',    icon: Wallet,     adminOnly: true },
  { href: '/billing',      label: 'Facturacion', icon: CreditCard, adminOnly: true },
  { href: '/settings',     label: 'Ajustes',     icon: Settings,   adminOnly: true },
]

export default function Sidebar({ rol }: { rol: string }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const isAdmin   = rol === 'admin'
  const { isBlocked } = useSubscription()
  const [isOpen, setIsOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: '1px solid #f4f4f5' }}>
        <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: '#2563EB' }}>
            <Wrench className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">AutoCoreFix</span>
        </Link>
        {/* Boton cerrar — solo visible en móvil */}
        <button
          className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          onClick={() => setIsOpen(false)}
          aria-label="Cerrar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const isActive  = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          const isBilling = href === '/billing'
          const locked    = isBlocked && !isBilling

          if (locked) {
            return (
              <div
                key={href}
                title="Activa tu suscripcion para acceder"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium select-none"
                style={{ color: '#d4d4d8', cursor: 'not-allowed' }}
              >
                <Lock className="w-4 h-4 shrink-0" strokeWidth={2} />
                {label}
              </div>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
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

      {/* Bottom */}
      <div className="px-3 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid #e4e4e7' }}>
        {isBlocked ? (
          <div
            title="Activa tu suscripcion para acceder"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold select-none"
            style={{ background: '#f4f4f5', color: '#d4d4d8', border: '1px solid #e4e4e7', cursor: 'not-allowed' }}
          >
            <Lock className="w-4 h-4 shrink-0" strokeWidth={2} />
            Mi perfil
          </div>
        ) : (
          <Link
            href="/perfil"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={
              pathname === '/perfil'
                ? { background: '#2563EB', color: '#fff', border: '1px solid #2563EB' }
                : { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
            }
          >
            <UserCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
            Mi perfil
          </Link>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold w-full text-left transition-all"
          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2' }}
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={2} />
          Cerrar sesion
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Top bar — solo móvil (< lg) */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 h-14 bg-white"
        style={{ borderBottom: '1px solid #e4e4e7', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <button
          className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md" style={{ background: '#2563EB' }}>
            <Wrench className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">AutoCoreFix</span>
        </div>
      </header>

      {/* Overlay — solo móvil cuando el drawer está abierto */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-white',
          'transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        style={{ borderRight: '1px solid #e4e4e7', boxShadow: '2px 0 8px rgba(0,0,0,0.06)' }}
      >
        {navContent}
      </aside>
    </>
  )
}
