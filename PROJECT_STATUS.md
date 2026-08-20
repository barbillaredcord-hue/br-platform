# Project Status - B.R

Generado automaticamente por BR.autocar Documentation Engine. No editar manualmente.

## Foco principal del producto

- Foco: Construir Fase 15 - Motor Comercial Inteligente / CRM como conocimiento organizado sobre personas, relaciones, oportunidades y seguimiento, sin duplicar las autoridades de Beat Room.
- Regla: El foco principal de esta app es B.R. BR.autocarmation es soporte interno y no debe sustituir el objetivo del producto.
- Rol de BR.autocar dentro de esta app: Infraestructura de soporte

## Estado actual

- Proyecto: br-platform
- Producto: B.R
- Tipo: marketplace musical / plataforma privada de beats
- Owner: Fabian
- Visibilidad: private
- Fase: Fase 15 - Motor Comercial Inteligente / CRM
- Estado: in_progress
- Avance: 12%
- Nivel: 15.1 Contact Intelligence implementada sobre profiles.id y las fuentes comerciales existentes; crm_relationships remota esta aplicada sin reemplazar autoridades. Estado pending_validation por falta de navegador Admin.

## Siguiente fase

- Fase: 15.1 - Contact Intelligence y Relaciones
- Objetivo: Completar la validacion fisica Admin de Contact 360 y relaciones explicitas ya implementadas.

## Objetivo principal

Convertir la informacion comercial existente en contexto CRM organizado y accionable, empezando por identidad, relaciones y metricas deterministas.

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
- Operaciones y pagos controlados: 100% (completed) - Consolidar estados comerciales, pagos manuales y trazabilidad sin confundirlos con una orden formal completa.
- Analisis musical asistido: 100% (completed) - Consolidar BPM, key, features, Quality Score y clasificacion conservadora con persistencia verificable.
- Sincronizacion transversal de acceso: 100% (completed) - Sincronizar cambios de beat_access entre sesiones mediante Broadcast privado y reconciliacion contra Postgres.
- Identidad y app experience: 100% (completed) - Integrar logo, metadata, manifest, iconos y splash sin afectar navegacion ni rendimiento.
- CRM Foundation: 100% (completed) - Definir identidad, limites de dominio, entidades minimas y metricas deterministas sin duplicar autoridades existentes.
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
- Fase 14.5 - Consolidacion de BR Platform / Beat Room: Seguridad de audio, Access Domain, Realtime privado, operaciones atomicas, sincronizacion transversal, estados comerciales, analisis musical v2 y regresion visual autenticada final completados.

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
- Analisis musical real de BPM, tonalidad, chroma, FFT y features
- Beat Quality Score calculado y explicado en Preview Editor
- Autoanalisis al abrir Preview Editor y reprocesamiento manual
- Persistencia musical versionada br-analysis-v2 con confidence nullable, analyzed_at y resultados detectados en un unico UPDATE
- Clasificacion conservadora por evidencia fuerte, parcial o insuficiente, con categorias amplias y subgeneros bajo gates estrictos
- Identidad visual, metadata, manifest, favicon, app icons y splash
- access_revocations
- admin_change_logs con temporal 7 dias y permanente por anio
- Soft delete is_deleted para B.R Cambios
- PDF manual del historial temporal
- 14.5A: full audio privado con autorizacion server-side y signed URLs
- 14.5B: Access Domain con beat_access como autoridad actual y access_revocations como historial
- 14.5C: Broadcast Realtime privado por usuario, reconciliacion contra beat_access, recuperacion de red y Player reactivo a revocaciones
- 14.5D: operaciones criticas de acceso, solicitudes y pago manual atomicas mediante RPCs PostgreSQL validadas con rollback, retries y Realtime
- 14.5E: primera separacion progresiva del dominio de acceso con facade compatible, cliente compartido y cero cambios de consumidores
- Playback publico separado de acceso comercial; re-solicitud desde beat detail e historial Admin legible
- Sincronizacion transversal consolidada con dispatcher local unico, invalidacion por dominio, payment_pending derivado de access_requests y Commercial alineado con beat_access
- Analisis musical br-analysis-v2 validado funcionalmente con clasificacion conservadora y metadata manual protegida
- Estados comerciales derivados con diferencia explicita entre acceso por pago, grant administrativo, revocado y restaurado; orders diferida a Fase 15
- Regresion visual autenticada final PASS en localhost:3100
- 15.0 CRM Foundation: auditoria local/remota, identidad profiles.id, contrato arquitectonico y selector de inteligencia determinista

## Pendiente

- Aplicar/actualizar schema consolidado si se decide sincronizar docs/supabase/schema.sql con phase-14d
- Terminos y condiciones
- Licencias legales avanzadas
- Pagos automaticos completos
- 15.1 Contact Intelligence y relaciones explicitas
- 15.2 Opportunities separadas de access_requests
- Orders diferida hasta existir multiples items/pagos, facturacion, impuestos o checkout
- Mejoras futuras de precision y UI del analisis musical
- Marketplace multiusuario
- B.R Radio
- Portadas reales

## Riesgos

- Guard de regresion: el full audio debe conservar autorizacion server-side y signed URLs temporales; nunca volver a depender solo de una decision visual del Player.
- Supabase Realtime funciona como señal de cambio, no como fuente de verdad; tras una interrupcion de red la recuperacion debe reconciliar nuevamente contra beat_access.
- src/lib/supabase/queries.ts conserva catalogo, perfiles, workflow de solicitudes, uploads y administracion; la extraccion debe continuar solo cuando esos dominios vuelvan a modificarse.
- Existen 3 beats br-analysis-v1 que permanecen stale hasta un reproceso manual controlado a v2; no bloquean la validacion funcional aceptada del motor.
- La clasificacion de genero/subgenero es una heuristica conservadora basada en features de audio; puede devolver Unclassified y no equivale a un modelo ML ni una inferencia completa.
- El flujo 14.5 es deliberadamente de un usuario + un beat; una entidad orders solo debe abrirse en Fase 15 si CRM requiere identidad comercial propia, multiples items/pagos o facturacion.
- Las licencias generadas son tecnicas y no sustituyen un contrato legal formal y versionado.
- commercial_activity contiene eventos historicos legacy anteriores al RPC atomico; sus filas se preservan y los contadores de pagos usan manual_payments como autoridad.
- docs/supabase/schema.sql puede estar atras respecto a deltas recientes; no aplicar cambios remotos sin reconciliacion y respaldo.
- El proyecto Supabase comparte tablas de otras superficies; nombres genericos como marketplace_orders no deben asumirse como parte de Beat Room ni reutilizarse para CRM.
- profiles cubre a todos los actores actuales, pero el primer lead sin cuenta obligara a reevaluar una identidad CRM externa sin duplicar usuarios existentes.
- Existen dos package-lock.json en niveles distintos; es deuda menor de contexto de instalacion, no un bloqueo actual.

## Pros

- La plataforma base es funcional y cubre catalogo, autenticacion, playback, solicitudes, accesos, descargas, licencias y administracion.
- Supabase ya integra autenticacion, Postgres y Storage con APIs protegidas para operaciones sensibles.
- Next.js App Router y Supabase siguen siendo adecuados; no se requiere una reescritura ni tecnologia adicional para consolidar la fase.
- beat_access ya representa correctamente el acceso actual y access_revocations ya permite conservar su historial.
- Access Domain y Broadcast Realtime privado sincronizan cambios entre sesiones; UserContext reconcilia contra beat_access y conserva el ultimo estado valido durante fallos transitorios.
- La recuperacion por online, focus y visibility, junto con el aislamiento por usuario, fue validada fisicamente.
- Grant, revoke, approve, reject y pago manual operan mediante RPCs PostgreSQL atomicas con rollback e idempotencia validados.
- El dominio estable de autoridad e historial de acceso ya tiene modulo Supabase propio y queries.ts conserva compatibilidad mediante re-exports.
- La plataforma puede evolucionar con cambios quirurgicos y RPCs solo donde aporten atomicidad.
- El motor musical ya ejecuta BPM, tonalidad, chroma, FFT, features y Beat Quality Score sobre audio real.
- La operacion comercial manual tiene pagos, tipos de licencia, actividad y paneles administrativos.
- El selector comercial derivado distingue solicitud, revision, rechazo, pago pendiente, pago, acceso activo, revocado y restaurado sin duplicar verdad persistida.
- Commercial distingue acceso por pago, grant administrativo y restauracion; los ingresos se calculan exclusivamente desde manual_payments.
- Los cinco actores comerciales remotos tienen Auth/Profile y no hay identidades huerfanas, por lo que CRM puede iniciar sin una tabla de contactos duplicada.
- El selector CRM Foundation deriva relaciones, valor por moneda, actividad e intereses sin escribir ni alterar autoridades existentes.
- La identidad visual y la experiencia de instalacion/app icon estan consolidadas en las superficies principales.
- El proceso local de produccion br-platform esta operativo bajo PM2.

## Contras

- Pagos automaticos, terminos, licencias legales avanzadas y una posible entidad orders pertenecen a fases posteriores.
- El schema consolidado debe revisarse contra los deltas antes de tratarlo como fuente completa.
- Aun no existe persistencia para relaciones explicitas, oportunidades, notas o seguimiento; se agregara solo despues de validar cada flujo.

## Continuidad

- Prioridad: Completar la validacion fisica Admin de 15.1 Contact Intelligence; no avanzar a 15.2 hasta cerrar o registrar correctamente este gate.
- Proxima accion: Con navegador y sesion Admin, abrir Commercial Users, validar Contact 360 real, crear/reabrir/desactivar relaciones y confirmar que Commercial original y profiles.role permanecen intactos.
- Contexto: 15.1: migraciones crm_relationships e indices de auditoria aplicadas remotamente; RLS y comando idempotente se validaron en transaccion revertida (admin una fila activa, usuario normal cero updates). Suite local 91/91, lint, TypeScript, build y diff-check pasan. No existe navegador conectado para la validacion fisica.

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

Ultima generacion: 2026-08-19T12:44:28
