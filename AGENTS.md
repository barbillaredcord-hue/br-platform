<!-- BEGIN:br-autocar-generated-agent-rules -->
# AGENTS.md - B.R

Generado automaticamente por BR.autocar Documentation Engine. No editar manualmente.

## Regla crítica de foco

- El foco principal es `B.R`.
- BR.autocar es soporte interno, infraestructura y automatización secundaria dentro de esta app.
- No convertir avances de BR.autocar en objetivo principal de esta app.
- Al retomar contexto, priorizar fase, pendientes, riesgos y próxima acción del producto.

## Proyecto

- App: `br-platform`
- Producto: B.R
- Tipo: marketplace musical / plataforma privada de beats
- Fase actual: Fase 15 - Motor Comercial Inteligente / CRM
- Avance: 12%

## Reglas operativas

- APP_STATE.json es la fuente unica de verdad.
- Toda documentacion derivada debe regenerarse con `./scripts/br-sync-docs`.
- No editar manualmente PROJECT_STATUS.md, CHANGELOG.md, CHATGPT_CONTEXT.md, CODEX_CONTEXT.md, AGENTS.md, CLAUDE.md ni README.md.
- Antes de modificar codigo, listar archivos a crear o modificar.
- No tocar `package.json`, no instalar dependencias y no mover carpetas existentes salvo instruccion expresa.
- Mantener cambios pequenos, directos y verificables.
- Ejecutar validaciones despues de cambios.
- Responder en espanol y usar la menor cantidad razonable de tokens.

## Validaciones minimas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

## Continuidad

15.1: migraciones crm_relationships e indices de auditoria aplicadas remotamente; RLS y comando idempotente se validaron en transaccion revertida (admin una fila activa, usuario normal cero updates). Suite local 91/91, lint, TypeScript, build y diff-check pasan. No existe navegador conectado para la validacion fisica.

## Proxima accion

Con navegador y sesion Admin, abrir Commercial Users, validar Contact 360 real, crear/reabrir/desactivar relaciones y confirmar que Commercial original y profiles.role permanecen intactos.
<!-- END:br-autocar-generated-agent-rules -->
