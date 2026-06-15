# Codex Context - B.R

Generado automaticamente por BR.autocar Documentation Engine. No editar manualmente.

## Foco técnico principal

El trabajo técnico debe proteger el producto `B.R`.
BR.autocar es infraestructura de soporte y automatización; sus cambios no deben desplazar la funcionalidad, roadmap ni continuidad principal de la app.

Foco: Consolidar el flujo Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia.

## Proyecto

- App ID: br-platform
- Producto: B.R
- Tipo: Marketplace musical / plataforma privada de beats
- Fase: Fase 11D completada / produccion inicial
- Avance: 70%

## Arquitectura

- Stack: Next.js, TypeScript, Tailwind, Supabase, Vercel
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

- Preview real de 15 segundos
- Guardar beat / favoritos
- Pagos
- Licencias descargables
- Descargas controladas por tipo de licencia
- Marketplace multiusuario
- Perfiles publicos de productores/artistas
- Servicios musicales
- Escrow o pago protegido

## Riesgos tecnicos / producto

- Sin datos registrados

## Validaciones recomendadas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

Ultima generacion: 2026-06-15T12:17:26
