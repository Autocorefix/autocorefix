import Link from 'next/link'
import { Wrench } from 'lucide-react'

export const metadata = {
  title: 'Términos y Condiciones | AutoCoreFix',
  description: 'Términos de servicio, política de reembolsos y condiciones de uso de AutoCoreFix.',
}

export default function TerminosPage() {
  const fecha = '1 de junio de 2026'

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-100 py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-[#0F172A]">AutoCoreFix</span>
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-[#2563EB] transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#0F172A] mb-3">Términos y Condiciones</h1>
          <p className="text-slate-500 text-sm">Última actualización: {fecha}</p>
        </div>

        <div className="prose-custom space-y-10 text-[#0F172A]">

          <Section title="1. Aceptación de los términos">
            <p>
              Al registrarte y usar AutoCoreFix (en adelante "el Servicio"), aceptas estos Términos y Condiciones en su totalidad.
              Si no estás de acuerdo con alguna parte, no debes usar el Servicio. Estos términos aplican a todos los usuarios,
              incluyendo administradores y asistentes de cada taller registrado.
            </p>
          </Section>

          <Section title="2. Descripción del servicio">
            <p>
              AutoCoreFix es un software de gestión en la nube para talleres mecánicos que permite crear órdenes de servicio,
              gestionar clientes y vehículos, y generar reportes de ingresos. El acceso es mediante suscripción mensual o anual.
            </p>
            <p>
              El Servicio se proporciona "tal cual" con las funciones disponibles en el momento de la contratación.
              Nos reservamos el derecho de añadir, modificar o descontinuar funciones con previo aviso de al menos 30 días.
            </p>
          </Section>

          <Section title="3. Planes y precios">
            <p>Los planes de pago vigentes son:</p>
            <ul>
              <li><strong>Plan Mensual:</strong> $499 MXN al mes (IVA incluido). Sin permanencia mínima.</li>
              <li><strong>Plan Anual:</strong> $4,499 MXN al año (IVA incluido). Equivale a $374 MXN/mes.</li>
            </ul>
            <p>
              Los precios incluyen IVA (16%). Se emite factura CFDI para todos los planes pagados bajo solicitud del usuario
              desde el panel de Facturación. Los precios pueden actualizarse con previo aviso de 30 días. Los suscriptores
              activos mantienen su precio hasta el final del período vigente.
            </p>
          </Section>

          <Section title="4. Política de reembolsos">
            <p>
              <strong>Garantía de 30 días.</strong> Si dentro de los primeros 30 días calendario desde la fecha de tu primer
              cobro el Servicio no cumple con lo que necesitas, puedes solicitar un reembolso completo sin preguntas escribiendo
              a <a href="mailto:hola@autocorefix.com" className="text-[#2563EB] hover:underline">hola@autocorefix.com</a>.
            </p>
            <p>
              <strong>Después de los 30 días.</strong> Los pagos realizados más allá del período de garantía no son reembolsables.
              El Servicio permanece activo y accesible hasta el final del período contratado. Esto aplica tanto al plan mensual
              como al plan anual.
            </p>
            <p>
              <strong>Plan anual con cancelación anticipada.</strong> Si cancelas un plan anual después del día 30, el servicio
              permanece activo hasta la fecha de vencimiento anual sin reembolso del período restante. Considera que antes de
              contratar dispones de 14 días de prueba gratuita más 30 días de garantía, lo que suma 44 días para evaluar
              el Servicio sin riesgo.
            </p>
            <p>
              <strong>Plan mensual.</strong> Al cancelar un plan mensual, el acceso se mantiene hasta el final del período pagado.
              No se realizan cargos adicionales ni reembolsos parciales por días no utilizados.
            </p>
          </Section>

          <Section title="5. Prueba gratuita">
            <p>
              Los nuevos registros tienen acceso completo al Servicio durante 14 días sin costo y sin necesidad de ingresar
              una tarjeta de crédito. Al finalizar la prueba, el acceso se suspende hasta que el usuario contrate un plan de pago.
              No se realizan cargos automáticos al terminar la prueba.
            </p>
          </Section>

          <Section title="6. Facturación (CFDI)">
            <p>
              AutoCoreFix emite facturas CFDI conforme a la legislación fiscal mexicana. Para recibir tu factura:
            </p>
            <ol>
              <li>Ingresa al dashboard y completa tus datos fiscales en Facturación → Datos de facturación.</li>
              <li>Verifica que tu RFC y Razón Social coincidan exactamente con tu Constancia de Situación Fiscal del SAT.</li>
              <li>Haz clic en "Solicitar factura" y selecciona el período correspondiente.</li>
              <li>Recibirás tu CFDI en el correo registrado en menos de 24 horas hábiles.</li>
            </ol>
            <p>
              La exactitud de los datos fiscales es responsabilidad del usuario. Un CFDI emitido con datos incorrectos
              requiere cancelación conforme a los lineamientos del SAT (CFDI 4.0), proceso que puede tomar hasta 72 horas
              y podría implicar un costo adicional por reemisión.
            </p>
          </Section>

          <Section title="7. Uso aceptable">
            <p>El Servicio está destinado exclusivamente para gestión interna de talleres mecánicos. Queda prohibido:</p>
            <ul>
              <li>Revender, sublicenciar o distribuir el acceso al Servicio a terceros.</li>
              <li>Usar el Servicio para actividades ilegales o que violen derechos de terceros.</li>
              <li>Intentar acceder a los datos de otros talleres registrados en la plataforma.</li>
              <li>Realizar ingeniería inversa, copiar o modificar el software.</li>
            </ul>
          </Section>

          <Section title="8. Privacidad y datos">
            <p>
              Cada taller registrado tiene sus datos completamente aislados. AutoCoreFix no comparte, vende ni transfiere
              los datos de clientes, vehículos u órdenes de servicio a terceros. Los datos son procesados en servidores
              seguros con cifrado en tránsito y Row Level Security activo.
            </p>
            <p>
              Al eliminar tu cuenta, los datos asociados se eliminan de forma permanente conforme a los estándares de
              nuestro proveedor de base de datos (Supabase).
            </p>
          </Section>

          <Section title="9. Disponibilidad del servicio">
            <p>
              Nos comprometemos a mantener una disponibilidad del 99% mensual. En caso de interrupciones programadas
              por mantenimiento, se notificará con al menos 24 horas de anticipación. AutoCoreFix no se hace responsable
              por pérdidas derivadas de interrupciones fuera de nuestro control (cortes de internet, fallas del proveedor
              de nube, causas de fuerza mayor).
            </p>
          </Section>

          <Section title="10. Modificaciones a los términos">
            <p>
              Podemos actualizar estos Términos en cualquier momento. Los cambios se notificarán por email con al menos
              15 días de anticipación. Si continúas usando el Servicio después de esa fecha, significa que aceptas los
              nuevos términos.
            </p>
          </Section>

          <Section title="11. Contacto">
            <p>
              Para consultas sobre estos términos, reembolsos o facturación, escríbenos a{' '}
              <a href="mailto:hola@autocorefix.com" className="text-[#2563EB] hover:underline">hola@autocorefix.com</a>.
              Tiempo de respuesta: 1-2 días hábiles.
            </p>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} AutoCoreFix. Todos los derechos reservados.</p>
          <Link href="/" className="text-xs text-slate-400 hover:text-[#2563EB] transition-colors">← Volver al inicio</Link>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-[#0F172A] mb-4 pb-2 border-b border-slate-100">{title}</h2>
      <div className="space-y-3 text-slate-600 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:space-y-1 [&_a]:text-[#2563EB] [&_strong]:text-[#0F172A]">
        {children}
      </div>
    </section>
  )
}
