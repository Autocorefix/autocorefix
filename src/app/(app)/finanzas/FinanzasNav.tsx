'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/finanzas',             label: 'Resumen' },
  { href: '/finanzas/trabajadores', label: 'Trabajadores' },
  { href: '/finanzas/gastos',       label: 'Gastos' },
]

export default function FinanzasNav() {
  const pathname = usePathname()
  return (
    <div className="flex gap-1 border-b border-zinc-200 mb-6">
      {TABS.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            pathname === tab.href
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
