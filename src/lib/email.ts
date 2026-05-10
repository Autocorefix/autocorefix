import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function notifyAdminInvitationAccepted({
  adminEmail,
  assistantName,
  assistantEmail,
  tallerName,
}: {
  adminEmail: string
  assistantName: string
  assistantEmail: string
  tallerName: string
}) {
  try {
    await resend.emails.send({
      from: 'AutoCoreFix <onboarding@resend.dev>',
      to: adminEmail,
      subject: `${assistantName || assistantEmail} ya tiene acceso a tu taller`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">

                <!-- Header -->
                <tr>
                  <td style="background:#2563EB;padding:32px 40px;">
                    <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">AutoCoreFix</p>
                    <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Sistema de gestión para talleres</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px 32px;">
                    <p style="margin:0 0 8px;color:#18181b;font-size:22px;font-weight:700;">
                      ✅ Invitación aceptada
                    </p>
                    <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.6;">
                      Tu asistente ya tiene acceso al taller.
                    </p>

                    <!-- Info card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 12px;color:#0369a1;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Asistente</p>
                          <p style="margin:0 0 4px;color:#18181b;font-size:16px;font-weight:600;">${assistantName || 'Sin nombre aún'}</p>
                          <p style="margin:0;color:#71717a;font-size:14px;">${assistantEmail}</p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 24px;color:#52525b;font-size:14px;line-height:1.6;">
                      A partir de ahora puede iniciar sesión en <strong>AutoCoreFix</strong> y gestionar órdenes del taller <strong>${tallerName}</strong>.
                    </p>

                    <p style="margin:0;color:#a1a1aa;font-size:12px;">
                      Si no reconoces a esta persona, puedes revocar su acceso desde
                      <a href="https://autocorefix.vercel.app/dashboard/settings" style="color:#2563EB;text-decoration:none;">Configuración → Acceso</a>.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="border-top:1px solid #f4f4f5;padding:20px 40px;background:#fafafa;">
                    <p style="margin:0;color:#a1a1aa;font-size:12px;">
                      AutoCoreFix · Sistema de gestión para talleres mecánicos
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    })
  } catch (err) {
    // No interrumpir el flujo principal si el email falla
    console.error('Error enviando email de notificación:', err)
  }
}
