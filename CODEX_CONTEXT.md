# Codex Context - B.R

Generado automaticamente por BR.autocar Documentation Engine. No editar manualmente.

## Foco técnico principal

El trabajo técnico debe proteger el producto `B.R`.
BR.autocar es infraestructura de soporte y automatización; sus cambios no deben desplazar la funcionalidad, roadmap ni continuidad principal de la app.

Foco: Construir Fase 15 - Motor Comercial Inteligente / CRM como conocimiento organizado sobre personas, relaciones, oportunidades y seguimiento, sin duplicar las autoridades de Beat Room.

## Proyecto

- App ID: br-platform
- Producto: B.R
- Tipo: marketplace musical / plataforma privada de beats
- Fase: Fase 15 - Motor Comercial Inteligente / CRM
- Avance: 12%

## Arquitectura

- Stack: Next.js App Router, TypeScript, Tailwind, Supabase, Vercel, Cloudflare DNS, Resend
- Nivel de datos: Supabase Postgres
- Backend: True
- Database: True
- Auth: True
- Payments: False

## Reglas tecnicas

- APP_STATE.json es la fuente unica de verdad.
- Los documentos `.md` son derivados.
- No editar documentacion generada manualmente.
- No instalar dependencias ni modificar package.json salvo instruccion explicita.
- Antes de editar codigo, listar archivos a crear o modificar.
- Mantener cambios pequenos y verificables.

## Tareas pendientes

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

## Riesgos tecnicos / producto

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

## Validaciones recomendadas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

Ultima generacion: 2026-08-19T12:44:28
