# CHATGPT_CONTEXT.md - B.R / br-platform

Generado por BR.autocar Documentation Engine. Mantener alineado con APP_STATE.json.

## Foco principal al retomar sesion

El foco principal de esta sesion debe ser `B.R`, no BR.autocarmation.

B.R es el producto principal. BR.autocarmation dentro de esta app es infraestructura de soporte, continuidad y administracion secundaria; no debe sustituir la meta del producto.

## Resumen del proyecto

`br-platform` es `B.R`.

Tipo: Marketplace musical / plataforma privada de beats.

Vision:
Convertir B.R en un marketplace musical para productores, musicos, beatmakers, DJs, artistas e ingenieros.

Posicionamiento:
Plataforma musical premium, privada y escalable con enfoque en acceso controlado, licencias y colaboracion.

## Meta principal

Consolidar el flujo comercial base antes de expandir a marketplace multiusuario:

```text
Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia
```

## Estado actual

- Fase: Fase 12D en progreso / checkpoint comercial y continuidad
- Estado: in_progress
- Avance: 85%
- Backend: Supabase real
- Deploy: Vercel
- BR.autocarmation: B.R ya registrada en Core v3
- Ultimo commit funcional: 5daddf3 Complete phase 12C saved beats and player controls
- Siguiente fase: Fase 12E - descargas controladas por acceso/licencia
- Siguiente accion: Definir e implementar descargas controladas sin romper catalogo, player full/preview por acceso ni reglas de seguridad.

## Funcionalidad lista

```text
Supabase Auth
Supabase Storage
Bucket beats
MP3 reales
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
Admin B.RCEO
Admin Access centrado en beat
Usuarios admin expandibles
Eliminacion de usuario/cuenta
Usuarios nuevos, existentes y admin reciben beats activos nuevos
Scroll horizontal Safari-safe en BeatRow
```

## Regla permanente de catalogo

```text
Todo beat activo debe aparecer en el catalogo para visitantes, usuarios nuevos, usuarios existentes y admin/B.RCEO, segun la visibilidad publica prevista.

beat_access no debe filtrar la visibilidad del catalogo.

beat_access solo controla:
- preview/full
- descarga
- badges
- acciones protegidas
```

## Regla permanente del player

```text
Si el usuario tiene acceso al beat -> reproducir full audio.
Si no tiene acceso -> reproducir preview.
Si no hay sesion -> reproducir preview.
Siguiente/anterior deben resolver acceso por beat, no reutilizar la URL anterior.
No romper esta regla al implementar descargas, licencias, pagos o rediseño visual.
```

## Regla de cuenta eliminada

```text
Si un usuario elimina su cuenta, se eliminan sus datos y accesos.
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

## Pendiente principal

```text
Fase 12D: checkpoint comercial y continuidad
Fase 12E: descargas controladas por acceso/licencia
Preview real de 15 segundos
Licencias descargables
Pagos automaticos
Suscripciones / freemium / watermark
Terminos y condiciones
Marketplace multiusuario
Chat / rooms de colaboracion
Diseño visual premium despues del flujo comercial base
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

## Validaciones minimas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

Ultima actualizacion: Fase 12D en progreso / checkpoint comercial y continuidad