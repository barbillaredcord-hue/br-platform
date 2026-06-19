
<!-- BEGIN:br-autocar-generated-agent-rules -->
# AGENTS.md - B.R / br-platform

Generado por BR.autocar Documentation Engine. Mantener alineado con APP_STATE.json, PROJECT_STATUS.md, README.md, CHATGPT_CONTEXT.md y CODEX_CONTEXT.md.

## Regla critica de foco

- El foco principal es `B.R`.
- BR.autocarmation es soporte interno, infraestructura y automatizacion secundaria dentro de esta app.
- No convertir avances de BR.autocarmation en objetivo principal de esta app.
- Al retomar contexto, priorizar fase, pendientes, riesgos y proxima accion del producto.
- Fase 13 ya quedo cerrada: preview real, player premium, responsive movil, dominio, SMTP y playback publico/privado.
- La siguiente prioridad es Fase 14: ordenes y pagos controlados desde admin.

## Proyecto

- App: `br-platform`
- Producto: B.R
- Tipo: Marketplace musical / plataforma privada de beats
- Fase actual: Fase 13 cerrada / preview real, player premium, auth SMTP y playback publico-privado
- Estado: implemented / estable
- Avance: 92%
- Ultimo commit funcional: pending_phase_13_commit
- Checkpoint principal: `docs/phase-13-preview-player-auth-checkpoint.md`
- SQL comercial: `docs/supabase/phase-12-commercial.sql`
- SQL playback visibility: `docs/supabase/phase-13f-playback-visibility.sql`
- Siguiente fase: Fase 14 - ordenes y pagos controlados

## Meta principal

Consolidar el flujo comercial base antes de expandir a marketplace multiusuario:

```text
Beat -> preview real -> solicitud/orden -> pago/acceso -> descarga/licencia
```

La base comercial, preview real, auth SMTP, player premium y reproduccion publica/privada ya quedaron implementadas. Fase 14 debe crear ordenes/pagos controlados para liberar acceso, descarga y licencia sin automatizar pagos completos todavia.

## Reglas operativas

- APP_STATE.json es la fuente principal de verdad del estado del producto.
- B.R ya esta registrada en BR.autocarmation Core v3.
- Antes de modificar codigo, listar archivos a crear o modificar cuando el cambio sea amplio.
- No tocar `package.json`, no instalar dependencias y no mover carpetas existentes salvo instruccion expresa.
- Mantener cambios pequenos, directos y verificables.
- Ejecutar validaciones despues de cambios.
- Responder en espanol y usar la menor cantidad razonable de tokens.
- Antes de cerrar una fase, revisar si deben actualizarse APP_STATE.json, PROJECT_STATUS.md, CHATGPT_CONTEXT.md, CODEX_CONTEXT.md, AGENTS.md, README.md y CHANGELOG.md.

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
Player premium full/preview por acceso real
Player full para beats publicos
Player full global para admin B.RCEO
Siguiente/anterior del player respeta acceso y playback_visibility por beat
Space play/pause en player
Barra del player clickeable/seekable
Confirmacion de correo con Resend + Supabase SMTP
Dominio propio brstudios.org
Cloudflare DNS conectado
Vercel conectado a dominio propio
Solicitudes de acceso
Contacto por WhatsApp
Aprobar/rechazar solicitudes
Dar/quitar acceso
Panel admin B.RCEO
Admin Access centrado en beat
Admin puede cambiar beat Publico/Privado desde Gestionar Beats
Usuarios admin expandibles
Eliminacion de usuario/cuenta
Usuarios nuevos, existentes, visitantes y admin reciben beats activos nuevos
Scroll horizontal Safari-safe en BeatRow
Responsive movil critico corregido
Actualizaciones compactas con modal
Preview Editor funcional con FFmpeg WASM
Preview real generado desde beat completo
Duraciones de preview 15, 20, 25 y 30 segundos
playback_visibility publico/privado por beat
Descarga protegida de MP3 por sesion y beat_access
Descarga protegida de licencia por sesion y beat_access
Registro server-side de actividad comercial en commercial_activity
Panel admin de actividad comercial
Panel admin de usuarios comerciales
Registro de pagos manuales por usuario + beat
Prevencion de pago manual duplicado por usuario + beat
Tipos de licencia basic, premium y exclusive
Checkpoint de Fase 12 en docs/phase-12-commercial-checkpoint.md
SQL Fase 13F en docs/supabase/phase-13f-playback-visibility.sql
```

## Regla permanente de catalogo

- Todo beat activo debe aparecer en el catalogo para visitantes, usuarios nuevos, usuarios existentes y admin/B.RCEO.
- `beat_access` no debe filtrar la visibilidad del catalogo.
- `beat_access` solo controla descarga, licencia, badges y acciones protegidas.
- `playback_visibility` controla si la reproduccion full es publica o privada.
- `is_active` controla si el beat aparece o no aparece en catalogo.

Comentario recomendado cerca de queries de catalogo/acceso:

```ts
// Do not use access to filter catalog visibility.
// Access only controls playback/download/protected actions.
```

## Regla permanente del player

- Si `playback_visibility = public`, visitantes y usuarios pueden reproducir full audio.
- Si `playback_visibility = private` y el usuario tiene acceso, reproducir full audio.
- Si `playback_visibility = private` y el usuario no tiene acceso, reproducir preview.
- Si no hay sesion y `playback_visibility = private`, reproducir preview.
- Admin/B.RCEO puede reproducir full en cualquier beat sin requerir `beat_access`.
- Preview explicito debe seguir reproduciendo preview.
- Siguiente/anterior deben resolver acceso y visibilidad por beat, no reutilizar la URL previa.
- No romper esta regla al implementar descargas, licencias, pagos o rediseño visual.

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

## Reproduccion publica/privada

```text
is_active = aparece/no aparece en catalogo.
playback_visibility = full publico o preview/full por acceso.
beat_access = descarga, licencia, badges y acciones protegidas.
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

## Fase 12 cerrada - Comercial base

Completado:

```text
Preview/full por acceso base.
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

## Fase 13 cerrada - Preview real, player premium, auth SMTP y playback publico/privado

Completado:

```text
Preview Editor funcional.
FFmpeg WASM para generar preview desde beat completo.
Duraciones de preview 15, 20, 25 y 30 segundos.
preview_url, preview_duration_seconds y preview_updated_at.
PlayerBar premium.
Responsive movil critico.
ProductUpdatesPanel compacto con modal.
Dominio brstudios.org.
Cloudflare DNS.
Vercel conectado al dominio.
Resend verificado.
Supabase SMTP funcionando.
Confirmacion de correo funcionando.
playback_visibility en public.beats.
Admin puede cambiar beat publico/privado desde Gestionar Beats.
Beat publico reproduce full sin acceso.
Beat privado respeta preview/full por acceso.
Admin/B.RCEO reproduce full sin beat_access.
Descarga/licencia siguen protegidas aunque el beat sea publico.
```

SQL asociado:

```text
docs/supabase/phase-13-preview-editor.sql
docs/supabase/phase-13f-playback-visibility.sql
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
- No liberar descarga/licencia solo porque un beat sea publico.
- No hacer depender al admin/B.RCEO de `beat_access` para reproducir full.
- No confundir `is_active` con `playback_visibility`.
- No expandir marketplace multiusuario antes de consolidar ordenes/pagos controlados y licencias.

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
docs/supabase/phase-13-preview-editor.sql
docs/supabase/phase-13f-playback-visibility.sql
```

## Continuidad

B.R esta publicada en Vercel con dominio brstudios.org, conectada a Supabase real, registrada en BR.autocarmation y con Fase 13 cerrada.

El sistema ya tiene preview real generado desde el beat completo, player premium, full/preview por acceso y playback_visibility, admin full global, SMTP real con Resend/Supabase, actualizaciones compactas, descargas/licencias protegidas y pagos manuales base.

El siguiente foco es Fase 14: ordenes y pagos controlados.

## Proxima accion

Preparar Fase 14: crear flujo de orden/pago controlado con solicitud de compra, estado pendiente/aprobado/rechazado, confirmacion admin y liberacion de acceso, descarga y licencia.
<!-- END:br-autocar-generated-agent-rules -->
