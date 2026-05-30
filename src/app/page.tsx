import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import {
  ClipboardList, Users, BarChart2, Shield,
  CheckCircle2, ChevronRight, ArrowRight, Smartphone, TrendingUp, FileText, Wrench,
} from 'lucide-react'
import LandingNav from '@/app/LandingNav'

export const metadata = {
  title: 'Software para Taller Mecánico | AutoCoreFix',
  description: 'Digitaliza tu taller: crea órdenes de servicio, controla clientes y genera reportes en minutos. Prueba gratis 14 días, sin tarjeta.',
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <main className="bg-white text-[#0F172A]">

      {/* ── NAVBAR ── */}
      <LandingNav isLoggedIn={isLoggedIn} />

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200 mb-6">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              14 días gratis · Sin tarjeta de crédito
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold text-[#0F172A] leading-[1.1] tracking-tight mb-6">
              Digitaliza tu taller mecánico.{' '}
              <span className="text-[#2563EB]">Sin complicaciones.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              AutoCoreFix centraliza tus órdenes de servicio, historial de clientes y reportes
              de ingresos en un solo sistema. Desde el celular o la computadora, sin capacitación.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#2563EB] text-white font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors shadow-sm text-sm">
                Comenzar prueba gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm">
                Ya tengo cuenta <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              {['Sin instalación', 'Soporte incluido', 'Cancela cuando quieras'].map(item => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Mockup del producto */}
          <div className="relative">
            <div className="rounded-2xl border border-slate-200 shadow-xl overflow-hidden bg-white">
              {/* Barra del browser */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-300" />
                  <div className="w-3 h-3 rounded-full bg-amber-300" />
                  <div className="w-3 h-3 rounded-full bg-emerald-300" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded border border-slate-200 px-3 py-1 text-[11px] text-slate-400 text-center max-w-[220px] mx-auto">
                    autocorefix.com/dashboard
                  </div>
                </div>
              </div>
              {/* Contenido del dashboard */}
              <div className="p-4 bg-zinc-50">
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {[
                    { label: 'Órdenes hoy', value: '8',     color: 'text-[#2563EB]' },
                    { label: 'En proceso',  value: '3',     color: 'text-amber-600' },
                    { label: 'Completadas', value: '5',     color: 'text-emerald-600' },
                    { label: 'Ingresos',    value: '$6,200',color: 'text-[#2563EB]' },
                  ].map(m => (
                    <div key={m.label} className="bg-white rounded-xl border border-zinc-200 p-3">
                      <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-zinc-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-700">Órdenes de hoy</span>
                    <span className="text-[10px] text-[#2563EB] font-medium">Ver todas →</span>
                  </div>
                  {[
                    { id: 'A-0041', nombre: 'García López',   estado: 'En proceso', ec: 'bg-amber-50 text-amber-700',   total: '$1,200' },
                    { id: 'A-0042', nombre: 'Rodríguez M.',   estado: 'Listo',      ec: 'bg-emerald-50 text-emerald-700', total: '$800' },
                    { id: 'A-0043', nombre: 'Martínez R.',    estado: 'Recibido',   ec: 'bg-blue-50 text-blue-700',     total: '$1,500' },
                  ].map(o => (
                    <div key={o.id} className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-50">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-zinc-400">{o.id}</span>
                        <span className="text-xs font-medium text-zinc-700">{o.nombre}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${o.ec}`}>{o.estado}</span>
                        <span className="text-xs font-semibold text-zinc-800">{o.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Badge flotante */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0F172A]">Más control, menos errores</p>
                <p className="text-[10px] text-slate-400">vs. control en papel</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="bg-slate-50 border-y border-slate-100 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-4">
              ¿Reconoces alguno de estos problemas?
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Son los más comunes en talleres que trabajan con cuadernos o papelitos. Todos tienen solución.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: 'Órdenes perdidas o ilegibles',
                body: 'Papelitos y libretas que desaparecen o nadie entiende. Cobros que quedan sin registrar.',
                color: 'bg-red-50 text-red-500',
              },
              {
                icon: BarChart2,
                title: 'Sin saber cuánto ganaste',
                body: 'El mes termina y no sabes cuánto ingresó, cuánto perdiste en descuentos ni cuáles son tus servicios más rentables.',
                color: 'bg-amber-50 text-amber-500',
              },
              {
                icon: Users,
                title: 'Historial de clientes en la cabeza',
                body: 'Cuando llega un cliente recurrente, pierdes tiempo buscando qué se le hizo, a qué vehículo y a qué precio.',
                color: 'bg-blue-50 text-[#2563EB]',
              },
            ].map(p => (
              <div key={p.title} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${p.color}`}>
                  <p.icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-[#0F172A] mb-2">{p.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funciones" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-4">
              Todo lo que necesitas. Nada de lo que no.
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              AutoCoreFix está diseñado específicamente para talleres mecánicos pequeños y medianos.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: ClipboardList,
                title: 'Órdenes de servicio digitales',
                body: 'Crea, edita y cierra órdenes en segundos. Asigna servicios, aplica descuentos y controla el estado en tiempo real.',
                color: 'bg-blue-50 text-[#2563EB]',
              },
              {
                icon: Users,
                title: 'Historial completo de clientes',
                body: 'Base de datos con todos los vehículos y órdenes anteriores de cada cliente. Búsqueda instantánea por nombre, teléfono o ID.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: BarChart2,
                title: 'Reportes de ingresos reales',
                body: 'KPIs del período, servicios más solicitados, ticket promedio y top clientes. Exporta en CSV o imprime en segundos.',
                color: 'bg-sky-50 text-sky-600',
              },
              {
                icon: Shield,
                title: 'Control de acceso por roles',
                body: 'El dueño como admin y la recepcionista como asistente. Cada quien ve solo lo que necesita.',
                color: 'bg-amber-50 text-amber-600',
              },
            ].map(f => (
              <div key={f.title} className="flex gap-5 p-6 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-[#EFF6FF]/40 transition-colors">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${f.color}`}>
                  <f.icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0F172A] mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section id="como-funciona" className="bg-[#EFF6FF] border-y border-blue-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-4">En funcionamiento en 3 pasos</h2>
            <p className="text-slate-500">Tu taller digitalizado en menos de 10 minutos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { n: '01', icon: Smartphone,   title: 'Regístrate',     body: 'Crea tu cuenta, configura el nombre de tu taller e invita a tu asistente en menos de 2 minutos.' },
              { n: '02', icon: ClipboardList, title: 'Crea órdenes',   body: 'Registra clientes, vehículos y servicios. Tu primera orden la creas en 90 segundos.' },
              { n: '03', icon: TrendingUp,    title: 'Controla y cobra', body: 'Revisa el estado de cada orden, genera reportes y cobra con toda la información en tu pantalla.' },
            ].map((s, i) => (
              <div key={s.n} className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] border-t-2 border-dashed border-blue-200" />
                )}
                <div className="w-16 h-16 bg-white rounded-2xl border border-blue-200 shadow-sm flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-7 h-7 text-[#2563EB]" strokeWidth={1.5} />
                </div>
                <div className="text-[10px] font-bold text-blue-300 tracking-widest uppercase mb-2">{s.n}</div>
                <h3 className="font-semibold text-[#0F172A] mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-4">Planes simples. Sin sorpresas.</h2>
            <p className="text-slate-500">Empieza gratis. Continúa con el plan que mejor se adapte a tu taller.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            {/* Gratis */}
            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Prueba gratuita</div>
              <div className="text-3xl font-bold text-[#0F172A] mb-1">$0</div>
              <div className="text-sm text-slate-400 mb-6">14 días · Sin tarjeta</div>
              <ul className="space-y-2.5 mb-6">
                {['Acceso completo a todas las funciones', 'Órdenes ilimitadas', 'Soporte por email'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                Empezar gratis
              </Link>
            </div>

            {/* Mensual */}
            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Mensual</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-bold text-[#0F172A]">$399</span>
                <span className="text-slate-400 text-sm mb-1">MXN/mes</span>
              </div>
              <div className="text-sm text-slate-400 mb-6">Sin permanencia</div>
              <ul className="space-y-2.5 mb-6">
                {['Todo lo del plan gratuito', 'Uso ilimitado', 'Invita a tu asistente', 'Soporte prioritario'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center py-2.5 border border-[#2563EB] text-[#2563EB] text-sm font-medium rounded-xl hover:bg-blue-50 transition-colors">
                Elegir mensual
              </Link>
            </div>

            {/* Anual — destacado */}
            <div className="rounded-2xl border-2 border-[#2563EB] p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[10px] font-bold px-3 py-1 rounded-full tracking-wide whitespace-nowrap">
                Ahorra $1,289 MXN
              </div>
              <div className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest mb-4">Anual</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-bold text-[#0F172A]">$3,499</span>
                <span className="text-slate-400 text-sm mb-1">MXN/año</span>
              </div>
              <div className="text-sm text-slate-400 mb-6">Equivale a $291/mes</div>
              <ul className="space-y-2.5 mb-6">
                {['Todo lo del plan mensual', 'Precio bloqueado 12 meses', 'Acceso anticipado a novedades'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors">
                Elegir anual
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-slate-50 border-t border-slate-100 py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-4">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: '¿Necesito conocimientos técnicos para usar AutoCoreFix?',
                a: 'No. AutoCoreFix está diseñado para que cualquier persona lo use desde el primer día sin capacitación previa. La interfaz es simple e intuitiva, pensada para que la asistente del taller la domine en minutos.',
              },
              {
                q: '¿Funciona desde el celular?',
                a: 'Sí. AutoCoreFix es completamente responsive. Puedes crear órdenes, revisar estados y ver reportes desde cualquier celular, tablet o computadora sin instalar nada.',
              },
              {
                q: '¿Cuántos usuarios puede tener mi taller?',
                a: 'Cada taller tiene un administrador (el dueño) y puede invitar a las asistentes que necesite. Los roles están separados: el admin tiene acceso total y las asistentes acceden solo a las funciones de operación.',
              },
              {
                q: '¿Mis datos están seguros?',
                a: 'Sí. AutoCoreFix usa cifrado en tránsito y Row Level Security activo, lo que significa que los datos de tu taller están completamente aislados y son inaccesibles para otros usuarios.',
              },
              {
                q: '¿Puedo cancelar cuando quiera?',
                a: 'Sí. Sin contratos ni permanencia. Si cancelas, tu acceso se mantiene hasta el final del período pagado y no hay cargos adicionales.',
              },
            ].map((faq, i) => (
              <details key={i} className="bg-white rounded-xl border border-slate-200 group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-medium text-[#0F172A] text-sm">
                  {faq.q}
                  <ChevronRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90 shrink-0 ml-4" />
                </summary>
                <p className="px-5 pb-4 text-sm text-slate-500 leading-relaxed border-t border-slate-50 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-[#0F172A] py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 mb-6">
            14 días gratis · Sin tarjeta
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            Empieza hoy.<br />Tu taller lo va a agradecer.
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            Deja los papelitos atrás y lleva el control desde cualquier dispositivo.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#2563EB] text-white font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors text-sm">
            Comenzar prueba gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-slate-500 text-xs mt-4">Sin tarjeta · Sin contrato · Sin sorpresas</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0F172A] border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-white">AutoCoreFix</span>
          </div>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} AutoCoreFix. Todos los derechos reservados.</p>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <Link href="/login"    className="hover:text-slate-300 transition-colors">Iniciar sesión</Link>
            <Link href="/register" className="hover:text-slate-300 transition-colors">Registrarse</Link>
          </div>
        </div>
      </footer>

      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'SoftwareApplication',
                name: 'AutoCoreFix',
                description: 'Software de gestión para talleres mecánicos. Órdenes de servicio, historial de clientes y reportes de ingresos en un solo sistema.',
                applicationCategory: 'BusinessApplication',
                operatingSystem: 'Web',
                inLanguage: 'es',
                offers: { '@type': 'Offer', price: '399', priceCurrency: 'MXN' },
                featureList: [
                  'Órdenes de servicio digitales',
                  'Historial de clientes y vehículos',
                  'Reportes de ingresos',
                  'Control de roles admin/asistente',
                  'Exportación CSV',
                ],
              },
              {
                '@type': 'FAQPage',
                mainEntity: [
                  { '@type': 'Question', name: '¿Necesito conocimientos técnicos para usar AutoCoreFix?', acceptedAnswer: { '@type': 'Answer', text: 'No. AutoCoreFix está diseñado para que cualquier persona lo use desde el primer día sin capacitación previa.' } },
                  { '@type': 'Question', name: '¿Funciona desde el celular?', acceptedAnswer: { '@type': 'Answer', text: 'Sí. Es completamente responsive. Puedes crear órdenes y ver reportes desde cualquier celular sin instalar nada.' } },
                  { '@type': 'Question', name: '¿Cuántos usuarios puede tener mi taller?', acceptedAnswer: { '@type': 'Answer', text: 'Un administrador y las asistentes que necesites, con roles separados.' } },
                  { '@type': 'Question', name: '¿Mis datos están seguros?', acceptedAnswer: { '@type': 'Answer', text: 'Sí. Cifrado en tránsito y Row Level Security activo. Los datos de tu taller son inaccesibles para otros usuarios.' } },
                  { '@type': 'Question', name: '¿Puedo cancelar cuando quiera?', acceptedAnswer: { '@type': 'Answer', text: 'Sí. Sin contratos. El acceso se mantiene hasta el final del período pagado.' } },
                ],
              },
            ],
          }),
        }}
      />
    </main>
  )
}
