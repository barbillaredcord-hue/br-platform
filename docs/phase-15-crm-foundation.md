# Fase 15 — CRM Foundation y Contact Intelligence

## Decisión arquitectónica

El CRM inicia como un modelo de lectura sobre datos existentes. No reemplaza ni duplica sus fuentes de verdad:

- `profiles` identifica a la persona autenticada.
- `access_requests` conserva el workflow concreto de acceso a un beat.
- `manual_payments` conserva pagos confirmados y licencias adquiridas.
- `beat_access` determina acceso actual.
- `commercial_activity` conserva actividad histórica.
- `access_revocations` conserva historial de revocación.

La auditoría remota del 2026-08-18 encontró cinco usuarios Auth, cinco `profiles` y cero identidades huérfanas. Los cinco perfiles tienen actividad comercial. No existe evidencia actual para duplicarlos en `crm_contacts`.

## Identidad y relaciones

La identidad CRM estable inicial es `profiles.id`, que coincide con `auth.users.id`. `role` sigue limitado a autorización (`admin` o `user`) y no representa la relación comercial.

Las relaciones `contact`, `lead`, `client`, `artist`, `producer` y `collaborator` son etiquetas simultáneas, no roles excluyentes. `contact`, `lead` y `client` pueden derivarse de hechos existentes; las relaciones declaradas explícitamente se persisten en `crm_relationships` sin modificar `profiles.role`.

Si aparece el primer contacto comercial sin cuenta, se reevaluará una identidad CRM propia con vínculo opcional y único a `profiles`. No se crea antes de ese caso real.

## Estado de continuidad

La Fase 15 continúa `in_progress` al 12%: 15.0 CRM Foundation y 15.1 Contact Intelligence / Relaciones están `completed`. La validación física Admin confirmó Contact 360 y el ciclo persistente de relaciones explícitas. La siguiente subfase es 15.2 Opportunities, que permanece `planned` y todavía no está implementada.

El porcentaje se conserva en 12% porque `APP_STATE.json` y `br-sync-docs` no contienen una fórmula automática para recalcularlo. No se inventa un avance adicional por el cierre documental.

BR Platform / Beat Room y BR STUDIOS Central son superficies distintas del ecosistema `brstudios.org`. Este documento gobierna solo Beat Room; no fusiona roadmaps ni trata BR STUDIOS Central como un módulo interno.

## Autoridades de Beat Room

- `beat_access`: acceso Full actual.
- `manual_payments`: pago confirmado por `user_id + beat_id`.
- `access_requests`: workflow de solicitud y revisión por `user_id + beat_id`.
- `access_revocations`: historial; no invalida ni prueba por sí mismo un acceso actual o un pago.

La regla validada es deliberadamente separada: acceso Full activo sin pago permite Full, pero bloquea MP3 y licencia; un pago histórico sin acceso activo conserva historial, pero bloquea Full, MP3 y licencia.

## Core mínimo aceptado

### Relaciones CRM

Problema: los dominios actuales no pueden declarar que una persona es artista, productor o colaborador, ni conservar varias relaciones simultáneas.

Decisión validada: `crm_relationships` referencia `profiles.id`, usa valores controlados, RLS administrativa y comando idempotente. La validación física Admin confirmó creación, consulta, reapertura y desactivación de relaciones persistentes desde Contact 360, sin alterar acceso, pagos, Auth ni `profiles.role`.

### Evidencia de cierre de 15.1

- Commercial Users abre Contact 360 correctamente.
- Contact 360 conserva `profiles.id` como identidad.
- Las relaciones explícitas pueden crearse, consultarse, reabrirse y desactivarse.
- `profiles.role` permanece aislado de las relaciones CRM.
- No se duplican `beat_access`, `manual_payments`, `access_requests`, `access_revocations` ni `commercial_activity`.
- Commercial original permanece funcional y no se detectaron regresiones.

### Oportunidades

Problema: una posibilidad comercial puede abarcar varios beats, una licencia exclusiva, una colaboración o un proyecto; `access_requests` solo representa una solicitud concreta de acceso a un beat.

Decisión: entidad lógica aceptada para 15.2, separada de `access_requests`. Tendrá identidad y ciclo propios, una persona principal, título, etapa, valor/currency opcional, cierre opcional y vínculos opcionales a solicitudes o beats. Los vínculos múltiples se agregarán solo cuando el flujo real los necesite.

### Entidades no creadas en 15.0

- `crm_contacts`: descartada por ahora; duplicaría a `profiles` para todos los actores observados.
- `orders`: diferida; no hay checkout, impuestos, facturación, múltiples items ni múltiples pagos por operación.
- `crm_notes`: diferida a seguimiento; necesita política de autoría, visibilidad y retención.
- `crm_followups`/`crm_tasks`: diferida; primero se validarán señales y flujo operativo.
- `crm_tags`: diferida; relaciones tipadas y métricas cubren la segmentación inicial.

## Inteligencia determinista

`deriveCrmPersonFoundation` organiza sin persistencia duplicada:

- relaciones inferibles `contact`, `lead` y `client`;
- solicitudes, pagos, accesos, actividad y revocaciones;
- valor histórico separado por moneda;
- beats de interés, adquiridos y con acceso vigente;
- descargas MP3 y licencias;
- última actividad;
- señales de solicitud abierta, pago pendiente y pago histórico sin acceso actual.

Estas son señales explicables. No otorgan acceso, no cambian workflows y no concluyen automáticamente intención, temperatura o prioridad humana.

## Migraciones de revisión y acceso

Los siguientes archivos existen localmente en `docs/supabase/`; su presencia no prueba que estén aplicados en Supabase:

- `access-request-review-foundation.sql`
- `access-request-user-transitions.sql`
- `access-request-reopen-initial-rejection.sql`
- `access-request-review-approved.sql`

La máquina de estados permite `pending`, `contacted`, `payment_pending`, `paid`, `fulfilled`, `approved`, `rejected`, `review_pending`, `review_approved`, `review_rejected` y `cancelled`. El flujo de revisión es `review_pending → review_approved → fulfilled`: aceptar revisión no crea `beat_access` ni `manual_payments`; “Dar acceso de nuevo” restaura solo `beat_access` y deja MP3/licencia sujetos a un pago confirmado independiente.

## Persistencia CRM por subfase

El modelo mínimo queda separado por estado real:

1. `crm_relationships(profile_id, relationship_type, created_at, created_by)` implementada y validada en 15.1.
2. `crm_opportunities(id, profile_id, title, stage, amount, currency, created_at, updated_at, closed_at)` es solo el candidato lógico para 15.2; no está implementada.
3. Notas y seguimiento solo después de validar su operación en 15.3.

Cada entidad futura deberá tener UUID, constraints explícitas, índices de claves foráneas, RLS administrativa y privilegios mínimos. No se reutilizará `marketplace_orders`: pertenece a otra superficie del proyecto Supabase compartido y no modela operaciones de Beat Room.

## Compatibilidad futura

Artist Foundation podrá extender `profiles.id` con identidad artística propia sin convertir relaciones CRM en roles Auth. Oportunidades y seguimiento podrán referenciar futuros proyectos o colaboraciones sin incorporar ahora catálogo, lanzamientos, campañas, audiencia ni Companion.

## Subfases

1. 15.0 — CRM Foundation: auditoría, contrato y selector determinista.
2. 15.1 — Contact Intelligence / Contact 360 / relaciones explícitas: completada y validada físicamente en Admin.
3. 15.2 — Opportunities: siguiente subfase `planned`; entidad comercial separada de `access_requests`, todavía sin implementación.
4. 15.3 — Seguimiento comercial: notas, tareas, siguiente acción e historial con autoría y visibilidad.
5. 15.4 — Inteligencia comercial: timeline derivado, señales, prioridades, scoring explicable y recomendaciones deterministas antes de IA avanzada.
6. Fase 16 — Automatización Comercial.
7. Fase 17 — Analytics / Intelligence.
8. Fase 18 — B.R Intelligence.
