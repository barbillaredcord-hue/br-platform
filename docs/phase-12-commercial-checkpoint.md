# Fase 12 Commercial Checkpoint

Fecha: 2026-06-17

## Terminado

- Player con preview/full segun acceso.
- Descarga protegida de MP3 por sesion y `beat_access`.
- Descarga protegida de licencia por sesion y `beat_access`.
- Registro server-side de actividad comercial en `commercial_activity`.
- Panel admin de actividad comercial.
- Panel admin de usuarios comerciales.
- Registro de pagos manuales por usuario + beat.
- Prevencion de pago manual duplicado por usuario + beat.
- Soporte minimo para tipo de licencia: `basic`, `premium`, `exclusive`.

## Rutas activas

- `GET /api/beats/[id]/download`
- `GET /api/beats/[id]/license`
- `GET /api/admin/commercial-activity`
- `GET /api/admin/commercial-users`
- `GET /api/admin/manual-payment-options`
- `POST /api/admin/manual-payment`

## SQL manual pendiente

Ejecutar o re-ejecutar en Supabase SQL Editor:

- `docs/supabase/phase-12-commercial.sql`

Incluye tablas comerciales, RLS, indices, unique index de pago manual y columna `manual_payments.license_type`.

## Fase 13

- Preview real separado de 15 segundos.
- Mejorar modelo formal de licencias.
- Preparar pagos iniciales sin Stripe hasta definir alcance.
- Evaluar bucket privado y signed URLs.
- Mejorar UX premium del player.
