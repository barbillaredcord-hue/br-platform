# Changelog

Registro manual de cambios relevantes de B.R / br-platform.

Este archivo resume hitos funcionales y de continuidad. Mantenerlo alineado con `APP_STATE.json`, `PROJECT_STATUS.md`, `README.md`, `CHANGELOG.md`, `AGENTS.md`, `CHATGPT_CONTEXT.md` y `CODEX_CONTEXT.md`.

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

El estado activo ya no es Fase 12D ni Fase 12E. El estado activo es:

```text
Fase 12 cerrada / comercial base completada
```

Siguiente fase:

```text
Fase 13 - preview real de 15 segundos + UX premium del player
```
