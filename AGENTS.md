<!-- BEGIN:br-autocar-generated-agent-rules -->
# AGENTS.md - B.R / br-platform

Generado por BR.autocar Documentation Engine. Mantener alineado con APP_STATE.json.

## Regla critica de foco

- El foco principal es `B.R`.
- BR.autocarmation es soporte interno, infraestructura y automatizacion secundaria dentro de esta app.
- No convertir avances de BR.autocarmation en objetivo principal de esta app.
- Al retomar contexto, priorizar fase, pendientes, riesgos y proxima accion del producto.
- El flujo comercial base tiene prioridad sobre rediseño visual premium hasta completar descargas, licencias y pago/acceso.

## Proyecto

- App: `br-platform`
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

## Reglas operativas

- APP_STATE.json es la fuente principal de verdad del estado del producto.
- B.R ya esta registrada en BR.autocarmation Core v3.
- Antes de modificar codigo, listar archivos a crear o modificar cuando el cambio sea amplio.
- No tocar `package.json`, no instalar dependencias y no mover carpetas existentes salvo instruccion expresa.
- Mantener cambios pequenos, directos y verificables.
- Ejecutar validaciones despues de cambios.
- Responder en espanol y usar la menor cantidad razonable de tokens.
- Antes de cerrar una fase, revisar si deben actualizarse APP_STATE.json, PROJECT_STATUS.md, CHATGPT_CONTEXT.md, CODEX_CONTEXT.md, AGENTS.md y README.md.

## Funcionalidad lista

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

## Regla permanente de catalogo

- Todo beat activo debe aparecer en el catalogo para visitantes, usuarios nuevos, usuarios existentes y admin/B.RCEO, segun la visibilidad publica prevista.
- `beat_access` no debe filtrar la visibilidad del catalogo.
- `beat_access` solo controla preview/full, descarga, badges y acciones protegidas.

Comentario recomendado cerca de queries de catalogo/acceso:

```ts
// Do not use access to filter catalog visibility.
// Access only controls playback/download/protected actions.
```

## Regla permanente del player

- Si el usuario tiene acceso al beat, reproducir full audio.
- Si no tiene acceso, reproducir preview.
- Si no hay sesion, reproducir preview.
- Siguiente/anterior deben resolver acceso por beat, no reutilizar la URL previa.
- No romper esta regla al implementar descargas, licencias, pagos o rediseño visual.

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

Meta: permitir descarga solo cuando el usuario tiene acceso valido al beat y preparar la base para licencias descargables.

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

## Regla de cuenta eliminada

- Si un usuario elimina su cuenta, se eliminan sus datos y accesos.
- Si vuelve a crear una cuenta con el mismo correo, B.R no garantiza recuperar accesos anteriores.
- Esta regla debe incluirse despues en terminos y condiciones.

## Seguridad

- No exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.
- Mantener B.RCEO como unico admin real.
- No permitir acciones protegidas con fallback admin.
- Usar rutas server/API para operaciones privilegiadas.
- No habilitar descarga sin acceso o licencia valida.

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

## Validaciones minimas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

## Continuidad

B.R esta publicada en Vercel, conectada a Supabase real, registrada en BR.autocarmation y con Fase 12C cerrada en commit 5daddf3.

El player respeta acceso full/preview, guardados locales funcionan y el siguiente foco es consolidacion comercial.

## Proxima accion

Completar Fase 12D como checkpoint comercial y preparar Fase 12E: descargas controladas por acceso/licencia.
<!-- END:br-autocar-generated-agent-rules -->
