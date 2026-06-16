# CODEX_CONTEXT.md - B.R / br-platform

Generado por BR.autocar Documentation Engine. Mantener alineado con APP_STATE.json.

## Foco tecnico principal

El trabajo tecnico debe proteger el producto `B.R`.

B.R es el producto principal. BR.autocarmation es infraestructura de soporte, continuidad y administracion secundaria; sus cambios no deben desplazar la funcionalidad, roadmap ni continuidad principal de la app.

## Proyecto

- App ID: `br-platform`
- Producto: B.R
- Tipo: Marketplace musical / plataforma privada de beats
- Fase actual: Fase 12D en progreso / checkpoint comercial y continuidad
- Estado: in_progress
- Avance: 85%
- Ultimo commit funcional: 5daddf3 Complete phase 12C saved beats and player controls
- Siguiente fase: Fase 12E - descargas controladas por acceso/licencia

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
Guardados locales
/account/saved conectado a guardados reales
Mis Beats
Player global
Player full/preview por acceso real
Siguiente/anterior del player respeta acceso por beat
Space play/pause en player
Barra del player clickeable/seekable
Solicitudes de acceso
Contacto por WhatsApp
Aprobar/rechazar solicitudes
Dar/quitar acceso
Panel admin B.RCEO
Admin Access centrado en beat
Usuarios admin expandibles
Eliminacion de usuario/cuenta
Usuarios nuevos, existentes y admin reciben beats activos nuevos
Scroll horizontal Safari-safe en BeatRow
```

## Reglas tecnicas criticas

- APP_STATE.json es la fuente principal de verdad del estado del producto.
- No instalar dependencias ni modificar package.json salvo instruccion explicita.
- Antes de editar codigo, listar archivos a crear o modificar si el cambio es amplio.
- Mantener cambios pequenos y verificables.
- Ejecutar validaciones despues de cambios.
- No mezclar logica principal de B.R con infraestructura de BR.autocarmation.

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

## Regla permanente del player

```text
Si el usuario tiene acceso al beat -> reproducir full audio.
Si no tiene acceso -> reproducir preview.
Si no hay sesion -> reproducir preview.
Siguiente/anterior deben resolver acceso por beat, no reutilizar la URL anterior.
No romper esta regla al implementar descargas, licencias, pagos o rediseño visual.
```

Debe funcionar desde:

```text
home cards
explore
beat detail
guardados
Mis Beats
global player queue
next button
previous button
```

## Fase 12E propuesta - Descargas controladas

Meta:
Permitir descarga solo cuando el usuario tiene acceso valido al beat y preparar la base para licencias descargables.

Alcance inicial:

```text
Boton Descargar visible solo si el usuario tiene acceso valido.
Validacion de acceso antes de habilitar descarga.
No usar beat_access para filtrar catalogo.
Mantener preview/full playback separado de descarga.
Preparar modelo para licencia futura sin implementar pagos aun.
```

Fuera de alcance inicial:

```text
Pagos automaticos.
Marketplace multiusuario.
Licencias PDF avanzadas.
Escrow o pago protegido.
Rediseño visual premium.
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
No habilitar descarga sin acceso o licencia valida.
```

## Pendientes despues de Fase 12D

```text
Fase 12E: descargas controladas por acceso/licencia
Preview real de 15 segundos
Licencias descargables
Pagos automaticos
Suscripciones / freemium / watermark
Terminos y condiciones
Marketplace multiusuario
Perfiles publicos de productores/artistas
Servicios musicales
Escrow o pago protegido
Chat / rooms de colaboracion
Diseño visual premium despues del flujo comercial base
```

## Riesgos tecnicos / producto

```text
No volver a filtrar catalogo por beat_access.
No romper player full/preview por acceso.
No habilitar descarga sin acceso/licencia valida.
No exponer service role key al cliente.
No avanzar a marketplace antes de consolidar el flujo comercial base.
```

## Validaciones recomendadas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

Ultima actualizacion: Fase 12D en progreso / checkpoint comercial y continuidad