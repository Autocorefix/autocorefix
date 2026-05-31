'use client'

import Link from 'next/link'
import { Wrench, ArrowRight } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Funciones',       id: 'funciones' },
  { label: 'Cómo funciona',   id: 'como-funciona' },
  { label: 'Precios',         id: 'precios' },
  { label: 'FAQ',             id: 'faq' },
]

export default function LandingNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-[#0F172A] tracking-tight">AutoCoreFix</span>
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
          {NAV_LINKS.map(link => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-[#1D4ED8] transition-colors"
            >
              Ir al dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-[#0F172A] transition-colors">
                Iniciar sesión
              </Link>
              <Link href="/register" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-[#1D4ED8] transition-colors">
                Empezar gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
