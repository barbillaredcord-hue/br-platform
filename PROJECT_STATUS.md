# Project Status - B.R

Generado automaticamente por BR.autocar Documentation Engine. No editar manualmente.

## Foco principal del producto

- Foco: Consolidar el flujo Beat -> preview real -> solicitud -> pago/acceso -> descarga/licencia.
- Regla: El foco principal de esta app es B.R. BR.autocarmation es soporte interno y no debe sustituir el objetivo del producto.
- Rol de BR.autocar dentro de esta app: Infraestructura de soporte

## Estado actual

- Proyecto: br-platform
- Producto: B.R
- Tipo: marketplace musical / plataforma privada de beats
- Owner: Fabian
- Visibilidad: private
- Fase: Fase 14G.1 - Admin UX Refinement + AI Beat Analysis Lite
- Estado: implemented
- Avance: 98%
- Nivel: Produccion inicial operativa: Next.js App Router en Vercel con dominio brstudios.org, Supabase Auth/Storage/Postgres, Resend SMTP, Home Discovery con busqueda, playlist Full Beats, generos multi-tag, catalogo publico activo, paginas publicas compactas estilo Spotify, Admin Beats Dashboard, Commercial Detail Dock, AI Beat Analysis Lite con Procesar de nuevo, revocaciones visibles, dashboard comercial compacto, admin con activos/inactivos, preview real, waveform fallback seguro, player full/preview por acceso, descargas/licencias protegidas, pagos manuales, B.R Cambios y admin_change_logs.

## Siguiente fase

- Fase: Fase 14G.2 - Clasificacion musical asistida
- Objetivo: Clasificar beats por BPM, tonalidad, generos, subgeneros y mood con asistencia progresiva sin romper metadata manual.

## Objetivo principal

Consolidar el flujo comercial base antes de expandir a marketplace multiusuario.

## Objetivos secundarios

- Catalogo activo publico: 100% (completed) - Publico ve solo is_active=true; admin ve activos e inactivos.
- Player por acceso: 100% (completed) - Resolver preview/full por playback_visibility, beat_access y rol admin.
- Descargas protegidas: 100% (completed) - Descargar MP3 solo con sesion y beat_access valido.
- Licencias protegidas: 100% (completed) - Generar licencia solo con sesion, beat_access y tipo de licencia.
- Actividad comercial: 100% (completed) - Registrar descargas, licencias y pagos en commercial_activity.
- Pagos manuales: 100% (completed) - Confirmar pagos manuales y liberar beat_access.
- Preview real: 100% (completed) - Generar previews reales de 15, 20, 25 o 30 segundos.
- Revocaciones de acceso: 100% (completed) - Registrar access_revocations al retirar acceso.
- B.R Cambios: 100% (completed) - Registrar historial administrativo temporal y permanente.
- Ordenes y pagos controlados: 55% (in_progress) - Formalizar estados de orden sin automatizar pagos completos.
- Licencias formales: 0% (planned) - Mejorar contrato legal y versionado de licencias.
- Marketplace musical: 0% (future) - Expandir a marketplace multiusuario.

## Fases completadas

- Base, Supabase, Storage y admin inicial: Next.js, Supabase Auth/Storage, upload MP3, catalogo, solicitudes, admin y produccion inicial.
- Comercial base: Descargas MP3/licencia protegidas, commercial_activity, manual_payments y tipos basic/premium/exclusive.
- Preview real, player premium, auth SMTP y playback publico/privado: Preview Editor, PlayerBar, dominio, Resend SMTP y playback_visibility.
- Pago manual confirmado: Confirmacion admin crea beat_access, manual_payments, commercial_activity y actualiza solicitud.
- Estados iniciales de orden: SQL incremental para estados de access_requests preparado.
- Revocaciones: access_revocations y flujo de revocacion documentado/implementado.
- Historial administrativo: admin_change_logs, B.R Cambios, historial temporal por 7 dias, soft delete y PDF manual.
- UI publica compacta y errores de audio: Paginas publicas estilo Spotify, BeatCard compacto, HeroBeat compacto, waveform fallback y errores de audio controlados.
- Home Discovery / Spotify Catalog: Busqueda Home, playlist Full Beats, generos multi-tag y agrupacion dinamica de catalogo.
- Commercial Detail Dock: Dashboard comercial con dock de detalle, top usuarios, top beats, metricas y actividad compacta.
- Admin Beats Dashboard Layout: Gestion de Beats convertida a dashboard con resumen lateral, catalogo central y panel detalle anclado.
- Admin UX Refinement + AI Beat Analysis Lite: AI Lite con Procesar de nuevo, coincidencia estable, revocaciones visibles, paneles compactos de tops, historial admin compacto y header dashboard compacto.

## Completado

- Home, explore, beat detail, favoritos y Mis Beats
- Panel admin con Gestion de Beats, Usuarios, Accesos, Solicitudes, Actividad Comercial, Usuarios Comerciales, Preview Editor, Estado Supabase y B.R Cambios
- Catalogo publico filtra is_active=true
- Admin carga activos e inactivos via /api/admin/beats
- Metadata editable en Gestion de Beats
- playback_visibility editable en admin
- PlayerBar enlazado al beat y full/preview por acceso
- Descargas MP3 y licencias protegidas por beat_access
- Pagos manuales con license_type y prevencion de duplicados
- Actividad comercial server-side
- Home Discovery Search
- Playlist Full Beats
- Generos multi-tag
- Compact Public Beat Pages
- Admin Beats Dashboard Layout
- Commercial Detail Dock
- AI Beat Analysis Lite Reprocess
- Revocation UX Improvements
- Commercial dashboard rankings
- access_revocations
- admin_change_logs con temporal 7 dias y permanente por anio
- Soft delete is_deleted para B.R Cambios
- PDF manual del historial temporal

## Pendiente

- Fase 14 M2: estados formales de orden y pago
- Aplicar/actualizar schema consolidado si se decide sincronizar docs/supabase/schema.sql con phase-14d
- Evaluar bucket privado y signed URLs
- Terminos y condiciones
- Licencias legales avanzadas
- Pagos automaticos completos
- Marketplace multiusuario
- B.R Radio
- Portadas reales

## Riesgos

- Sin datos registrados

## Pros

- Sin datos registrados

## Contras

- Sin datos registrados

## Continuidad

- Prioridad: Continuar Fase 14G.2 sin romper catalogo, metadata manual, playback, descargas/licencias ni historial administrativo.
- Proxima accion: Implementar clasificacion musical asistida y preparar B.R Radio / playlist publica continua.
- Contexto: unknown

## BR.autocar como soporte interno

- Managed: True
- Prioridad de foco: product_first
- Prioridad BR.autocar: secondary_support_system
- Regla de foco: BR.autocar debe actuar como soporte y no como foco principal cuando esta app no sea BR.autocar Admin Web.
- Template role: Managed product app
- Template version: app-state-schema-v3
- Future sync target: BR.autocar Admin Web
- Registry ready: False
- Installer ready: False
- Scan ready: False
- Admin Web ready: False
- Multiuser ready: False

## Registry Intelligence

- Apps registradas: 3
- Healthy: 3
- Attention: 0
- Risk: 0
- Blocked: 0
- Validated pilot: 1
- Recomendacion: Separar trabajo futuro del ecosistema BR.autocar de riesgos operativos de cada app antes de avanzar al Admin Web.

Ultima generacion: 2026-06-23T10:26:16
