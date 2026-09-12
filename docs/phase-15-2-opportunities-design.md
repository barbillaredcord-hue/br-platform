# Fase 15.2 — Opportunities: contrato de dominio y diseño previo

Estado del documento: contrato aprobado e implementación en curso desde el 2026-08-21. La subfase 15.2 está `in_progress`; persistencia, seguridad y aislamiento fueron validados en Supabase real, y la UI mínima de Contact 360 está implementada y pendiente de validación física Admin autenticada.

## 1. Objetivo

Definir el contrato mínimo de una oportunidad comercial antes de implementar producto o Supabase. La entidad debe organizar una posibilidad comercial real sin reemplazar las autoridades actuales de identidad, solicitudes, pagos, acceso, revocaciones o actividad.

## 2. Definición formal

Una Opportunity es un expediente comercial administrado explícitamente, con identidad y ciclo propios, que representa una posibilidad de venta o licencia asociada a un `profile` al crearla, opcionalmente contextualizada por un beat o una solicitud de acceso. Si el profile se elimina después, la Opportunity permanece archivada y anonimizada.

Puede existir sin `access_request`, `manual_payment` o `beat_access`. Sus estados describen trabajo comercial; nunca conceden derechos, registran ingresos ni modifican workflows externos.

## 3. Límites y autoridades

| Dominio | Autoridad vigente | Uso permitido desde Opportunity |
| --- | --- | --- |
| Identidad | `profiles.id` | Requerida al crear; la FK queda nullable únicamente por eliminación posterior del profile. |
| Relaciones | `crm_relationships` | Señal o contexto; no se copia ni se altera. |
| Solicitudes y revisiones | `access_requests` | Referencia opcional; el workflow permanece independiente. |
| Acceso Full activo | `beat_access` | Contexto de lectura; nunca se concede o revoca por un estado CRM. |
| Pago confirmado | `manual_payments(user_id, beat_id)` | Prueba real de pago y precondición para cerrar una venta como ganada. |
| Historial de revocación | `access_revocations` | Contexto histórico; nunca invalida ni elimina la oportunidad. |
| Actividad histórica | `commercial_activity` | Señal para evaluación manual; no crea oportunidades automáticamente. |

Queda prohibido introducir en la entidad campos como `payment_confirmed`, `has_access`, copias de conteos históricos o cualquier bandera que compita con estas fuentes.

Opportunity no es `access_request`, `crm_relationship`, `manual_payment`, `beat_access` ni Order.

## 4. Casos reales

### Incluidos en el MVP

| Caso | Soporte propuesto |
| --- | --- |
| A. Interés repetido en un beat sin solicitud | Creación manual con `profile_id`, `beat_id` y fuente `commercial_activity` o `manual`. |
| B. Solicitud con posible venta o licencia | `access_request_id` opcional, fuente `access_request` y beat relacionado. |
| C. Recuperación comercial después de una revocación | Fuente `revocation` y beat opcional; no restaura acceso. |
| D. Cliente que podría adquirir otro beat | Fuente `existing_customer` y nuevo beat opcional. |
| E. Oportunidad identificada en Contact 360 | Creación manual para el `profile`; Contact 360 es superficie de entrada, no autoridad ni fuente separada. |
| F. Relación CRM que sugiere negocio futuro | Fuente `relationship`; la creación sigue siendo manual y la oportunidad sobrevive a la desactivación de la relación. |
| G. Interés general sin beat concreto | `beat_id` nullable y objetivo expresado en título/resumen. |

### Diferidos

- Una sola oportunidad con varios beats o items.
- Leads sin cuenta y una identidad `crm_contacts` separada.
- Creación automática por plays, favoritos, solicitudes, relaciones o actividad.
- Orders, checkout, facturación, impuestos y pagos múltiples.
- Owner multiagente, asignaciones, tareas, recordatorios y seguimiento detallado.
- Notas múltiples, etiquetas, archivos, productos no musicales e historial completo de cambios.

Si aparecen varios beats antes de justificar `opportunity_items`, se crean oportunidades separadas o una oportunidad general sin beat.

## 5. Identidad y relaciones

- `id`: UUID propio. La Opportunity tiene identidad independiente de cualquier solicitud o pago.
- `profile_id`: UUID requerido por `createOpportunity`, pero nullable en persistencia con `ON DELETE SET NULL`. Todos los actores comerciales actuales tienen profile; `null` representa exclusivamente historial anonimizado después de eliminarlo y no una vía para crear leads externos.
- `beat_id`: UUID nullable hacia `beats.id`. Cubre oportunidades específicas y generales sin crear items prematuramente.
- `access_request_id`: UUID nullable hacia `access_requests.id`. Conserva el contexto explícito del caso B sin convertir la solicitud en CRM.

Reglas de comando futuras:

- Si existe `access_request_id`, la solicitud debe pertenecer al mismo `profile_id`.
- Si Opportunity y solicitud tienen beat, ambos deben coincidir.
- Una solicitud puede originar como máximo una Opportunity en el MVP.
- Eliminar un beat o una solicitud puede limpiar su referencia, pero no debe borrar la Opportunity.
- Antes de borrar un profile, sus Opportunities activas se archivan; después `ON DELETE SET NULL` anonimiza `profile_id` sin copiar email, username, nombre o snapshots personales.
- El primer lead real sin cuenta obliga a revisar la identidad de creación; no autoriza usar `profile_id = null` ni crear `crm_contacts` anticipadamente.

## 6. Contrato mínimo de campos

| Campo | Tipo conceptual | Nullability | Autoridad y propósito | Decisión |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | required | Identidad propia de Opportunity. | MVP |
| `profile_id` | `uuid` | required al crear; nullable por retención | Referencia al actor identificado por `profiles`; `null` solo después de eliminar el profile. | MVP |
| `title` | `text` | required | Objetivo comercial legible y breve. | MVP |
| `status` | `text` con check | required | Etapa del expediente comercial, no acceso ni pago. | MVP |
| `source` | `text` con check | required | Razón comercial que originó la evaluación manual. | MVP |
| `beat_id` | `uuid` | nullable | Contexto de un beat específico; no representa item vendido. | MVP |
| `access_request_id` | `uuid` | nullable | Trazabilidad hacia una solicitud concreta. | MVP |
| `estimated_value` | `numeric(12,2)` | nullable | Potencial estimado; nunca ingreso confirmado. | MVP |
| `currency` | `text` ISO 4217 | nullable condicional | Moneda del estimado; existe solo junto con valor. | MVP |
| `summary` | `text` | nullable | Contexto breve del objetivo. No sustituye notas históricas. | MVP |
| `created_at` | `timestamptz` | required | Inicio del expediente. | MVP |
| `updated_at` | `timestamptz` | required | Última modificación del expediente. | MVP |
| `closed_at` | `timestamptz` | nullable condicional | Fecha de cierre ganado o perdido. | MVP |
| `archived_at` | `timestamptz` | nullable | Retiro de vistas operativas sin borrado físico. | MVP |
| `created_by` | `uuid` | nullable | Admin que creó el registro; no es owner comercial. | MVP |
| `updated_by` | `uuid` | nullable | Último admin que lo modificó. | MVP |
| `priority` | `text` | nullable | Orden de atención. Pertenece mejor al seguimiento. | 15.3 |
| `owner_id` | `uuid` | nullable | Responsable asignado. No aporta valor inmediato con operación administrativa limitada. | Diferido |
| `next_action_at` | `timestamptz` | nullable | Fecha de seguimiento o tarea. | 15.3 |
| `notes` | texto o entidad propia | nullable | Historial narrativo múltiple. `summary` cubre el contexto mínimo. | Diferido |

Validaciones sugeridas para el MVP:

- `title` normalizado, entre 3 y 160 caracteres.
- `summary` con máximo razonable, por ejemplo 2,000 caracteres.
- `estimated_value` mayor o igual a cero cuando exista.
- `currency` exactamente tres letras mayúsculas y presente solo si existe `estimated_value`.
- `closed_at` requerido únicamente para estados cerrados.
- `archived_at` es ortogonal a la etapa comercial.

## 7. State machine propuesta

Estados:

- `open`: posibilidad identificada, todavía no validada comercialmente.
- `qualified`: existe intención, encaje o siguiente conversación comercial verificable.
- `proposal`: existe una propuesta o condición comercial concreta presentada.
- `closed_won`: la venta quedó confirmada por un `manual_payment` relacionado.
- `closed_lost`: la oportunidad terminó sin venta por decisión explícita.

Transiciones:

```text
open <-> qualified <-> proposal
  |          |           |
  +----------+-----------+--> closed_lost
             +---------------> closed_won

closed_won  --reopen--> open
closed_lost --reopen--> open
```

Reglas:

- Crear una oportunidad significa iniciar un expediente en `open`; no significa solicitud, acceso o pago.
- La calificación es una decisión administrativa explícita, no un cálculo automático.
- `closed_won` requiere que el comando confirme un `manual_payment` del mismo `profile_id` y `beat_id`.
- Una oportunidad general sin beat debe asociarse primero a un beat/pago inequívoco antes de declararse ganada en el MVP.
- El estado `closed_won` no es prueba autónoma de pago. Revenue siempre se calcula desde `manual_payments`.
- Registrar un pago no cambia automáticamente la Opportunity; habilita un cierre explícito y verificable.
- Conceder Full sin pago no gana la oportunidad y no altera su estado.
- Revocar o restaurar acceso no cambia ni elimina la Opportunity.
- Reabrir es una acción Admin explícita que vuelve a `open` y limpia `closed_at`; no borra pagos, accesos ni historial externo.

Esta elección aplica la variante estricta: una venta solo puede cerrarse como ganada cuando existe pago confirmado. Si en el futuro se modelan objetivos no monetarios, deberán usar otro tipo de entidad o una semántica explícita distinta; no se amplía `closed_won` ambiguamente.

## 8. Origen de la oportunidad

Fuentes MVP:

- `manual`
- `access_request`
- `commercial_activity`
- `relationship`
- `existing_customer`
- `revocation`
- `other`

`contact_360` no se recomienda como fuente porque es una superficie de UI. Una oportunidad identificada allí usa la evidencia comercial correspondiente o `manual`.

Reglas:

- Ninguna fuente crea automáticamente una oportunidad.
- `source = access_request` puede conservar `access_request_id`.
- `source = other` debe exigir un `summary` suficiente en el comando futuro.
- `relationship`, `commercial_activity` y `revocation` son motivos de evaluación manual; sus datos no se copian en la fila.
- Futuras señales pueden sugerir una acción en Admin, pero requieren confirmación humana para crear el expediente.

## 9. Valor comercial

`estimated_value` y `currency` entran en el MVP porque permiten ordenar y medir pipeline sin crear Orders.

Reglas de separación:

- `estimated_value` es potencial editable, no dinero recibido.
- `manual_payments.amount` es ingreso confirmado.
- El pipeline se suma por moneda; no se mezclan MXN, USD u otras monedas en un total sin conversión explícita.
- Contact 360 y Commercial Users deben etiquetar estos valores como “estimado” o “potencial”.
- Ningún dashboard puede incluir `estimated_value` en revenue, ventas confirmadas o pagos.

## 10. Owner y siguiente acción

`owner_id` se difiere: la operación actual es administrativa y no justifica asignación multiagente. `created_by` y `updated_by` bastan para responsabilidad técnica mínima.

`next_action_at` se difiere a 15.3 — Seguimiento comercial. 15.2 crea y clasifica la oportunidad; 15.3 podrá añadir tareas, responsables, prioridad, fechas y recordatorios con un contrato propio.

## 11. Integración mínima con Admin

### Contact 360

La UI implementada consume el read model de Opportunities y muestra, sin convertirse en fuente de verdad:

- conteo de oportunidades abiertas y cerradas;
- lista de oportunidades activas;
- estado, título, valor estimado y moneda;
- beat relacionado cuando exista;
- valor potencial agrupado por moneda;
- cierre ganado o perdido.

La creación manual se inicia desde Contact 360 usando su `profile_id`, pero el registro se guarda exclusivamente en `crm_opportunities`. La misma superficie permite editar campos acotados, aplicar transiciones válidas, reabrir y archivar mediante los comandos server-side existentes. Las oportunidades cerradas y archivadas se separan de las activas; las archivadas no participan en métricas y permanecen colapsadas por defecto.

### Commercial Users

En una etapa posterior puede complementar cada perfil con:

- oportunidades abiertas;
- pipeline estimado por moneda;
- última oportunidad actualizada;
- conteos `closed_won` y `closed_lost`.

Estos datos son derivados. Pagos, accesos, solicitudes y revocaciones continúan consultando sus autoridades actuales.

## 12. Seguridad implementada en la base

Todas las operaciones del MVP deben ser Admin only:

| Operación | Protección vigente |
| --- | --- |
| Read/list/detail | Admin autenticado. |
| Create | Admin autenticado y validación de profile/contexto. |
| Update | Admin autenticado; campos permitidos de forma explícita. |
| Change status/close/reopen | Comando Admin que valide transiciones y precondición de pago para `closed_won`. |
| Archive/unarchive | Admin autenticado; sin borrado físico. |
| Delete | Sin política ni operación de producto en el MVP. |

Modelo aplicado por la migración canónica y validado en Supabase real:

- revocar todo a `anon`;
- conceder solo `select`, `insert` y `update` a `authenticated`;
- habilitar RLS;
- políticas separadas Admin usando `(select private.is_br_admin())`;
- no exponer lectura al propietario del `profile` en 15.2;
- validar transiciones y referencias en comandos server-side, no solo en React;
- no usar service role como sustituto de RLS en los endpoints ordinarios.

## 13. Archive, anonimización y auditoría

No se recomienda delete físico. `archived_at` retira una oportunidad de las vistas operativas y conserva trazabilidad. `closed_lost` expresa resultado comercial; no equivale a archivada.

La eliminación de usuario archiva primero las Opportunities cuyo `archived_at` sea null. Luego las FKs `ON DELETE SET NULL` eliminan `profile_id`, `created_by` o `updated_by` cuando correspondan. El registro conserva sus datos comerciales no personales y se presenta como “Perfil eliminado”; no se reconstruye identidad ni se guardan snapshots compensatorios.

Para el MVP bastan:

- `created_at`, `created_by`;
- `updated_at`, `updated_by`;
- `closed_at`;
- `archived_at`.

Esto no reconstruye todas las transiciones. Un historial detallado de etapas, comentarios o eventos se difiere hasta demostrar necesidad. `admin_change_logs` no se reutiliza automáticamente como almacenamiento CRM.

## 14. Métricas deterministas futuras

Derivables desde `crm_opportunities`:

- oportunidades activas: `open`, `qualified`, `proposal`, no archivadas;
- oportunidades calificadas;
- propuestas;
- cerradas ganadas y perdidas;
- pipeline estimado activo por moneda;
- tasa de conversión: `closed_won / (closed_won + closed_lost)`;
- oportunidades por fuente;
- oportunidades por beat y por profile;
- antigüedad y última actualización.

Separación obligatoria:

- Pipeline/potencial: `crm_opportunities.estimated_value`.
- Revenue real: suma exclusiva de `manual_payments.amount`, agrupada por moneda.

## 15. Matriz conceptual de pruebas

| Caso | Resultado esperado |
| --- | --- |
| Crear manual para profile existente | Se crea `open`; no cambia ninguna autoridad externa. |
| Opportunity con beat | Guarda referencia nullable al beat; no concede acceso. |
| Opportunity sin beat | Válida para interés general. |
| Usuario con access request sin Opportunity | Continúa válido; no hay creación automática. |
| Opportunity sin access request | Continúa válida. |
| Opportunity + `beat_access` sin pago | Puede permanecer activa; pipeline no es revenue y no puede cerrar `closed_won`. |
| Opportunity + `manual_payment` relacionado | El pago habilita cierre explícito `closed_won`; el ingreso se lee del pago. |
| Opportunity `closed_lost` | No revoca Full, no cancela solicitudes y no altera pagos. |
| Opportunity `closed_won` | No crea `beat_access` ni modifica la solicitud. |
| Revocar `beat_access` | No cambia ni elimina la Opportunity. |
| Desactivar `crm_relationships` | No cambia ni elimina la Opportunity. |
| Usuario con varias oportunidades | Soportado mediante varios UUID y títulos independientes. |
| Reabrir oportunidad cerrada | Vuelve a `open`, limpia `closed_at` y conserva autoridades externas. |
| Archivar oportunidad | Sale de vistas operativas; permanece consultable en historial. |
| Intento no Admin | RLS/comando lo rechaza. |

## 16. Persistencia implementada localmente

Nombre definitivo: `public.crm_opportunities`. El prefijo evita colisión con otras superficies del proyecto Supabase compartido.

La definición canónica está en `supabase/migrations/20260821145003_phase_15_2_crm_opportunities.sql`, con copia documental en `docs/supabase/phase-15_2-crm-opportunities.sql`. Fue aplicada en Supabase real el 2026-08-21 y quedó registrada en el historial remoto como `20260821170623_phase_15_2_crm_opportunities`. El contrato central es:

```sql
create table public.crm_opportunities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  beat_id uuid references public.beats(id) on delete set null,
  access_request_id uuid references public.access_requests(id) on delete set null,
  title text not null,
  status text not null default 'open',
  source text not null default 'manual',
  estimated_value numeric(12,2),
  currency text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  constraint crm_opportunities_profile_retention_check
    check (profile_id is not null or archived_at is not null),
  constraint crm_opportunities_title_check
    check (title = btrim(title) and char_length(title) between 3 and 160),
  constraint crm_opportunities_status_check
    check (status in ('open', 'qualified', 'proposal', 'closed_won', 'closed_lost')),
  constraint crm_opportunities_source_check
    check (source in ('manual', 'access_request', 'commercial_activity', 'relationship', 'existing_customer', 'revocation', 'other')),
  constraint crm_opportunities_value_check
    check (
      (estimated_value is null and currency is null)
      or (estimated_value >= 0 and currency ~ '^[A-Z]{3}$')
    ),
  constraint crm_opportunities_closed_at_check
    check (
      (status in ('open', 'qualified', 'proposal') and closed_at is null)
      or (status in ('closed_won', 'closed_lost') and closed_at is not null)
    ),
  constraint crm_opportunities_request_source_check
    check (access_request_id is null or source = 'access_request')
);
```

Índices conceptuales:

```sql
create index crm_opportunities_profile_id_idx
  on public.crm_opportunities (profile_id);

create index crm_opportunities_beat_id_idx
  on public.crm_opportunities (beat_id)
  where beat_id is not null;

create unique index crm_opportunities_access_request_id_key
  on public.crm_opportunities (access_request_id)
  where access_request_id is not null;

create index crm_opportunities_active_profile_updated_idx
  on public.crm_opportunities (profile_id, updated_at desc)
  where archived_at is null
    and status in ('open', 'qualified', 'proposal');

create index crm_opportunities_created_by_idx
  on public.crm_opportunities (created_by);

create index crm_opportunities_updated_by_idx
  on public.crm_opportunities (updated_by);
```

La migración es transaccional e idempotente donde corresponde, habilita RLS Admin, no concede DELETE y agrega un trigger de contrato para transiciones y `closed_won`. El comando server-side y el trigger consultan `manual_payments`; ninguna de las dos capas crea pagos.

## 17. Decisiones MVP

- Entidad: `crm_opportunities`.
- Identidad: UUID propio; `profile_id` obligatorio al crear y nullable solo después de eliminar el profile.
- Producto: cero o un `beat_id`.
- Solicitud: `access_request_id` nullable y único cuando exista.
- Creación: exclusivamente manual por Admin.
- Etapas: `open`, `qualified`, `proposal`, `closed_won`, `closed_lost`.
- Ganada: requiere pago confirmado relacionado, pero no se sincroniza automáticamente.
- Potencial: `estimated_value` + `currency`, claramente separado de revenue.
- Contexto: `title`, `summary`, `source`.
- Trazabilidad mínima: timestamps y admins creadores/actualizadores.
- Retiro: `archived_at`, sin delete físico.

## 18. Decisiones diferidas

- `opportunity_items` y múltiples beats.
- `crm_contacts` para leads sin cuenta.
- Orders y operación financiera avanzada.
- `owner_id`, `priority` y `next_action_at`.
- Tareas, recordatorios, notas múltiples, tags y archivos.
- Automatizaciones y sugerencias inteligentes.
- Historial detallado de transiciones.
- Tipos de oportunidad no monetarios y una semántica de éxito distinta de venta confirmada.

## 19. Riesgos

- Confundir `closed_won` con fuente de pago. Mitigación: precondición server-side y revenue exclusivo desde `manual_payments`.
- Confundir valor estimado con ingreso. Mitigación: nombres, etiquetas y métricas separadas por moneda.
- Crear ruido por automatización prematura. Mitigación: creación manual en el MVP.
- Duplicar workflows de `access_requests`. Mitigación: referencia opcional sin transiciones cruzadas.
- Duplicar acceso en CRM. Mitigación: ninguna mutación de `beat_access` desde Opportunity.
- Forzar múltiples beats demasiado pronto. Mitigación: `beat_id` nullable y un solo beat por registro.
- No poder representar leads externos. Mitigación: riesgo aceptado hasta el primer caso real sin profile.
- Dejar historial sin identidad al eliminar perfiles. Decisión aprobada: archivar, aplicar `ON DELETE SET NULL` y mostrar “Perfil eliminado”, sin guardar datos personales compensatorios.
- Basarse en `docs/supabase/schema.sql` como snapshot completo. Las migraciones incrementales y el esquema remoto deben revisarse antes de crear la migración real.

## 20. Comparación entre código y documentación actual

Estado verificado después de iniciar implementación:

- Existe implementación de `crm_opportunities`; 15.2 está `in_progress` y la migración remota fue aplicada y validada con transacciones revertidas.
- Contact 360 compone las autoridades existentes e incorpora una UI mínima aislada de Opportunities con resumen, pipeline estimado por moneda, listas activas/cerradas/archivadas y acciones controladas.
- `crm_relationships` mantiene su contrato independiente y no es modificada por los comandos de Opportunity.
- `src/lib/commercial/analytics.ts` conserva su cálculo genérico; las métricas nuevas de pipeline viven en el dominio CRM y no representan revenue.

Discrepancias resueltas:

- `payment_pending` y `review_approved` usan una regla compartida de proceso comercial abierto en los read models CRM.
- `src/lib/commercial-access.ts` clasifica `review_approved` explícitamente sin inferir acceso ni pago.
- La entidad usa formalmente `status` y `estimated_value`; no usa `stage` ni `amount`.

Deuda conservada fuera del alcance:

- `docs/supabase/schema.sql` es un esquema base y no contiene todos los deltas incrementales actuales; la migración canónica permanece en `supabase/migrations/`.

## 21. Estado de criterios de implementación

La base local y remota cubre definición, campos, estados, fuentes, RLS, comandos y pruebas de aislamiento. Se validaron state machine, `closed_won` con y sin pago real, archive, anonimización y permisos Admin/no Admin/anon sin dejar datos de prueba. La UI mínima ya está integrada y sus helpers, contratos y build están validados técnicamente. Antes de declarar 15.2 completada todavía se requiere:

1. Probar físicamente la eliminación de una cuenta de prueba con Opportunities para confirmar el flujo completo de archive + anonimización; la FK y el check ya fueron validados sin borrar usuarios reales.
2. Validar físicamente con sesión Admin la creación, edición, transiciones, cierre, reapertura y archive desde Contact 360.
3. Confirmar físicamente que `closed_won` falla sin pago, funciona con `manual_payments` real y no convierte el pipeline estimado en revenue.
4. Mantener pipeline estimado y revenue real separados en cualquier read model o dashboard.
5. Completar la validación física Admin antes de cambiar 15.2 a `completed` o avanzar a 15.3.
