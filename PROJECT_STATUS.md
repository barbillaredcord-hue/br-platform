# PROJECT_STATUS.md - B.R / br-platform

Generado por BR.autocar Documentation Engine. Mantener alineado con APP_STATE.json, README.md, AGENTS.md, CHATGPT_CONTEXT.md y CODEX_CONTEXT.md.

## Foco principal del producto

- Foco: Consolidar el flujo Beat -> preview real -> solicitud/orden -> pago/acceso -> descarga/licencia.
- Regla: El foco principal, continuidad, avances y meta final de esta app pertenecen a B.R. BR.autocarmation dentro de esta app es infraestructura de soporte y no debe sustituir el objetivo principal del producto.
- Rol de BR.autocarmation dentro de esta app: objetivo secundario e infraestructura de continuidad.
- Fase 13 ya quedo cerrada: preview real, player premium, responsive movil, dominio, SMTP y playback publico/privado.
- Siguiente foco: Fase 14 - ordenes y pagos controlados desde admin.

## Estado actual

- Proyecto: br-platform
- Producto: B.R
- Tipo: marketplace musical / plataforma privada de beats
- Owner: Fabian
- Visibilidad: private
- Fase: Fase 14A validada / flujo comercial controlado inicial
- Estado: implemented / estable
- Avance: 94%
- Nivel: App Next.js publicada en Vercel con dominio brstudios.org, Supabase Auth, Storage, beats reales, preview real generado desde beat completo, duraciones 15/20/25/30, catalogo visible, player premium full/preview por acceso y playback_visibility, admin B.RCEO con full global, guardados, Mis Beats, solicitudes, acceso manual, descargas protegidas, licencias protegidas, pagos manuales, actividad comercial, actualizaciones compactas con modal y Supabase SMTP con Resend.
- Backend: Supabase real
- Deploy: Vercel
- DNS: Cloudflare
- SMTP: Resend + Supabase SMTP
- Dominio: brstudios.org
- BR.autocarmation: B.R ya registrada en Core v3
- Ultimo commit funcional: pending_phase_14a_commit
- Checkpoint principal: docs/phase-13-preview-player-auth-checkpoint.md
- SQL comercial: docs/supabase/phase-12-commercial.sql
- SQL playback visibility: docs/supabase/phase-13f-playback-visibility.sql

## Siguiente fase

- Fase: Fase 14B - ordenes comerciales
- Objetivo: Implementar estados de orden pending / approved / rejected / cancelled y seguimiento comercial visible para usuario y admin.

## Objetivo principal

Consolidar primero el flujo Beat -> preview real -> solicitud/orden -> pago/acceso -> descarga/licencia antes de expandir a marketplace multiusuario.

## Objetivos secundarios

- Player por acceso: 100% (completed) - Reproducir full audio cuando corresponde y preview cuando no hay acceso.
- Descargas protegidas: 100% (completed) - Descargar MP3 solo con sesion y beat_access valido.
- Licencias protegidas: 100% (completed) - Descargar licencia solo con sesion y beat_access valido.
- Actividad comercial: 100% (completed) - Registrar actividad server-side en commercial_activity.
- Pagos manuales: 100% (completed) - Registrar pagos manuales por usuario + beat, con prevencion de duplicados.
- Tipos de licencia: 100% (completed) - Soporte basic, premium y exclusive.
- Preview real: 100% (completed) - Generar y administrar previews reales desde el beat completo con duraciones 15, 20, 25 o 30 segundos.
- Player premium y responsive: 100% (completed) - Mejorar PlayerBar, preview/full visual y experiencia movil compacta.
- Auth SMTP y dominio: 100% (completed) - Configurar brstudios.org, Cloudflare, Vercel, Resend y Supabase SMTP para confirmacion real de correo.
- Playback publico/privado: 100% (completed) - Permitir beats publicos con full playback abierto y beats privados con preview/full por acceso, manteniendo descarga/licencia protegidas.
- Ordenes y pagos controlados: 25% (in_progress) - Pago manual validado, actividad comercial registrada y flujo comercial inicial completado.
- Licencias formales: 0% (planned) - Mejorar modelo legal y descargable de licencias despues del preview real.
- Marketplace musical: 0% (future) - Expandir B.R a marketplace para productores, musicos, beatmakers, DJs y servicios musicales.

## Fases completadas

- Base inicial: Proyecto Next.js creado y estructura inicial preparada.
- Diseno visual inicial: Home y experiencia visual tipo Spotify/Netflix con identidad B.R.
- Beats y player: Catalogo de beats, pagina dinamica y player funcional.
- Admin inicial: Panel admin, gestion de beats y solicitudes iniciales.
- Supabase y Storage: Supabase Auth, Storage, bucket beats, upload MP3 y flujos funcionales conectados.
- Produccion inicial: Deploy en Vercel, acceso manual, B.RCEO admin, eliminacion de usuarios y app lista para consolidacion comercial.
- Consistencia y duplicados: Control de slugs duplicados, mensajes claros, limpieza defensiva de MP3 huerfanos y refresh de accesos.
- UX de solicitudes y dashboard: Dashboard admin vivo, solicitudes mas claras, contacto por WhatsApp, rutas dinamicas y datos reales desde Supabase.
- Accesos, usuarios y navegacion: Access Manager centrado en beat, solicitudes con historial, usuarios expandibles, Explore, Favoritos y Mis Beats funcionales.
- Estabilidad de catalogo, usuarios y accesos: Usuarios existentes reciben beats nuevos, regla permanente de catalogo activo agregada, UserContext valida cuenta eliminada y Supabase schema actualizado.
- Player por acceso: Player full/preview resuelto por acceso real; siguiente/anterior selecciona full si el usuario tiene acceso y preview si no lo tiene.
- Guardados y controles del player: Scroll horizontal Safari-safe, guardados locales, /account/saved funcional, Space play/pause y barra de progreso seekable/clickeable.
- Fase 12 comercial base: Descarga protegida MP3, descarga protegida de licencia, commercial_activity, paneles admin comerciales, pagos manuales, prevencion de duplicados y tipos de licencia basic/premium/exclusive.
- Fase 13 preview/player/auth/playback: Preview real generado desde beat completo, duraciones 15/20/25/30, PlayerBar premium, responsive movil, dominio brstudios.org, Cloudflare, Vercel, Resend + Supabase SMTP, actualizaciones compactas con modal, playback_visibility publico/privado por beat y admin full global sin beat_access.

## Completado

- Proyecto Next.js creado
- Diseno inicial tipo Spotify/Netflix
- Supabase Auth conectado
- Supabase Storage conectado
- Bucket beats funcional
- Upload MP3 funcional
- Home con beats reales
- Explore / Ver todo conectado
- Favoritos funcionales
- Mis Beats funcional
- Player funcional base
- Solicitudes de acceso funcionales
- Contacto por WhatsApp
- Aprobar y rechazar solicitudes
- Dar y quitar acceso funcional
- Panel admin funcional
- Admin Access centrado en beat
- Usuarios visibles para admin
- Usuarios admin expandibles
- Telefono en perfil
- Cambio de username
- Ocultar Supabase conectado a usuarios normales
- Eliminar usuarios implementado
- UserContext valida cuenta eliminada
- Usuarios nuevos, existentes, visitantes y admin reciben beats activos nuevos
- Regla permanente de catalogo activo agregada
- Supabase schema actualizado para Fase 11F-C
- Player full/preview por acceso completado
- Siguiente/anterior del player respeta acceso real
- Scroll horizontal Safari-safe en BeatRow
- Guardados locales implementados con localStorage
- /account/saved conectado a guardados reales
- Space play/pause agregado al player
- Barra de progreso clickeable/seekable agregada al player
- Descarga protegida de MP3 por sesion y beat_access
- Descarga protegida de licencia por sesion y beat_access
- Registro server-side de actividad comercial en commercial_activity
- Panel admin de actividad comercial
- Panel admin de usuarios comerciales
- Registro de pagos manuales por usuario + beat
- Prevencion de pago manual duplicado por usuario + beat
- Tipos de licencia basic, premium y exclusive
- Checkpoint de Fase 12 en docs/phase-12-commercial-checkpoint.md
- Deploy en Vercel funcionando
- GitHub conectado
- APP_STATE.json creado para BR.autocarmation
- B.R registrada en Core v3 registry
- Preview real generado desde beat completo
- Duraciones de preview 15, 20, 25 y 30 segundos
- Preview Editor funcional con FFmpeg WASM
- PlayerBar premium con modo Preview / Acceso completo
- Responsive movil critico corregido
- Dominio brstudios.org conectado a Vercel
- Cloudflare DNS configurado
- Resend verificado
- Supabase SMTP funcionando
- Confirmacion de correo funcionando
- ProductUpdatesPanel compacto con modal
- playback_visibility agregado a beats
- Admin puede cambiar beat publico/privado desde Gestionar Beats
- Beat publico reproduce full sin acceso
- Beat privado respeta preview/full por acceso
- Admin B.RCEO reproduce full sin beat_access
- Pago manual conectado a acceso real del usuario
- Validacion de usuario, beat, acceso y pagos duplicados
- Registro automatico de actividad comercial al registrar pagos
- Metadata comercial con amount, currency, license_type y access_granted
- AccessRequestsTable adaptada para flujo comercial Fase 14A
- Flujo validado: Solicitud -> Acceso -> Pago manual -> Actividad comercial

## Regla permanente de catalogo

- Todo beat activo debe aparecer en el catalogo para visitantes, usuarios nuevos, usuarios existentes y admin/B.RCEO.
- beat_access no debe filtrar la visibilidad del catalogo.
- beat_access solo controla descarga, licencia, badges y acciones protegidas.
- playback_visibility controla si la reproduccion full es publica o privada.
- is_active controla si el beat aparece o no aparece en catalogo.

## Regla permanente del player

- Si playback_visibility = public, visitantes y usuarios pueden reproducir full audio.
- Si playback_visibility = private y el usuario tiene acceso, reproducir full audio.
- Si playback_visibility = private y el usuario no tiene acceso, reproducir preview.
- Si no hay sesion y playback_visibility = private, reproducir preview.
- Admin/B.RCEO puede reproducir full en cualquier beat sin requerir beat_access.
- Preview explicito debe seguir reproduciendo preview.
- Siguiente/anterior deben resolver acceso y visibilidad por beat, no reutilizar la URL anterior.
- No romper esta regla al implementar descargas, licencias, pagos o rediseño visual.

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

- Preview/full por acceso base.
- Saved beats.
- Descarga protegida MP3.
- Descarga protegida licencia.
- Registro server-side de actividad comercial en commercial_activity.
- Panel admin de actividad comercial.
- Panel admin de usuarios comerciales.
- Pagos manuales por usuario + beat.
- Prevencion de pago duplicado por usuario + beat.
- Tipos de licencia basic, premium y exclusive.
- Checkpoint de cierre de Fase 12.

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

- Preview Editor funcional.
- FFmpeg WASM para generar preview desde beat completo.
- Duraciones de preview 15, 20, 25 y 30 segundos.
- preview_url, preview_duration_seconds y preview_updated_at.
- PlayerBar premium.
- Responsive movil critico.
- ProductUpdatesPanel compacto con modal.
- Dominio brstudios.org.
- Cloudflare DNS.
- Vercel conectado al dominio.
- Resend verificado.
- Supabase SMTP funcionando.
- Confirmacion de correo funcionando.
- playback_visibility en public.beats.
- Admin puede cambiar beat publico/privado desde Gestionar Beats.
- Beat publico reproduce full sin acceso.
- Beat privado respeta preview/full por acceso.
- Admin/B.RCEO reproduce full sin beat_access.
- Descarga/licencia siguen protegidas aunque el beat sea publico.

SQL asociado:

```text
docs/supabase/phase-13-preview-editor.sql
docs/supabase/phase-13f-playback-visibility.sql
```

## Pendiente

- Fase 14: ordenes y pagos controlados
- Evaluar bucket privado y signed URLs
- Mejorar modelo formal de licencias despues del preview real
- Terminos y condiciones
- Suscripciones / freemium / watermark
- Marketplace multiusuario
- Perfiles publicos de productores/artistas
- Servicios musicales
- Escrow o pago protegido
- Chat / rooms de colaboracion

## Riesgos

- No exponer SUPABASE_SERVICE_ROLE_KEY
- Mantener B.RCEO como unico admin real
- No permitir acciones protegidas con fallback admin
- No mezclar BR.autocarmation con la logica principal de B.R
- No volver a filtrar el catalogo por beat_access: usuarios nuevos, existentes y admin deben recibir beats activos nuevos sin depender de sus accesos
- No romper player full/preview por acceso durante preview real, descargas, licencias o pagos
- No habilitar descarga sin acceso/licencia valida
- No avanzar a marketplace antes de consolidar ordenes/pagos controlados y licencias
- No confundir is_active con playback_visibility: is_active controla catalogo y playback_visibility controla full publico/privado
- No liberar descarga/licencia solo porque un beat sea publico
- No hacer depender al admin/B.RCEO de beat_access para reproducir full

## Pros

- Base funcional ya publicada
- Supabase Auth y Storage operativos
- Flujo de acceso manual ya probado
- Favoritos y Mis Beats ya funcionan
- Catalogo activo ya funciona para usuarios nuevos, existentes, visitantes y admin
- Player ya respeta acceso full/preview
- Guardados locales ya funcionan como base de favoritos
- Controles de player mejorados con teclado y seek
- Descarga MP3 protegida ya funciona
- Descarga de licencia protegida ya funciona
- Actividad comercial registrada server-side
- Pagos manuales por usuario + beat ya funcionan
- Tipos de licencia basic/premium/exclusive ya soportados
- Arquitectura lista para ordenes/pagos controlados y licencias formales
- Marca B.R puede evolucionar a marketplace musical
- Preview real ya funciona con duraciones configurables
- Dominio propio y SMTP real ya funcionan
- Playback publico/privado por beat ya funciona
- Admin B.RCEO tiene full global sin beat_access
- Actualizaciones compactas con modal ya funcionan

## Contras

- Aun falta Fase 14 de ordenes y pagos controlados
- Aun falta sistema formal/legal avanzado de licencias
- El marketplace multiusuario requiere roles, permisos y moderacion adicionales

## Continuidad

- Prioridad: Ejecutar Fase 14B de ordenes comerciales.
- Proxima accion: Crear tabla de ordenes comerciales y estados pending, approved, rejected y cancelled vinculados a usuarios, beats y pagos.
- Contexto: B.R esta publicada en Vercel con dominio brstudios.org, conectada a Supabase real, registrada en BR.autocarmation y con Fase 13 cerrada. El sistema ya tiene preview real generado desde el beat completo, player premium, full/preview por acceso y playback_visibility, admin full global, SMTP real con Resend/Supabase, actualizaciones compactas, descargas/licencias protegidas y pagos manuales base.
- Regla critica: beat_access no filtra catalogo; solo controla descarga, licencia, badges y acciones protegidas. playback_visibility controla si el beat reproduce full publicamente o solo preview/full por acceso.

## Fase 14 propuesta - Ordenes y pagos controlados

Meta: crear un flujo controlado de orden/pago desde admin para liberar acceso, descarga y licencia sin automatizar marketplace ni pagos completos todavia.

Alcance inicial:

- Crear solicitud/intencion de compra.
- Crear estado de orden: pending / approved / rejected / cancelled.
- Permitir que admin confirme pago manualmente.
- Al aprobar pago, liberar beat_access y license_type.
- Mostrar al usuario el estado de su compra.
- Mantener descarga MP3/licencia protegida por sesion y beat_access.
- No usar beat_access para filtrar catalogo.
- No romper playback_visibility publico/privado.

Fuera de alcance inicial:

- Stripe o pagos automaticos completos.
- Marketplace multiusuario.
- Perfiles publicos de productores/artistas.
- Licencias legales avanzadas.
- Escrow o pago protegido.

## BR.autocarmation como soporte interno

- Managed: true
- Prioridad de foco: product_first
- Prioridad BR.autocarmation: secondary_support_system
- Regla de foco: BR.autocarmation debe actuar como soporte y no como foco principal cuando esta app no sea BR.autocar Admin Web.
- Template role: Managed product app
- Template version: app-state-schema-v3
- Future sync target: BR.autocar Admin Web

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

## Validaciones minimas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

Ultima generacion: Fase 14A validada / flujo comercial controlado inicial
