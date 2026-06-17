# PROJECT_STATUS.md - B.R / br-platform

Generado por BR.autocar Documentation Engine. Mantener alineado con APP_STATE.json, README.md, AGENTS.md, CHATGPT_CONTEXT.md y CODEX_CONTEXT.md.

## Foco principal del producto

- Foco: Consolidar el flujo Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia.
- Regla: El foco principal, continuidad, avances y meta final de esta app pertenecen a B.R. BR.autocarmation dentro de esta app es infraestructura de soporte y no debe sustituir el objetivo principal del producto.
- Rol de BR.autocarmation dentro de esta app: objetivo secundario e infraestructura de continuidad.
- La base comercial de Fase 12 ya quedó cerrada. El siguiente foco es Fase 13: preview real de 15 segundos + UX premium del player.

## Estado actual

- Proyecto: br-platform
- Producto: B.R
- Tipo: marketplace musical / plataforma privada de beats
- Owner: Fabian
- Visibilidad: private
- Fase: Fase 12 cerrada / comercial base completada
- Estado: implemented / estable
- Avance: 85%
- Nivel: App Next.js publicada en Vercel con Supabase Auth, Storage, beats reales, catálogo visible, player full/preview por acceso, guardados locales, Mis Beats, solicitudes, acceso manual, descargas protegidas, licencias protegidas, pagos manuales, actividad comercial, admin B.RCEO y controles de player con Space/seek.
- Backend: Supabase real
- Deploy: Vercel
- BR.autocarmation: B.R ya registrada en Core v3
- Último commit funcional: be3d8cb feat:add license type support and phase 12 checkpoint
- Checkpoint principal: docs/phase-12-commercial-checkpoint.md
- SQL comercial: docs/supabase/phase-12-commercial.sql

## Siguiente fase

- Fase: Fase 13 - preview real de 15 segundos + UX premium del player
- Objetivo: Separar un preview real de 15 segundos del audio full, mejorar la experiencia premium del player y preparar la base para pagos iniciales/licencias sin expandir todavía a marketplace multiusuario.

## Objetivo principal

Consolidar primero el flujo Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia antes de expandir a marketplace multiusuario.

## Objetivos secundarios

- Player por acceso: 100% (completed) - Reproducir full audio cuando el usuario tiene acceso y preview cuando no tiene acceso o no ha iniciado sesión.
- Descargas protegidas: 100% (completed) - Descargar MP3 solo con sesión y beat_access válido.
- Licencias protegidas: 100% (completed) - Descargar licencia solo con sesión y beat_access válido.
- Actividad comercial: 100% (completed) - Registrar actividad server-side en commercial_activity.
- Pagos manuales: 100% (completed) - Registrar pagos manuales por usuario + beat, con prevención de duplicados.
- Tipos de licencia: 100% (completed) - Soporte basic, premium y exclusive.
- Preview real: 0% (planned) - Generar y administrar previews reales de 15 segundos.
- Pagos iniciales automatizados: 0% (planned) - Preparar flujo de pagos iniciales sin Stripe completo hasta definir alcance.
- Licencias formales: 0% (planned) - Mejorar modelo legal y descargable de licencias después del preview real.
- Marketplace musical: 0% (future) - Expandir B.R a marketplace para productores, músicos, beatmakers, DJs y servicios musicales.

## Fases completadas

- Base inicial: Proyecto Next.js creado y estructura inicial preparada.
- Diseño visual inicial: Home y experiencia visual tipo Spotify/Netflix con identidad B.R.
- Beats y player: Catálogo de beats, página dinámica y player funcional.
- Admin inicial: Panel admin, gestión de beats y solicitudes iniciales.
- Supabase y Storage: Supabase Auth, Storage, bucket beats, upload MP3 y flujos funcionales conectados.
- Producción inicial: Deploy en Vercel, acceso manual, B.RCEO admin, eliminación de usuarios y app lista para consolidación comercial.
- Consistencia y duplicados: Control de slugs duplicados, mensajes claros, limpieza defensiva de MP3 huérfanos y refresh de accesos.
- UX de solicitudes y dashboard: Dashboard admin vivo, solicitudes más claras, contacto por WhatsApp, rutas dinámicas y datos reales desde Supabase.
- Accesos, usuarios y navegación: Access Manager centrado en beat, solicitudes con historial, usuarios expandibles, Explore, Favoritos y Mis Beats funcionales.
- Estabilidad de catálogo, usuarios y accesos: Usuarios existentes reciben beats nuevos, regla permanente de catálogo activo agregada, UserContext valida cuenta eliminada y Supabase schema actualizado.
- Player por acceso: Player full/preview resuelto por acceso real; siguiente/anterior selecciona full si el usuario tiene acceso y preview si no lo tiene.
- Guardados y controles del player: Scroll horizontal Safari-safe, guardados locales, /account/saved funcional, Space play/pause y barra de progreso seekable/clickeable.
- Fase 12 comercial base: Descarga protegida MP3, descarga protegida de licencia, commercial_activity, paneles admin comerciales, pagos manuales, prevención de duplicados y tipos de licencia basic/premium/exclusive.

## Completado

- Proyecto Next.js creado
- Diseño inicial tipo Spotify/Netflix
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
- Teléfono en perfil
- Cambio de username
- Ocultar Supabase conectado a usuarios normales
- Eliminar usuarios implementado
- UserContext valida cuenta eliminada
- Usuarios nuevos, existentes y admin reciben beats activos nuevos
- Regla permanente de catálogo activo agregada
- Supabase schema actualizado para Fase 11F-C
- Player full/preview por acceso completado
- Siguiente/anterior del player respeta acceso real
- Scroll horizontal Safari-safe en BeatRow
- Guardados locales implementados con localStorage
- /account/saved conectado a guardados reales
- Space play/pause agregado al player
- Barra de progreso clickeable/seekable agregada al player
- Descarga protegida de MP3 por sesión y beat_access
- Descarga protegida de licencia por sesión y beat_access
- Registro server-side de actividad comercial en commercial_activity
- Panel admin de actividad comercial
- Panel admin de usuarios comerciales
- Registro de pagos manuales por usuario + beat
- Prevención de pago manual duplicado por usuario + beat
- Tipos de licencia basic, premium y exclusive
- Checkpoint de Fase 12 en docs/phase-12-commercial-checkpoint.md
- Deploy en Vercel funcionando
- GitHub conectado
- APP_STATE.json creado para BR.autocarmation
- B.R registrada en Core v3 registry

## Regla permanente de catálogo

- Todo beat activo debe aparecer en el catálogo para visitantes, usuarios nuevos, usuarios existentes y admin/B.RCEO, según la visibilidad pública prevista.
- beat_access no debe filtrar la visibilidad del catálogo.
- beat_access solo controla preview/full, descarga, licencia, badges y acciones protegidas.

## Regla permanente del player

- Si el usuario tiene acceso al beat, reproducir full audio.
- Si no tiene acceso, reproducir preview.
- Si no hay sesión, reproducir preview.
- Siguiente/anterior deben resolver acceso por beat, no reutilizar la URL anterior.
- No romper esta regla al implementar preview real, descargas, licencias, pagos o rediseño visual.

## Regla de cuenta eliminada

- Si un usuario elimina su cuenta, se eliminan sus datos y accesos.
- Si vuelve a crear una cuenta con el mismo correo, B.R no garantiza recuperar accesos anteriores.
- Esta regla debe incluirse después en términos y condiciones.

## Fase 12 cerrada - Comercial base

Completado:

- Preview/full por acceso.
- Saved beats.
- Descarga protegida MP3.
- Descarga protegida licencia.
- Registro server-side de actividad comercial en commercial_activity.
- Panel admin de actividad comercial.
- Panel admin de usuarios comerciales.
- Pagos manuales por usuario + beat.
- Prevención de pago duplicado por usuario + beat.
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

El SQL debe estar ejecutado o re-ejecutado en Supabase. Incluye `commercial_activity`, `manual_payments`, `manual_payments_user_beat_unique_idx`, `manual_payments.license_type`, constraint basic/premium/exclusive y `manual_payments_license_type_idx`.

## Pendiente

- Fase 13: preview real de 15 segundos + UX premium del player
- Evaluar bucket privado y signed URLs
- Preparar pagos iniciales sin Stripe hasta definir alcance
- Mejorar modelo formal de licencias después del preview real
- Términos y condiciones
- Suscripciones / freemium / watermark
- Marketplace multiusuario
- Perfiles públicos de productores/artistas
- Servicios musicales
- Escrow o pago protegido
- Chat / rooms de colaboración

## Riesgos

- No exponer SUPABASE_SERVICE_ROLE_KEY
- Mantener B.RCEO como único admin real
- No permitir acciones protegidas con fallback admin
- No mezclar BR.autocarmation con la lógica principal de B.R
- No volver a filtrar el catálogo por beat_access: usuarios nuevos, existentes y admin deben recibir beats activos nuevos sin depender de sus accesos
- No romper player full/preview por acceso durante preview real, descargas, licencias o pagos
- No habilitar descarga sin acceso/licencia válida
- No avanzar a marketplace antes de consolidar preview real, pagos iniciales y licencias

## Pros

- Base funcional ya publicada
- Supabase Auth y Storage operativos
- Flujo de acceso manual ya probado
- Favoritos y Mis Beats ya funcionan
- Catálogo activo ya funciona para usuarios nuevos, existentes y admin
- Player ya respeta acceso full/preview
- Guardados locales ya funcionan como base de favoritos
- Controles de player mejorados con teclado y seek
- Descarga MP3 protegida ya funciona
- Descarga de licencia protegida ya funciona
- Actividad comercial registrada server-side
- Pagos manuales por usuario + beat ya funcionan
- Tipos de licencia basic/premium/exclusive ya soportados
- Arquitectura lista para preview real, pagos iniciales y licencias formales
- Marca B.R puede evolucionar a marketplace musical

## Contras

- Aún falta preview real separado de 15 segundos
- Aún falta pagos automáticos completos
- Aún falta sistema formal/legal avanzado de licencias
- El marketplace multiusuario requiere roles, permisos y moderación adicionales

## Continuidad

- Prioridad: Iniciar Fase 13 con preview real de 15 segundos + UX premium del player.
- Próxima acción: Separar preview real de audio full, mejorar player, evaluar bucket privado/signed URLs y preparar pagos iniciales/licencias sin Stripe completo.
- Contexto: B.R está publicada en Vercel, conectada a Supabase real, registrada en BR.autocarmation y con Fase 12 comercial cerrada en commit be3d8cb.
- Regla crítica: beat_access no filtra catálogo; solo controla preview/full, descarga, licencia, badges y acciones protegidas.

## Fase 13 propuesta - Preview real y UX premium

Meta: separar un preview real de 15 segundos del audio full, mejorar la experiencia premium del player y preparar la base para pagos iniciales/licencias sin expandir todavía a marketplace multiusuario.

Alcance inicial:

- Crear preview real separado de 15 segundos.
- Mantener full audio solo para usuarios con acceso.
- Mejorar UX premium del player sin romper preview/full actual.
- Evaluar bucket privado y signed URLs.
- Mantener descarga MP3/licencia protegida por sesión y beat_access.
- No usar beat_access para filtrar catálogo.

Fuera de alcance inicial:

- Stripe o pagos automáticos completos.
- Marketplace multiusuario.
- Perfiles públicos de productores/artistas.
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

## Documentación de continuidad

Archivos principales:

```text
APP_STATE.json
PROJECT_STATUS.md
README.md
AGENTS.md
CHATGPT_CONTEXT.md
CODEX_CONTEXT.md
docs/phase-12-commercial-checkpoint.md
docs/phase-12m1-continuity-sync.md
```

## Validaciones mínimas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

Última generación: Fase 12 cerrada / comercial base completada
