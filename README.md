# B.R / br-platform

B.R es una plataforma musical privada/premium para administrar beats, previews, solicitudes, accesos, descargas controladas y futuras licencias.

## Meta principal

Consolidar el flujo comercial base antes de expandir a marketplace multiusuario:

```text
Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia
```

## Estado actual

```text
Fase actual: Fase 12D en progreso / checkpoint comercial y continuidad
Estado: in_progress
Progreso aproximado: 85%
Ultimo commit funcional: 5daddf3 Complete phase 12C saved beats and player controls
Siguiente fase: Fase 12E - descargas controladas por acceso/licencia
```

## Stack

```text
Next.js
TypeScript
Tailwind
Supabase Auth
Supabase Postgres
Supabase Storage
Vercel
```

## Funcionalidad lista

```text
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
Registro/login con Supabase Auth
Perfiles con telefono
Panel admin B.RCEO
Subida de MP3 reales a Supabase Storage
Solicitudes de acceso
Contacto por WhatsApp
Aprobar/rechazar solicitudes
Dar/quitar acceso
Admin Access centrado en beat
Usuarios admin expandibles
Eliminar usuario/cuenta
Catalogo activo visible para visitantes, usuarios nuevos, usuarios existentes y admin
Scroll horizontal Safari-safe en BeatRow
```

## Regla permanente de catalogo

```text
Todo beat activo debe aparecer en el catalogo para visitantes, usuarios nuevos, usuarios existentes y admin/B.RCEO, segun la visibilidad publica prevista.

beat_access NO debe filtrar la visibilidad del catalogo.

beat_access solo controla:
- preview vs full
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

## Decisiones de producto

```text
Si un usuario elimina su cuenta, se eliminaran sus datos/accesos.
Si vuelve a crear una cuenta con el mismo correo, B.R no garantiza recuperar accesos anteriores.
Esto debe aclararse despues en terminos y condiciones.
```

## Pendientes principales

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

## Comandos

```bash
npm run lint
npm run build
npm run dev
```

Validar estado:

```bash
python3 -m json.tool APP_STATE.json >/dev/null
```

## Supabase

La app usa Supabase real para:

```text
Auth
profiles
beats
beat_access
access_requests
Storage bucket beats
```

El schema vive en:

```text
docs/supabase/schema.sql
```

La guia de setup vive en:

```text
docs/SETUP_SUPABASE.md
```

## BR.autocarmation

B.R ya esta registrada en BR.autocarmation Core v3 como app administrada.

BR.autocarmation es infraestructura de continuidad; no debe reemplazar el foco principal del producto B.R.

## Documentacion de continuidad

Archivos principales:

```text
APP_STATE.json
PROJECT_STATUS.md
CHATGPT_CONTEXT.md
CODEX_CONTEXT.md
AGENTS.md
README.md
```

Antes de cerrar una fase, revisar si estos archivos deben actualizarse para evitar estados viejos o duplicados.

## Validaciones minimas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

Ultima actualizacion: Fase 12D en progreso / checkpoint comercial y continuidad