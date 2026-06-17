# B.R / br-platform

B.R es una plataforma musical privada/premium para administrar beats, previews, solicitudes, accesos, descargas controladas y licencias.

## Meta principal

Consolidar el flujo comercial base antes de expandir a marketplace multiusuario:

```text
Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia
```

## Estado actual

```text
Fase actual: Fase 12 cerrada / comercial base completada
Estado: implemented / estable
Progreso aproximado: 85%
Último commit funcional: be3d8cb feat:add license type support and phase 12 checkpoint
Siguiente fase: Fase 13 - preview real de 15 segundos + UX premium del player
```

## Stack

```text
Next.js
TypeScript
Tailwind
Supabase Auth
Supabase Postgres
Supabase Storage
Vercel
```

## Funcionalidad lista

```text
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
Registro/login con Supabase Auth
Perfiles con teléfono
Panel admin B.RCEO
Subida de MP3 reales a Supabase Storage
Solicitudes de acceso
Contacto por WhatsApp
Aprobar/rechazar solicitudes
Dar/quitar acceso
Admin Access centrado en beat
Usuarios admin expandibles
Eliminar usuario/cuenta
Catalogo activo visible para visitantes, usuarios nuevos, usuarios existentes y admin
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

## Regla permanente de catálogo

```text
Todo beat activo debe aparecer en el catálogo para visitantes, usuarios nuevos, usuarios existentes y admin/B.RCEO, según la visibilidad publica prevista.

beat_access NO debe filtrar la visibilidad del catálogo.

beat_access solo controla:
- preview vs full
- descarga
- badges
- acciones protegidas
```

## Regla permanente del player

```text
Si el usuario tiene acceso al beat -> reproducir full audio.
Si no tiene acceso -> reproducir preview.
Si no hay sesión -> reproducir preview.
Siguiente/anterior deben resolver acceso por beat, no reutilizar la URL anterior.
No romper esta regla al implementar descargas, licencias, pagos o rediseño visual.
```

## Decisiones de producto

```text
Si un usuario elimina su cuenta, se eliminaran sus datos/accesos.
Si vuelve a crear una cuenta con el mismo correo, B.R no garantiza recuperar accesos anteriores.
Esto debe aclararse después en términos y condiciones.
```

## Pendientes principales

```text
Fase 13: preview real de 15 segundos + UX premium del player
Evaluar bucket privado y signed URLs
Preparar pagos iniciales sin Stripe hasta definir alcance
Mejorar modelo formal de licencias despues del preview real
Términos y condiciones
Suscripciones / freemium / watermark
Marketplace multiusuario
Perfiles públicos de productores/artistas
Servicios musicales
Escrow o pago protegido
Chat / rooms de colaboracion
```

## Fase 13 propuesta - Preview real y UX premium

Meta: separar un preview real de 15 segundos del audio full, mejorar la experiencia premium del player y preparar la base para pagos iniciales/licencias sin expandir todavía a marketplace multiusuario.

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
Escrow o pago protegido.
Licencias legales avanzadas.
```

## Comandos

```bash
npm run lint
npm run build
npm run dev
```

Validar estado local:

```bash
python3 -m json.tool APP_STATE.json >/dev/null
```

## Supabase

La app usa Supabase real para estas áreas:

```text
Auth
profiles
beats
beat_access
access_requests
commercial_activity
manual_payments
Storage bucket beats
```

El schema vive en:

```text
docs/supabase/schema.sql
```

La guía de setup vive en:

```text
docs/SETUP_SUPABASE.md
```

## BR.autocarmation

B.R ya esta registrada en BR.autocarmation Core v3 como app administrada.

BR.autocarmation es infraestructura de continuidad; no debe reemplazar el foco principal del producto B.R.

## Documentación de continuidad

Archivos principales:

```text
APP_STATE.json
PROJECT_STATUS.md
CHATGPT_CONTEXT.md
CODEX_CONTEXT.md
AGENTS.md
README.md
docs/phase-12-commercial-checkpoint.md
docs/phase-12m1-continuity-sync.md
```

Antes de cerrar una fase, revisar si estos archivos deben actualizarse para evitar estados viejos o duplicados.

## Validaciones mínimas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

Última actualizacion: Fase 12 cerrada / comercial base completada