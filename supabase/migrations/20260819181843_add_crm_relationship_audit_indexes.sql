-- Fase 15.1: índices de las referencias de auditoría requeridos por la tabla CRM.

create index if not exists crm_relationships_created_by_idx
on public.crm_relationships (created_by);

create index if not exists crm_relationships_updated_by_idx
on public.crm_relationships (updated_by);
