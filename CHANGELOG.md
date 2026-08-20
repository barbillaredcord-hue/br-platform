# Changelog

Generado automaticamente desde APP_STATE.json history[].

## 2026-08-14 - fase_14_5

- Evento: Auditoria documental y apertura de Fase 14.5
- Razon: El estado Fase 14G.1 al 98% y la siguiente Fase 14G.2 ya no representaban el codigo existente.
- Impacto: Analisis musical e identidad reconocidos como implementados; pendientes reales priorizados; Fase 15 CRM definida como siguiente fase y roadmap 16-18 separado.

## 2026-08-16 - fase_14_5_roadmap_architectural_subphases

- Evento: Roadmap oficial de Fase 14.5 dividido en subfases arquitectonicas
- Razon: Formalizar los bloqueos de seguridad, acceso, sincronizacion, atomicidad y separacion progresiva antes de CRM sin introducir una nueva arquitectura.
- Impacto: 14.5A-14.5E y validacion final quedan planificadas; el estado permanece in_progress al 70% y Fase 15 sigue bloqueada hasta el cierre verificable de la base.

## 2026-08-16 - fase_14_5c_realtime_sync_completed

- Evento: Cierre de 14.5C - Sincronizacion Realtime
- Razon: La sincronizacion privada, reconciliacion contra beat_access, recuperacion de red y reaccion del Player fueron validadas tecnica y fisicamente.
- Impacto: 14.5C queda completed; 14.5D - Operaciones Atomicas Criticas pasa a ser la siguiente subfase y el avance global manual permanece en 70%.

## 2026-08-16 - fase_14_5d_atomic_critical_operations_completed

- Evento: Cierre de 14.5D - Operaciones Atomicas Criticas
- Razon: Grant, revoke, approve, reject y pago manual requerian evitar estados parciales, carreras TOCTOU y duplicaciones accidentales.
- Impacto: Cinco RPCs PostgreSQL minimas garantizan todo-o-nada, locks acotados e idempotencia; rollback, UI, historial y Realtime fueron validados. 14.5E pasa a ser la siguiente subfase y el avance permanece en 70%.

## 2026-08-16 - fase_14_5e_progressive_domain_separation_completed

- Evento: Cierre de 14.5E - Separacion Progresiva por Dominio
- Razon: queries.ts concentraba acceso, sesiones, catalogo, perfiles y administracion; se requeria establecer un patron incremental antes de continuar la consolidacion.
- Impacto: Autoridad e historial de acceso se extrajeron con facade compatible y cliente compartido; queries.ts redujo 447 lineas sin cambiar consumidores. El siguiente pendiente real es persistencia musical versionada y Fase 15 permanece cerrada.

## 2026-08-17 - public_playback_commercial_access_separation

- Evento: Correccion de solicitudes, historial Admin y playback publico
- Razon: La UI confundia full publico con acceso comercial, Account permitia re-solicitar y el endpoint playback exigia sesion antes de evaluar visibilidad.
- Impacto: Full publico funciona con signed URL temporal sin otorgar derechos comerciales; beat_access conserva download/license; re-solicitudes cerradas se hacen desde el beat sin limite artificial y Admin muestra historial legible. Fase 14.5 permanece in_progress al 70%.

## 2026-08-17 - pending_payment_admin_history_correction

- Evento: Correccion de pago pendiente e historial Admin
- Razon: La aprobacion atomica concedia acceso y cerraba la solicitud antes de confirmar un pago real.
- Impacto: Aprobar deja payment_pending sin acceso; el pago manual conserva su transaccion atomica y Admin muestra contadores, estado de pago, acceso vigente e historial de revocaciones por separado. Fase 14.5 permanece in_progress al 70%; la validacion fisica queda pendiente por falta de navegador conectado.

## 2026-08-17 - phase_14_5_transversal_sync_audit

- Evento: Auditoria y consolidacion de sincronizacion transversal
- Razon: Eventos locales duplicados, superficies sin relectura y Commercial inferian pago pendiente desde una fuente incorrecta.
- Impacto: Dispatcher centralizado, invalidacion por dominio, recuperacion por foco y online, payment_pending alineado con access_requests y estados actuales derivados de beat_access. Realtime remoto y validacion tecnica pasan; Fase 14.5 permanece in_progress al 70% hasta completar validacion fisica y pendientes funcionales.

## 2026-08-17 - phase_14_5_musical_persistence_pending_physical_validation

- Evento: Persistencia musical versionada y clasificacion asistida consolidadas tecnicamente
- Razon: El motor calculaba resultados musicales, pero genero/subgenero no usaban las features de audio y la documentacion no distinguia implementacion tecnica de validacion fisica.
- Impacto: br-analysis-v1 persiste resultados detectados, confidence nullable, analyzed_at, Quality Score, recomendacion y features compactas en un unico UPDATE; genero/subgenero usan una heuristica conservadora sin sobrescribir metadata manual. El bloque musical queda al 90% y pendiente de los cuatro casos fisicos del Preview Editor.

## 2026-08-18 - phase_14_5_conservative_genre_classification_v2

- Evento: Correccion conservadora de genero y subgenero
- Razon: La validacion fisica revelo falsos positivos causados por thresholds bajos, features correlacionadas y subgeneros demasiado especificos.
- Impacto: br-analysis-v2 usa categorias amplias, margen minimo, evidencia independiente y penalizaciones por contradiccion; Unclassified prevalece ante duda y los subgeneros requieren evidencia fuerte. Tres resultados v1 quedan stale para reproceso manual; Fase 14.5 y el bloque musical permanecen abiertos hasta validacion fisica.

## 2026-08-18 - phase_14_5_commercial_state_consolidation

- Evento: Consolidacion comercial y decision sobre orders
- Razon: Solicitud, pago, acceso, actividad y revocacion necesitaban una lectura unica sin duplicar autoridad ni introducir una orden sin necesidad real.
- Impacto: Estados comerciales derivados distinguen pago, acceso comercial, grant administrativo, revocado y restaurado; pagos se cuentan desde manual_payments y beat_access conserva autoridad. Orders se difiere a Fase 15. La fase avanza a 95% y queda abierta solo por regresion visual autenticada final sin navegador conectado.

## 2026-08-18 - phase_14_5_completed

- Evento: Cierre oficial de Fase 14.5 - Consolidacion de BR Platform / Beat Room
- Razon: La regresion visual autenticada final fue ejecutada fisicamente por el usuario en localhost:3100 y todos los flujos de salida pasaron.
- Impacto: Fase 14.5 queda completed al 100%. Fase 15 - Motor Comercial Inteligente / CRM queda habilitada como siguiente fase oficial sin implementacion iniciada; Artist Foundation se incorpora como expansion estrategica posterior a Fase 18.

## 2026-08-18 - phase_15_0_crm_foundation

- Evento: Apertura oficial de Fase 15 y cierre de 15.0 CRM Foundation
- Razon: La informacion comercial existente necesitaba un modelo de persona, relaciones y oportunidades antes de agregar tablas o pantallas CRM.
- Impacto: Fase 15 queda in_progress al 12%. profiles.id es la identidad inicial; las seis autoridades existentes se preservan; relaciones y oportunidades se aceptan logicamente; contacts, orders, notas, tareas y tags no se crean. 15.1 pasa a ser la siguiente subfase.
