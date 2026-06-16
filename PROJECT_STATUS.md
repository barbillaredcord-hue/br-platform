# PROJECT_STATUS.md - B.R / br-platform

Generado por BR.autocar Documentation Engine. Mantener alineado con APP_STATE.json.

## Foco principal del producto

- Foco: Consolidar el flujo Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia.
- Regla: El foco principal, continuidad, avances y meta final de esta app pertenecen a B.R. BR.autocarmation dentro de esta app es infraestructura de soporte y no debe sustituir el objetivo principal del producto.
- Rol de BR.autocarmation dentro de esta app: Objetivo secundario e infraestructura de continuidad.

## Estado actual

- Proyecto: br-platform
- Producto: B.R
- Tipo: Marketplace musical / plataforma privada de beats
- Owner: Fabian
- Visibilidad: private
- Fase: Fase 12D en progreso / checkpoint comercial y continuidad
- Estado: in_progress
- Avance: 85%
- Nivel: App Next.js publicada en Vercel con Supabase Auth, Storage, beats reales, catalogo visible, player full/preview por acceso, guardados locales, Mis Beats, solicitudes, acceso manual, admin B.RCEO y controles de player con Space/seek.
- Backend: Supabase real
- Deploy: Vercel
- BR.autocarmation: B.R ya registrada en Core v3
- Ultimo commit funcional: 5daddf3 Complete phase 12C saved beats and player controls

## Siguiente fase

- Fase: Fase 12E - descargas controladas por acceso/licencia
- Objetivo: Permitir descarga solo si el usuario tiene acceso valido al beat y preparar la base para licencias descargables.

## Objetivo principal

Consolidar primero el flujo Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia antes de expandir a marketplace multiusuario.

## Objetivos secundarios

- Player por acceso: 100% (completed) - Reproducir full audio cuando el usuario tiene acceso y preview cuando no tiene acceso o no ha iniciado sesion.
- Preview real: 0% (planned) - Generar y administrar previews reales de 15 segundos.
- Pagos y acceso automatico: 0% (planned) - Implementar flujo pago -> acceso automatico.
- Licencias: 0% (planned) - Crear licencias MP3, WAV, trackouts y exclusivas.
- Descargas controladas: 0% (next) - Permitir descarga solo cuando el usuario tiene acceso/licencia valida para el beat.
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
- Guardados y controles del player: Scroll horizontal Safari-safe, guardados locales, /account/saved funcional, Space play/pause y barra de progreso seekable/clickeable. Commit 5daddf3.

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
- Usuarios nuevos, existentes y admin reciben beats activos nuevos
- Regla permanente de catalogo activo agregada
- Supabase schema actualizado para Fase 11F-C
- Player full/preview por acceso completado
- Siguiente/anterior del player respeta acceso real
- Scroll horizontal Safari-safe en BeatRow
- Guardados locales implementados con localStorage
- /account/saved conectado a guardados reales
- Space play/pause agregado al player
- Barra de progreso clickeable/seekable agregada al player
- Deploy en Vercel funcionando
- GitHub conectado
- APP_STATE.json creado para BR.autocarmation
- B.R registrada en Core v3 registry

## Regla permanente de catalogo

- Todo beat activo debe aparecer en el catalogo para visitantes, usuarios nuevos, usuarios existentes y admin/B.RCEO, segun la visibilidad publica prevista.
- beat_access no debe filtrar la visibilidad del catalogo.
- beat_access solo controla preview/full, descarga, badges y acciones protegidas.

## Regla de cuenta eliminada

- Si un usuario elimina su cuenta, se eliminan sus datos y accesos.
- Si vuelve a crear una cuenta con el mismo correo, B.R no garantiza recuperar accesos anteriores.
- Esta regla debe incluirse despues en terminos y condiciones.

## Pendiente

- Preview real de 15 segundos
- Pagos
- Licencias descargables
- Descargas controladas por tipo de licencia
- Marketplace multiusuario
- Perfiles publicos de productores/artistas
- Servicios musicales
- Escrow o pago protegido
- Suscripciones / freemium
- Watermark para reproduccion completa sin acceso limpio
- Terminos y condiciones

## Riesgos

- No exponer SUPABASE_SERVICE_ROLE_KEY
- Mantener B.RCEO como unico admin real
- No permitir acciones protegidas con fallback admin
- No mezclar BR.autocarmation con la logica principal de B.R
- Evitar expandir a marketplace antes de consolidar el flujo comercial base
- No volver a filtrar el catalogo por beat_access: usuarios nuevos, existentes y admin deben recibir beats activos nuevos sin depender de sus accesos
- No romper player full/preview por acceso durante descargas, licencias o pagos
- No habilitar descarga sin acceso/licencia valida

## Pros

- Base funcional ya publicada
- Supabase Auth y Storage operativos
- Flujo de acceso manual ya probado
- Favoritos y Mis Beats ya funcionan
- Catalogo activo ya funciona para usuarios nuevos, existentes y admin
- Player ya respeta acceso full/preview
- Guardados locales ya funcionan como base de favoritos
- Controles de player mejorados con teclado y seek
- Arquitectura lista para pagos y licencias
- Marca B.R puede evolucionar a marketplace musical

## Contras

- Aun falta preview real
- Aun falta pagos automaticos
- Aun falta sistema formal de licencias
- Aun falta descarga controlada
- El marketplace multiusuario requiere roles, permisos y moderacion adicionales

## Continuidad

- Prioridad: Completar Fase 12D como checkpoint comercial antes de iniciar descargas, licencias y diseno visual premium.
- Proxima accion: Definir Fase 12E de descargas controladas por acceso/licencia y preparar el flujo Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia.
- Contexto: B.R esta publicada en Vercel, conectada a Supabase real, registrada en BR.autocarmation y con Fase 12C cerrada en commit 5daddf3. El player respeta acceso full/preview, guardados locales funcionan y el siguiente foco es consolidacion comercial.

## Fase 12E propuesta - Descargas controladas

Meta: permitir descarga solo cuando el usuario tiene acceso valido al beat y preparar la base para licencias descargables.

Alcance inicial:

- Boton Descargar visible solo si el usuario tiene acceso valido.
- Validacion de acceso antes de habilitar descarga.
- No usar beat_access para filtrar catalogo.
- Mantener preview/full playback separado de descarga.
- Preparar modelo para licencia futura sin implementar pagos aun.

Fuera de alcance inicial:

- Pagos automaticos.
- Marketplace multiusuario.
- Licencias PDF avanzadas.
- Escrow o pago protegido.
- Rediseño visual premium.

## BR.autocarmation como soporte interno

- Managed: true
- Prioridad de foco: product_first
- Prioridad BR.autocarmation: secondary_support_system
- Regla de foco: BR.autocarmation debe actuar como soporte y no como foco principal cuando esta app no sea BR.autocar Admin Web.
- Template role: Managed product app
- Template version: app-state-schema-v3
- Future sync target: BR.autocar Admin Web

## Validaciones minimas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

Ultima generacion: Fase 12D en progreso / checkpoint comercial y continuidad
