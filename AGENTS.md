<!-- BEGIN:br-autocar-generated-agent-rules -->
# AGENTS.md - B.R / br-platform

Generado por BR.autocar Documentation Engine. Mantener alineado con APP_STATE.json.

## Regla critica de foco

- El foco principal es `B.R`.
- BR.autocarmation es soporte interno, infraestructura y automatizacion secundaria dentro de esta app.
- No convertir avances de BR.autocarmation en objetivo principal de esta app.
- Al retomar contexto, priorizar fase, pendientes, riesgos y proxima accion del producto.

## Proyecto

- App: `br-platform`
- Producto: B.R
- Tipo: Marketplace musical / plataforma privada de beats
- Fase actual: Fase 11F-C completada / estabilidad de catalogo, usuarios y accesos
- Avance: 80%
- Siguiente fase: Fase 12 - player por acceso y preview real

## Meta principal

Consolidar el flujo comercial base antes de expandir a marketplace multiusuario:

```text
Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia
```

## Reglas operativas

- APP_STATE.json es la fuente principal de verdad del estado del producto.
- B.R ya esta registrada en BR.autocarmation Core v3.
- Antes de modificar codigo, listar archivos a crear o modificar cuando el cambio sea amplio.
- No tocar `package.json`, no instalar dependencias y no mover carpetas existentes salvo instruccion expresa.
- Mantener cambios pequenos, directos y verificables.
- Ejecutar validaciones despues de cambios.
- Responder en espanol y usar la menor cantidad razonable de tokens.

## Regla permanente de catalogo

- Todo beat activo debe aparecer en el catalogo para visitantes, usuarios nuevos, usuarios existentes y admin/B.RCEO, segun la visibilidad publica prevista.
- `beat_access` no debe filtrar la visibilidad del catalogo.
- `beat_access` solo controla preview/full, descarga, badges y acciones protegidas.

Comentario recomendado cerca de queries de catalogo/acceso:

```ts
// Do not use access to filter catalog visibility.
// Access only controls playback/download/protected actions.
```

## Regla de player para Fase 12

Pendiente inmediato:

- Si el usuario tiene acceso al beat, reproducir full audio.
- Si no tiene acceso, reproducir preview.
- Si no hay sesion, reproducir preview.
- Siguiente/anterior deben resolver acceso por beat, no reutilizar la URL previa.

## Regla de cuenta eliminada

- Si un usuario elimina su cuenta, se eliminan sus datos y accesos.
- Si vuelve a crear una cuenta con el mismo correo, B.R no garantiza recuperar accesos anteriores.
- Esta regla debe incluirse despues en terminos y condiciones.

## Seguridad

- No exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.
- Mantener B.RCEO como unico admin real.
- No permitir acciones protegidas con fallback admin.
- Usar rutas server/API para operaciones privilegiadas.

## Validaciones minimas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

## Continuidad

B.R esta publicada en Vercel, conectada a Supabase real y registrada en BR.autocarmation.

## Proxima accion

Implementar Fase 12: player full si el usuario tiene acceso, preview si no tiene acceso, siguiente/anterior por acceso y base de preview real de 15 segundos.
<!-- END:br-autocar-generated-agent-rules -->
