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

La regla actual es beat_access para Full y manual_payments para compra confirmada: Full sin pago bloquea MP3/licencia; pago historico sin beat_access no restaura derechos. review_approved no concede acceso ni pago; Dar acceso de nuevo solo restaura beat_access. Los cuatro SQL de revision existen como archivos locales y no se documentan como aplicados remotamente. Para desarrollo local puede usarse npm run dev -- -p 3100; PM2 con npm start en 3100 es operacion local de br-platform, no regla global de BR STUDIOS Central. 15.1 mantiene su gate fisico Admin.

## Proxima accion

Con navegador y sesion Admin, abrir Commercial Users, validar Contact 360 real, crear/reabrir/desactivar relaciones y confirmar que Commercial original y profiles.role permanecen intactos.
<!-- END:br-autocar-generated-agent-rules -->
