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
- Fase: Fase 11F-C completada / estabilidad de catalogo, usuarios y accesos
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

Ultima generacion: 2026-06-15T12:38:03

# CODEX_CONTEXT.md - B.R / br-platform

Generado por BR.autocar Documentation Engine. Mantener alineado con APP_STATE.json.

## Foco tecnico principal

El trabajo tecnico debe proteger el producto `B.R`.

B.R es el producto principal. BR.autocarmation es infraestructura de soporte, continuidad y administracion secundaria; sus cambios no deben desplazar la funcionalidad, roadmap ni continuidad principal de la app.

## Proyecto

- App ID: `br-platform`
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

## Arquitectura

- Stack: Next.js, TypeScript, Tailwind, Supabase, Vercel
- Nivel de datos: Supabase Postgres
- Backend: true
- Database: true
- Auth: true
- Storage: true
- Payments: false

## Funcionalidad ya implementada

```text
Supabase Auth
Supabase Storage
Bucket beats
Upload MP3 real
Home con beats reales
Explore / Ver todo
Favoritos
Mis Beats
Player global
Solicitudes de acceso
Contacto por WhatsApp
Aprobar/rechazar solicitudes
Dar/quitar acceso
Panel admin B.RCEO
Admin Access centrado en beat
Usuarios admin expandibles
Eliminacion de usuario/cuenta
Usuarios nuevos, existentes y admin reciben beats activos nuevos
```

## Reglas tecnicas criticas

- APP_STATE.json es la fuente principal de verdad del estado del producto.
- No instalar dependencias ni modificar package.json salvo instruccion explicita.
- Antes de editar codigo, listar archivos a crear o modificar si el cambio es amplio.
- Mantener cambios pequenos y verificables.
- Ejecutar validaciones despues de cambios.

## Regla permanente de catalogo

Nunca filtrar la visibilidad del catalogo por `beat_access`.

```text
Todo beat activo debe aparecer en el catalogo para visitantes, usuarios nuevos, usuarios existentes y admin/B.RCEO, segun la visibilidad publica prevista.
```

`beat_access` solo controla:

```text
preview/full
descarga
badges
acciones protegidas
```

Comentario recomendado cerca de queries de catalogo/acceso:

```ts
// Do not use access to filter catalog visibility.
// Access only controls playback/download/protected actions.
```

## Tarea inmediata - Fase 12

Implementar player por acceso:

```text
Si el usuario tiene acceso al beat -> reproducir full audio.
Si no tiene acceso -> reproducir preview.
Si no hay sesion -> reproducir preview.
Siguiente/anterior deben resolver acceso por beat, no reutilizar la URL anterior.
```

Debe funcionar desde:

```text
home cards
explore
beat detail
favoritos
Mis Beats
global player queue
next button
previous button
```

## Cuenta eliminada

Decision de producto:

```text
Si el usuario elimina su cuenta, se eliminan sus datos y accesos.
Si vuelve a crear una cuenta con el mismo correo, B.R no garantiza recuperar accesos anteriores.
Esta regla debe incluirse despues en terminos y condiciones.
```

## Seguridad

```text
No exponer SUPABASE_SERVICE_ROLE_KEY al cliente.
Mantener B.RCEO como unico admin real.
No permitir acciones protegidas con fallback admin.
Usar rutas server/API para operaciones privilegiadas.
```

## Pendientes despues de Fase 12

```text
Preview real de 15 segundos
Descarga controlada
Licencias descargables
Pagos automaticos
Suscripciones / freemium / watermark
Terminos y condiciones
Marketplace multiusuario
Perfiles publicos de productores/artistas
Servicios musicales
Escrow o pago protegido
Chat / rooms de colaboracion
```

## Riesgos tecnicos / producto

```text
No volver a filtrar catalogo por beat_access.
No reproducir preview por error cuando el usuario ya tiene acceso full.
No exponer service role key al cliente.
No avanzar a marketplace antes de consolidar el flujo comercial base.
```

## Validaciones recomendadas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

Ultima actualizacion: Fase 11F-C cerrada / preparacion Fase 12