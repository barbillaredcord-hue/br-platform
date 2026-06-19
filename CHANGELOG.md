# Changelog

Registro manual de cambios relevantes de B.R / br-platform.

Este archivo resume hitos funcionales y de continuidad. Mantenerlo alineado con `APP_STATE.json`, `PROJECT_STATUS.md`, `README.md`, `AGENTS.md`, `CHATGPT_CONTEXT.md` y `CODEX_CONTEXT.md`.

## pending - feat: close phase 13 playback visibility and updates modal

Fecha: 2026-06-18

Estado: Fase 13 cerrada / preview real, player premium, auth SMTP y playback publico-privado.

Cambios:

- Cierre funcional de Fase 13.
- `ProductUpdatesPanel` ahora es compacto y abre un modal mediano de actualizaciones.
- El modal de actualizaciones se puede cerrar con X, boton Cerrar, overlay y Escape.
- Actualizaciones visibles dentro de la app sincronizadas con Fase 13 cerrada.
- Preview real generado desde beat completo con FFmpeg WASM.
- Duraciones de preview soportadas: 15, 20, 25 y 30 segundos.
- PlayerBar premium con modo Preview / Acceso completo.
- Responsive movil critico corregido.
- Dominio `brstudios.org` funcionando con Cloudflare DNS y Vercel.
- Resend verificado y Supabase SMTP funcionando para confirmacion real de correo.
- `playback_visibility` agregado a `public.beats` para controlar reproduccion publica/privada.
- Admin puede cambiar un beat entre Publico/Privado desde Gestionar Beats.
- Beat publico reproduce full sin acceso.
- Beat privado reproduce preview sin acceso y full con acceso.
- Admin/B.RCEO reproduce full en cualquier beat sin requerir `beat_access`.
- Descarga MP3 y licencia siguen protegidas por sesion y `beat_access`.
- Documentacion actualizada en `APP_STATE.json`, `README.md`, `AGENTS.md`, `CHANGELOG.md`, `docs/supabase/schema.sql` y `docs/supabase/phase-13f-playback-visibility.sql`.

Validacion:

```text
npm run lint: OK
npm run build: OK
SQL playback_visibility ejecutado en Supabase: OK
Prueba manual de actualizaciones/modal: OK
Prueba manual publico/privado/admin full: OK
```

Siguiente foco:

```text
Fase 14 - ordenes y pagos controlados
```

## d9c7fb2 - docs: sync phase 12 commercial continuity

Fecha: 2026-06-17

Estado: Fase 12 cerrada / comercial base completada.

Cambios:

- Sincronización de continuidad en `README.md`, `CHANGELOG.md`, `AGENTS.md`, `CHATGPT_CONTEXT.md`, `CODEX_CONTEXT.md`, `PROJECT_STATUS.md` y `APP_STATE.json`.
- Eliminadas referencias viejas a Fase 12D, Fase 12E y commit `5daddf3` como estado activo.
- Nuevo estado activo: Fase 12 cerrada / comercial base completada.
- Nuevo siguiente foco: Fase 13 - preview real de 15 segundos + UX premium del player.
- Se documentó que la base comercial ya incluye descargas protegidas, licencias protegidas, actividad comercial, pagos manuales y tipos de licencia basic/premium/exclusive.

## be3d8cb - feat:add license type support and phase 12 checkpoint

Estado: Fase 12 comercial base completada.

Cambios:

- Soporte de tipos de licencia `basic`, `premium` y `exclusive`.
- `/api/beats/[id]/license` usa `license_type` desde `manual_payments` con fallback seguro a `basic`.
- `/api/admin/manual-payment` acepta y registra `license_type` cuando la columna existe.
- `commercial_activity.metadata` registra `license_type` en descargas de licencia.
- Checkpoint comercial agregado en `docs/phase-12-commercial-checkpoint.md`.
- SQL comercial actualizado en `docs/supabase/phase-12-commercial.sql`.

## 8320303 - feat: improve manual payment user flow

Cambios:

- Panel admin de usuarios comerciales.
- Opciones de pago manual por usuario + beat.
- Prevención de pagos duplicados por usuario + beat.
- Registro de pago manual conectado a actividad comercial.

## f2eba29 - feat: add commercial activity and manual payments

Cambios:

- Tabla y flujo de `commercial_activity`.
- Tabla y flujo de `manual_payments`.
- Panel admin de actividad comercial.
- Base de trazabilidad comercial server-side.

## 86bf06a - feat: add protected beat license download

Cambios:

- Descarga protegida de licencia por sesión y `beat_access`.
- Registro de actividad para descarga de licencia.

## df59394 - feat: add admin beat soft delete

Cambios:

- Soft delete de beats desde admin.
- Mantiene estabilidad del catálogo activo.

## 56aca12 - Add protected beat download flow

Cambios:

- Descarga protegida de MP3 por sesión y `beat_access`.
- Validación server-side antes de entregar archivo.

## 5daddf3 - Complete phase 12C saved beats and player controls

Estado histórico: Fase 12C completada.

Cambios:

- Guardados locales.
- `/account/saved` conectado a guardados reales.
- Space play/pause en player.
- Barra de progreso clickeable/seekable.
- Scroll horizontal Safari-safe en BeatRow.

## Regla actual

El estado activo ya no es Fase 12. El estado activo es:

```text
Fase 13 cerrada / preview real, player premium, auth SMTP y playback publico-privado
```

Siguiente fase:

```text
Fase 14 - ordenes y pagos controlados
```
