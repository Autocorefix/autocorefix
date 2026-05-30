# Lecciones Aprendidas — AutoCoreFix (Next.js 15 + Supabase)

## Supabase — Errores frecuentes

### 1. accept_invitation RPC: UPDATE usuarios es obligatorio
**Error**: Invitación marcada como 'aceptada' pero usuario sin acceso al tenant.
**Causa**: La RPC solo actualizaba `invitaciones.estado` pero NO hacía `UPDATE usuarios`.
**Regla**: Toda RPC de invitación DEBE incluir `UPDATE usuarios SET tenant_id=..., rol=... WHERE id=auth.uid()`.

### 2. DROP FUNCTION antes de cambiar tipo de retorno
**Error**: `cannot change return type of existing function`
**Regla**: Siempre `DROP FUNCTION IF EXISTS nombre();` antes de `CREATE OR REPLACE` si cambia la firma.

### 3. inviteUserByEmail falla para usuarios existentes
**Error**: "A user with this email has already been registered"
**Regla**: Para emails ya registrados en auth.users, NO llamar inviteUserByEmail. Insertar solo en `invitaciones` y procesar en el próximo login del usuario via RPC.

### 4. RLS bloquea lecturas cruzadas de admin
**Error**: Admin no puede ver registros de otros usuarios en la misma tabla.
**Regla**: Operaciones administrativas que cruzan registros de usuarios → API Route con `createClient(SUPABASE_SERVICE_ROLE_KEY)`. NUNCA exponer service role al cliente.

### 5. database.types.ts UTF-16LE en Windows
**Error en Vercel**: "File is not a module"
**Causa**: Windows guarda el archivo en UTF-16LE al editar con ciertos editores.
**Regla**: Siempre verificar encoding. Regenerar con `supabase gen types typescript` desde CLI.

---

## Next.js — Errores frecuentes

### 6. border-l-* en <tr> de tabla no renderiza
**Error**: Borde izquierdo invisible en filas de tabla.
**Causa**: Tablas HTML con `border-collapse` ignoran bordes de fila.
**Regla**: Aplicar `border-l-*` siempre al primer `<td>`, no al `<tr>`.

### 7. @supabase/ssr crashea en Edge Runtime (middleware)
**Error**: Build error en Vercel al usar Supabase SDK en middleware.
**Regla**: En `middleware.ts` detectar sesión leyendo cookies directamente:
`cookies.some(c => c.name.startsWith('sb-') && !c.name.includes('code-verifier'))`

### 8. Auth/callback: cookies en RESPONSE, no en cookieStore
**Error**: Sesión no persiste después del OAuth callback.
**Regla**: Las cookies de Supabase en el callback deben escribirse en `response.cookies.set()`, no en `cookieStore`.

### 9. Write tool trunca archivos >~210 líneas
**Error**: Archivo guardado incompleto, componente roto.
**Regla**: Para archivos largos usar bash heredoc:
`cat > /ruta/archivo << 'ENDOFFILE' ... ENDOFFILE`
Verificar siempre con `tail -3` y `wc -l`.

---

## Patrones de seguridad establecidos

### Operaciones admin seguras
- Leer usuarios de otro tenant: `/api/assistants` con service role
- Revocar acceso: `/api/revoke` con service role, verificando tenant match
- Invitar: `/api/invite` con service role para `inviteUserByEmail`
- NUNCA operaciones con service role desde el cliente

### Deduplicación de invitaciones en frontend
```typescript
const seen = new Set<string>()
const deduped = rawList.filter(inv => {
  if (seen.has(inv.email)) return false
  seen.add(inv.email)
  return true
})
```

### Estados de invitación (flujo completo)
pendiente → aceptada (RPC) → [activo como asistente]
pendiente → cancelada (admin cancela)
aceptada → revocada (admin revoca después)

---

## Diseño — Reglas que no se deben romper

- Chevron siempre con borde azul visible en reposo (no solo aparecer en hover)
- group + group-hover: en Tailwind para estados de hover de elementos hijos
- Avatar con bg-[#2563EB] sólido, NUNCA bg-blue-50 (invisible sobre EFF6FF)
- border-l-4 solo en cards de nivel superior, border-l-2 en filas internas
- Headers de tabla: text-[10px] uppercase tracking-widest (crea jerarquía visual)

