<!-- BEGIN:br-autocar-generated-agent-rules -->
# AGENTS.md - B.R / br-platform

Generado por BR.autocar Documentation Engine. Mantener alineado con APP_STATE.json, PROJECT_STATUS.md, README.md, CHATGPT_CONTEXT.md y CODEX_CONTEXT.md.

## Regla critica de foco

- El foco principal es `B.R`.
- BR.autocarmation es soporte interno, infraestructura y automatizacion secundaria dentro de esta app.
- No convertir avances de BR.autocarmation en objetivo principal de esta app.
- Al retomar contexto, priorizar fase, pendientes, riesgos y proxima accion del producto.
- El flujo comercial base ya quedo cerrado en Fase 12; la siguiente prioridad es Fase 13: preview real de 15 segundos y UX premium del player.

## Proyecto

- App: `br-platform`
- Producto: B.R
- Tipo: Marketplace musical / plataforma privada de beats
- Fase actual: Fase 12 cerrada / comercial base completada
- Estado: implemented / estable
- Avance: 85%
- Ultimo commit funcional: be3d8cb feat:add license type support and phase 12 checkpoint
- Checkpoint principal: `docs/phase-12-commercial-checkpoint.md`
- SQL comercial: `docs/supabase/phase-12-commercial.sql`
- Siguiente fase: Fase 13 - preview real de 15 segundos + UX premium del player

## Meta principal

Consolidar el flujo comercial base antes de expandir a marketplace multiusuario:

```text
Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia
```

La base comercial ya quedo implementada. Fase 13 debe mejorar la separacion entre preview real y audio full, y reforzar la experiencia premium del player sin romper el flujo actual.

## Reglas operativas

- APP_STATE.json es la fuente principal de verdad del estado del producto.
- B.R ya esta registrada en BR.autocarmation Core v3.
- Antes de modificar codigo, listar archivos a crear o modificar cuando el cambio sea amplio.
- No tocar `package.json`, no instalar dependencias y no mover carpetas existentes salvo instruccion expresa.
- Mantener cambios pequenos, directos y verificables.
- Ejecutar validaciones despues de cambios.
- Responder en espanol y usar la menor cantidad razonable de tokens.
- Antes de cerrar una fase, revisar si deben actualizarse APP_STATE.json, PROJECT_STATUS.md, CHATGPT_CONTEXT.md, CODEX_CONTEXT.md, AGENTS.md y README.md.

## Funcionalidad lista

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
Eliminacion de usuario/cuenta
Usuarios nuevos, existentes y admin reciben beats activos nuevos
Scroll horizontal Safari-safe en BeatRow
Descarga protegida de MP3 por sesion y beat_access
Descarga protegida de licencia por sesion y beat_access
Registro server-side de actividad comercial en commercial_activity
Panel admin de actividad comercial
Panel admin de usuarios comerciales
Registro de pagos manuales por usuario + beat
Prevencion de pago manual duplicado por usuario + beat
Tipos de licencia basic, premium y exclusive
Checkpoint de Fase 12 en docs/phase-12-commercial-checkpoint.md
```

## Regla permanente de catalogo

- Todo beat activo debe aparecer en el catalogo para visitantes, usuarios nuevos, usuarios existentes y admin/B.RCEO, segun la visibilidad publica prevista.
- `beat_access` no debe filtrar la visibilidad del catalogo.
- `beat_access` solo controla preview/full, descarga, licencia, badges y acciones protegidas.

Comentario recomendado cerca de queries de catalogo/acceso:

```ts
// Do not use access to filter catalog visibility.
// Access only controls playback/download/protected actions.
```

## Regla permanente del player

- Si el usuario tiene acceso al beat, reproducir full audio.
- Si no tiene acceso, reproducir preview.
- Si no hay sesion, reproducir preview.
- Siguiente/anterior deben resolver acceso por beat, no reutilizar la URL previa.
- No romper esta regla al implementar preview real, descargas, licencias, pagos o rediseño visual.

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
Prevencion de pago duplicado por usuario + beat.
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

Meta: separar un preview real de 15 segundos del audio full, mejorar la experiencia premium del player y preparar la base para pagos iniciales/licencias sin expandir todavia a marketplace multiusuario.

Alcance inicial:

```text
Crear preview real separado de 15 segundos.
Mantener full audio solo para usuarios con acceso.
Mejorar UX premium del player sin romper preview/full actual.
Evaluar bucket privado y signed URLs.
Mantener descarga MP3/licencia protegida por sesion y beat_access.
No usar beat_access para filtrar catalogo.
```

Fuera de alcance inicial:

```text
Stripe o pagos automaticos completos.
Marketplace multiusuario.
Perfiles publicos de productores/artistas.
Escrow o pago protegido.
Licencias legales avanzadas.
```

## Regla de cuenta eliminada

- Si un usuario elimina su cuenta, se eliminan sus datos y accesos.
- Si vuelve a crear una cuenta con el mismo correo, B.R no garantiza recuperar accesos anteriores.
- Esta regla debe incluirse despues en terminos y condiciones.

## Seguridad

- No exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.
- Mantener B.RCEO como unico admin real.
- No permitir acciones protegidas con fallback admin.
- Usar rutas server/API para operaciones privilegiadas.
- No habilitar descarga sin acceso o licencia valida.
- No expandir marketplace multiusuario antes de consolidar preview real, pagos iniciales y licencias.

## Pendientes principales

```text
Fase 13: preview real de 15 segundos + UX premium del player
Evaluar bucket privado y signed URLs
Preparar pagos iniciales sin Stripe hasta definir alcance
Mejorar modelo formal de licencias despues del preview real
Terminos y condiciones
Suscripciones / freemium / watermark
Marketplace multiusuario
Perfiles publicos de productores/artistas
Servicios musicales
Escrow o pago protegido
Chat / rooms de colaboracion
```

## Validaciones minimas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

## Documentacion de continuidad

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

## Continuidad

B.R esta publicada en Vercel, conectada a Supabase real, registrada en BR.autocarmation y con Fase 12 comercial cerrada en commit be3d8cb.

El player respeta acceso full/preview, las descargas MP3/licencia estan protegidas por sesion y beat_access, los pagos manuales por usuario + beat estan registrados, y el siguiente foco es Fase 13.

## Proxima accion

Iniciar Fase 13: preview real separado de 15 segundos, mejora UX premium del player, evaluacion de bucket privado/signed URLs y preparacion controlada de pagos iniciales/licencias sin Stripe completo.
<!-- END:br-autocar-generated-agent-rules -->
