# Codex Context - B.R

Generado automaticamente por BR.autocar Documentation Engine. No editar manualmente.

## Foco técnico principal

El trabajo técnico debe proteger el producto `B.R`.
BR.autocar es infraestructura de soporte y automatización; sus cambios no deben desplazar la funcionalidad, roadmap ni continuidad principal de la app.

Foco: Consolidar el flujo Beat -> preview real -> solicitud -> pago/acceso -> descarga/licencia.

## Proyecto

- App ID: br-platform
- Producto: B.R
- Tipo: marketplace musical / plataforma privada de beats
- Fase: Fase 14D - historial administrativo y continuidad
- Avance: 96%

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

- Fase 14 M2: estados formales de orden y pago
- Aplicar/actualizar schema consolidado si se decide sincronizar docs/supabase/schema.sql con phase-14d
- Evaluar bucket privado y signed URLs
- Terminos y condiciones
- Licencias legales avanzadas
- Pagos automaticos completos
- Marketplace multiusuario

## Riesgos tecnicos / producto

- Sin datos registrados

## Validaciones recomendadas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

Ultima generacion: 2026-06-21T20:14:45
