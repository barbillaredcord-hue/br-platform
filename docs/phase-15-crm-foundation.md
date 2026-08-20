# Fase 15.0 — CRM Foundation

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

Las relaciones `contact`, `lead`, `client`, `artist`, `producer` y `collaborator` son etiquetas simultáneas, no roles excluyentes. `contact`, `lead` y `client` pueden derivarse de hechos existentes; `artist`, `producer` y `collaborator` requieren declaración explícita futura.

Si aparece el primer contacto comercial sin cuenta, se reevaluará una identidad CRM propia con vínculo opcional y único a `profiles`. No se crea antes de ese caso real.

## Core mínimo aceptado

### Relaciones CRM

Problema: los dominios actuales no pueden declarar que una persona es artista, productor o colaborador, ni conservar varias relaciones simultáneas.

Decisión: entidad lógica aceptada para 15.1. Su persistencia se diseñará cuando exista el primer comando de escritura. Debe referenciar `profiles.id`, usar valores controlados, RLS administrativa e índice por clave foránea. No altera acceso, pagos ni Auth.

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

## Schema propuesto, no migrado

Cuando cada flujo quede validado, el mínimo candidato es:

1. `crm_relationships(profile_id, relationship_type, created_at, created_by)` en 15.1.
2. `crm_opportunities(id, profile_id, title, stage, amount, currency, created_at, updated_at, closed_at)` en 15.2.
3. Notas y seguimiento solo después de validar su operación en 15.3.

Cada tabla deberá tener UUID, constraints explícitas, índices de claves foráneas, RLS administrativa y privilegios mínimos. No se reutilizará `marketplace_orders`: pertenece a otra superficie del proyecto Supabase compartido y no modela operaciones de Beat Room.

## Compatibilidad futura

Artist Foundation podrá extender `profiles.id` con identidad artística propia sin convertir relaciones CRM en roles Auth. Oportunidades y seguimiento podrán referenciar futuros proyectos o colaboraciones sin incorporar ahora catálogo, lanzamientos, campañas, audiencia ni Companion.

## Subfases

1. 15.0 — CRM Foundation: auditoría, contrato y selector determinista.
2. 15.1 — Contact Intelligence y relaciones explícitas.
3. 15.2 — Opportunities.
4. 15.3 — Notes y Follow-up.
5. 15.4 — Commercial Timeline.
6. 15.5 — CRM Dashboard.
7. 15.6 — CRM Intelligence determinista.
8. 15.7 — QA y consolidación.
