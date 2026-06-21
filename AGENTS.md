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
- Fase actual: Fase 14D - historial administrativo y continuidad
- Avance: 96%

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

Sin contexto registrado

## Proxima accion

Disenar estados formales de orden/pago sobre access_requests u ordenes dedicadas, manteniendo beat_access como permiso real.
<!-- END:br-autocar-generated-agent-rules -->
