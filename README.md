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
CHANGELOG.md
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
# B.R / br-platform

B.R es una plataforma musical privada/premium para administrar beats, previews reales, solicitudes, accesos, reproduccion publica/privada, descargas controladas y licencias.

## Meta principal

Consolidar el flujo comercial base antes de expandir a marketplace multiusuario:

```text
Beat -> preview real -> solicitud/orden -> pago/acceso -> descarga/licencia
```

## Estado actual

```text
Fase actual: Fase 13 cerrada / preview real, player premium, auth SMTP y playback publico-privado
Estado: implemented / estable
Progreso aproximado: 92%
Ultimo commit funcional: pending_phase_13_commit
Siguiente fase: Fase 14 - ordenes y pagos controlados
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
Cloudflare DNS
Resend SMTP
```

## Funcionalidad lista

```text
Home con beats reales
Explore / Ver todo
Guardados locales
/account/saved conectado a guardados reales
Mis Beats
Player global
Player premium full/preview por acceso real
Player full para beats publicos
Player full global para admin B.RCEO
Siguiente/anterior del player respeta acceso y playback_visibility por beat
Space play/pause en player
Barra del player clickeable/seekable
Registro/login con Supabase Auth
Confirmacion de correo con Resend + Supabase SMTP
Dominio propio brstudios.org
Cloudflare DNS conectado
Vercel conectado a dominio propio
Perfiles con telefono
Panel admin B.RCEO
Subida de MP3 reales a Supabase Storage
Preview Editor funcional con FFmpeg WASM
Preview real generado desde beat completo
Duraciones de preview 15, 20, 25 y 30 segundos
playback_visibility publico/privado por beat
Cambiar beat Publico/Privado desde Gestionar Beats
Solicitudes de acceso
Contacto por WhatsApp
Aprobar/rechazar solicitudes
Dar/quitar acceso
Admin Access centrado en beat
Usuarios admin expandibles
Eliminar usuario/cuenta
Catalogo activo visible para visitantes, usuarios nuevos, usuarios existentes y admin
Scroll horizontal Safari-safe en BeatRow
Responsive movil critico corregido
Actualizaciones compactas con modal
Descarga protegida de MP3 por sesion y beat_access
Descarga protegida de licencia por sesion y beat_access
Registro server-side de actividad comercial en commercial_activity
Panel admin de actividad comercial
Panel admin de usuarios comerciales
Registro de pagos manuales por usuario + beat
Prevencion de pago manual duplicado por usuario + beat
Tipos de licencia basic, premium y exclusive
Checkpoint de Fase 12 en docs/phase-12-commercial-checkpoint.md
SQL Fase 13F playback_visibility en docs/supabase/phase-13f-playback-visibility.sql
```

## Regla permanente de catalogo

```text
Todo beat activo debe aparecer en el catalogo para visitantes, usuarios nuevos, usuarios existentes y admin/B.RCEO.

beat_access NO filtra la visibilidad del catalogo.

beat_access solo controla:
- descarga
- licencia
- badges
- acciones protegidas

playback_visibility controla si la reproduccion full es publica o privada.
```

## Regla permanente del player

```text
Si playback_visibility = public -> visitantes y usuarios pueden reproducir full audio.
Si playback_visibility = private y el usuario tiene acceso -> reproducir full audio.
Si playback_visibility = private y el usuario no tiene acceso -> reproducir preview.
Si no hay sesion y playback_visibility = private -> reproducir preview.
Admin/B.RCEO puede reproducir full en cualquier beat sin requerir beat_access.
Preview explicito debe seguir reproduciendo preview.
Siguiente/anterior deben resolver acceso y visibilidad por beat, no reutilizar la URL anterior.
No romper esta regla al implementar descargas, licencias, pagos o rediseño visual.
```

## Reproduccion publica/privada

```text
is_active = controla si el beat aparece o no aparece en catalogo.
playback_visibility = controla si el beat reproduce full publicamente o solo por acceso.
beat_access = controla acceso protegido para descarga, licencia, badges y acciones protegidas.
```

Modos:

```text
Beat privado:
- Visitante/usuario sin acceso: Preview
- Usuario con acceso: Full
- Admin/B.RCEO: Full

Beat publico:
- Visitante/usuario sin acceso: Full
- Usuario con acceso: Full
- Admin/B.RCEO: Full
- Descarga/licencia: siguen protegidas por acceso aprobado
```

## Decisiones de producto

```text
Si un usuario elimina su cuenta, se eliminaran sus datos/accesos.
Si vuelve a crear una cuenta con el mismo correo, B.R no garantiza recuperar accesos anteriores.
Esto debe aclararse despues en terminos y condiciones.

Un beat publico libera reproduccion full, pero no libera descarga ni licencia.
Admin/B.RCEO no debe solicitar acceso como usuario normal.
```

## Pendientes principales

```text
Fase 14: ordenes y pagos controlados
Evaluar bucket privado y signed URLs
Mejorar modelo formal de licencias despues del preview real
Terminos y condiciones
Suscripciones / freemium / watermark
Marketplace multiusuario
Perfiles publicos de productores/artistas
Servicios musicales
Escrow o pago protegido
Chat / rooms de colaboracion
```

## Fase 14 propuesta - Ordenes y pagos controlados

Meta: crear un flujo controlado de orden/pago desde admin para liberar acceso, descarga y licencia sin automatizar marketplace ni pagos completos todavia.

Alcance inicial:

```text
Crear solicitud/intencion de compra.
Crear estado de orden: pending / approved / rejected / cancelled.
Permitir que admin confirme pago manualmente.
Al aprobar pago, liberar beat_access y license_type.
Mostrar al usuario el estado de su compra.
Mantener descarga MP3/licencia protegida por sesion y beat_access.
No usar beat_access para filtrar catalogo.
No romper playback_visibility publico/privado.
```

Fuera de alcance inicial:

```text
Stripe o pagos automaticos completos.
Marketplace multiusuario.
Perfiles publicos de productores/artistas.
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

La app usa Supabase real para estas areas:

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

SQL adicional de Fase 13F:

```text
docs/supabase/phase-13f-playback-visibility.sql
```

La guia de setup vive en:

```text
docs/SETUP_SUPABASE.md
```

## Dominio y correo

```text
Dominio: brstudios.org
DNS: Cloudflare
Hosting: Vercel
SMTP Auth: Resend + Supabase SMTP
Sender recomendado: no-reply@auth.brstudios.org
```

## BR.autocarmation

B.R ya esta registrada en BR.autocarmation Core v3 como app administrada.

BR.autocarmation es infraestructura de continuidad; no debe reemplazar el foco principal del producto B.R.

## Documentacion de continuidad

Archivos principales:

```text
APP_STATE.json
PROJECT_STATUS.md
CHATGPT_CONTEXT.md
CODEX_CONTEXT.md
AGENTS.md
README.md
CHANGELOG.md
docs/phase-12-commercial-checkpoint.md
docs/phase-12m1-continuity-sync.md
docs/supabase/phase-13-preview-editor.sql
docs/supabase/phase-13f-playback-visibility.sql
```

Antes de cerrar una fase, revisar si estos archivos deben actualizarse para evitar estados viejos o duplicados.

## Validaciones minimas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

Ultima actualizacion: Fase 13 cerrada / preview real, player premium, auth SMTP y playback publico-privado