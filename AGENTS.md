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

15.2 Opportunities tiene persistencia real y UI minima integrada en Contact 360. La UI separa activas, cerradas y archivadas, muestra pipeline estimado por moneda y reutiliza comandos server-side para crear, editar, transicionar y archivar. closed_won sigue sujeto a manual_payments real. Falta la validacion fisica Admin autenticada antes de cerrar 15.2.

## Proxima accion

Ejecutar con sesion Admin el flujo fisico de crear, editar, transicionar, cerrar, reabrir y archivar Opportunities en Contact 360; comprobar tambien el rechazo de closed_won sin pago y el cierre con manual_payments real. No avanzar a 15.3.
<!-- END:br-autocar-generated-agent-rules -->
