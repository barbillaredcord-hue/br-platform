# CODEX_CONTEXT.md - B.R / br-platform

Generado por BR.autocar Documentation Engine. Mantener alineado con APP_STATE.json, PROJECT_STATUS.md, README.md, AGENTS.md y CHATGPT_CONTEXT.md.

## Foco técnico principal

El trabajo técnico debe proteger el producto `B.R`.

B.R es el producto principal. BR.autocarmation es infraestructura de soporte, continuidad y administración secundaria; sus cambios no deben desplazar la funcionalidad, roadmap ni continuidad principal de la app.

## Proyecto

- App ID: `br-platform`
- Producto: B.R
- Tipo: marketplace musical / plataforma privada de beats
- Fase actual: Fase 12 cerrada / comercial base completada
- Estado: implemented / estable
- Avance: 85%
- Último commit funcional: be3d8cb feat:add license type support and phase 12 checkpoint
- Checkpoint principal: docs/phase-12-commercial-checkpoint.md
- SQL comercial: docs/supabase/phase-12-commercial.sql
- Siguiente fase: Fase 13 - preview real de 15 segundos + UX premium del player

## Meta principal

Consolidar el flujo comercial base antes de expandir a marketplace multiusuario:

```text
Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia
```

La base comercial de Fase 12 ya quedó cerrada. La siguiente prioridad es Fase 13: preview real de 15 segundos y UX premium del player.

## Arquitectura

- Stack: Next.js, TypeScript, Tailwind, Supabase, Vercel
- Nivel de datos: Supabase Postgres
- Backend: true
- Database: true
- Auth: true
- Storage: true
- Payments: false
- Pagos manuales: true
- Licencias: basic, premium, exclusive

## Funcionalidad ya implementada

```text
Supabase Auth
Supabase Storage
Bucket beats
Upload MP3 real
Home con beats reales
Explore / Ver todo
Guardados locales
/account/saved conectado a guardados reales
Mis Beats
Player global
Player full/preview por acceso real
Siguiente/anterior del player respeta acceso por beat
Space play/pause en player
Barra del player clickeable/seekable
Solicitudes de acceso
Contacto por WhatsApp
Aprobar/rechazar solicitudes
Dar/quitar acceso
Panel admin B.RCEO
Admin Access centrado en beat
Usuarios admin expandibles
Eliminación de usuario/cuenta
Usuarios nuevos, existentes y admin reciben beats activos nuevos
Scroll horizontal Safari-safe en BeatRow
Descarga protegida de MP3 por sesión y beat_access
Descarga protegida de licencia por sesión y beat_access
Registro server-side de actividad comercial en commercial_activity
Panel admin de actividad comercial
Panel admin de usuarios comerciales
Registro de pagos manuales por usuario + beat
Prevención de pago manual duplicado por usuario + beat
Tipos de licencia basic, premium y exclusive
Checkpoint de Fase 12 en docs/phase-12-commercial-checkpoint.md
```

## Reglas técnicas críticas

- APP_STATE.json es la fuente principal de verdad del estado del producto.
- No instalar dependencias ni modificar package.json salvo instrucción explícita.
- Antes de editar código, listar archivos a crear o modificar si el cambio es amplio.
- Mantener cambios pequeños y verificables.
- Ejecutar validaciones después de cambios.
- No mezclar lógica principal de B.R con infraestructura de BR.autocarmation.
- No tocar pagos automáticos, Stripe, escrow, marketplace multiusuario ni perfiles públicos hasta que Fase 13 esté definida.

## Regla permanente de catálogo

Nunca filtrar la visibilidad del catálogo por `beat_access`.

```text
Todo beat activo debe aparecer en el catálogo para visitantes, usuarios nuevos, usuarios existentes y admin/B.RCEO, según la visibilidad pública prevista.
```

`beat_access` solo controla:

```text
preview/full
descarga
licencia
badges
acciones protegidas
```

Comentario recomendado cerca de queries de catálogo/acceso:

```ts
// Do not use access to filter catalog visibility.
// Access only controls playback/download/protected actions.
```

## Regla permanente del player

```text
Si el usuario tiene acceso al beat -> reproducir full audio.
Si no tiene acceso -> reproducir preview.
Si no hay sesión -> reproducir preview.
Siguiente/anterior deben resolver acceso por beat, no reutilizar la URL anterior.
No romper esta regla al implementar preview real, descargas, licencias, pagos o rediseño visual.
```

Debe funcionar desde:

```text
home cards
explore
beat detail
guardados
Mis Beats
global player queue
next button
previous button
```

## Fase 12 cerrada - Comercial base

Completado:

```text
Preview/full por acceso.
Saved beats.
Descarga protegida MP3.
Descarga protegida licencia.
Registro server-side de actividad comercial en commercial_activity.
Panel admin de actividad comercial.
Panel admin de usuarios comerciales.
Pagos manuales por usuario + beat.
Prevención de pago duplicado por usuario + beat.
Tipos de licencia basic, premium y exclusive.
Checkpoint de cierre de Fase 12.
```

Rutas activas:

```text
GET /api/beats/[id]/download
GET /api/beats/[id]/license
GET /api/admin/commercial-activity
GET /api/admin/commercial-users
GET /api/admin/manual-payment-options
POST /api/admin/manual-payment
```

SQL asociado:

```text
docs/supabase/phase-12-commercial.sql
```

Este SQL debe estar ejecutado o re-ejecutado en Supabase. Incluye commercial_activity, manual_payments, unique index de pago manual y columna manual_payments.license_type.

## Fase 13 propuesta - Preview real y UX premium

Meta:
Separar un preview real de 15 segundos del audio full, mejorar la experiencia premium del player y preparar la base para pagos iniciales/licencias sin expandir todavía a marketplace multiusuario.

Alcance inicial:

```text
Crear preview real separado de 15 segundos.
Mantener full audio solo para usuarios con acceso.
Mejorar UX premium del player sin romper preview/full actual.
Evaluar bucket privado y signed URLs.
Mantener descarga MP3/licencia protegida por sesión y beat_access.
No usar beat_access para filtrar catálogo.
```

Fuera de alcance inicial:

```text
Stripe o pagos automáticos completos.
Marketplace multiusuario.
Perfiles públicos de productores/artistas.
Licencias legales avanzadas.
Escrow o pago protegido.
```

## Cuenta eliminada

Decisión de producto:

```text
Si el usuario elimina su cuenta, se eliminan sus datos y accesos.
Si vuelve a crear una cuenta con el mismo correo, B.R no garantiza recuperar accesos anteriores.
Esta regla debe incluirse después en términos y condiciones.
```

## Seguridad

```text
No exponer SUPABASE_SERVICE_ROLE_KEY al cliente.
Mantener B.RCEO como único admin real.
No permitir acciones protegidas con fallback admin.
Usar rutas server/API para operaciones privilegiadas.
No habilitar descarga sin acceso o licencia válida.
No expandir marketplace multiusuario antes de consolidar preview real, pagos iniciales y licencias.
```

## Pendientes principales

```text
Fase 13: preview real de 15 segundos + UX premium del player
Evaluar bucket privado y signed URLs
Preparar pagos iniciales sin Stripe hasta definir alcance
Mejorar modelo formal de licencias después del preview real
Términos y condiciones
Suscripciones / freemium / watermark
Marketplace multiusuario
Perfiles públicos de productores/artistas
Servicios musicales
Escrow o pago protegido
Chat / rooms de colaboración
```

## Riesgos técnicos / producto

```text
No volver a filtrar catálogo por beat_access.
No romper player full/preview por acceso.
No habilitar descarga sin acceso/licencia válida.
No exponer service role key al cliente.
No avanzar a marketplace antes de consolidar preview real, pagos iniciales y licencias.
```

## Documentación de continuidad

Archivos principales:

```text
APP_STATE.json
PROJECT_STATUS.md
README.md
CHANGELOG.md
AGENTS.md
CHATGPT_CONTEXT.md
CODEX_CONTEXT.md
docs/phase-12-commercial-checkpoint.md
docs/phase-12m1-continuity-sync.md
```

## Validaciones recomendadas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

Última actualización: Fase 12 cerrada / comercial base completada