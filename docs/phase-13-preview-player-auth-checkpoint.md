

# Phase 13 Checkpoint - Preview real, player premium, auth SMTP y playback publico/privado

Fecha: 2026-06-18
Proyecto: B.R / br-platform
Estado: Fase 13 cerrada
Siguiente fase: Fase 14 - ordenes y pagos controlados

## Resumen

Fase 13 quedo cerrada con preview real generado desde el beat completo, duraciones configurables, PlayerBar premium, responsive movil, dominio propio, SMTP real, actualizaciones compactas y reproduccion publica/privada por beat.

La app queda lista para iniciar Fase 14: ordenes y pagos controlados desde admin.

## Objetivo de la fase

Consolidar experiencia premium y control de reproduccion antes de avanzar al flujo comercial de ordenes/pagos:

```text
Beat -> preview real -> solicitud/orden -> pago/acceso -> descarga/licencia
```

## Completado

- Preview Editor funcional.
- FFmpeg WASM para generar preview desde beat completo.
- Duraciones de preview soportadas: 15, 20, 25 y 30 segundos.
- Campos usados en `public.beats`:
  - `preview_url`
  - `full_audio_url`
  - `preview_duration_seconds`
  - `preview_updated_at`
  - `playback_visibility`
- PlayerBar premium con modo Preview / Acceso completo.
- Player full/preview validado en Home, Explore, Detail, Saved y Mis Beats.
- Siguiente/anterior del player resuelve acceso y visibilidad por beat.
- Responsive movil critico corregido.
- ProductUpdatesPanel compacto con modal.
- Modal de actualizaciones con cierre por X, boton Cerrar, overlay y Escape.
- Actualizaciones visibles sincronizadas con Fase 13 cerrada.
- Dominio `brstudios.org` funcionando.
- Cloudflare DNS configurado.
- Vercel conectado al dominio propio.
- Resend verificado.
- Supabase SMTP funcionando.
- Confirmacion de correo funcionando.
- `playback_visibility` agregado a `public.beats`.
- Admin puede cambiar beat Publico/Privado desde Gestionar Beats.
- Beat publico reproduce full sin acceso.
- Beat privado reproduce preview sin acceso y full con acceso.
- Admin/B.RCEO reproduce full en cualquier beat sin requerir `beat_access`.
- Descarga MP3 y licencia siguen protegidas por sesion y `beat_access`.
- Documentacion sincronizada con Fase 13 cerrada.

## Regla permanente de catalogo

`beat_access` no filtra catalogo.

Todo beat activo debe aparecer para:

- visitantes
- usuarios nuevos
- usuarios existentes
- admin/B.RCEO

`is_active` controla si el beat aparece o no aparece en catalogo.

`playback_visibility` controla si la reproduccion full es publica o privada.

`beat_access` controla:

- descarga
- licencia
- badges
- acciones protegidas

## Regla permanente de player

- `playback_visibility = public`: visitantes y usuarios pueden reproducir full.
- `playback_visibility = private` + usuario con acceso: full.
- `playback_visibility = private` + usuario sin acceso: preview.
- Sin sesion + beat privado: preview.
- Admin/B.RCEO: full en cualquier beat sin `beat_access`.
- Preview explicito debe seguir reproduciendo preview.
- Siguiente/anterior deben resolver acceso y visibilidad por beat, no reutilizar la URL anterior.

## Reproduccion publica/privada

```text
is_active = aparece/no aparece en catalogo.
playback_visibility = full publico o preview/full por acceso.
beat_access = descarga, licencia, badges y acciones protegidas.
```

Modos:

```text
Beat privado:
- Visitante/usuario sin acceso: Preview
- Usuario con acceso: Full
- Admin/B.RCEO: Full

Beat publico:
- Visitante/usuario sin acceso: Full
- Usuario con acceso: Full
- Admin/B.RCEO: Full
- Descarga/licencia: siguen protegidas por acceso aprobado
```

## Seguridad

- No exponer `SUPABASE_SERVICE_ROLE_KEY`.
- No liberar descarga/licencia solo porque un beat sea publico.
- No hacer depender al admin/B.RCEO de `beat_access` para reproducir full.
- No confundir `is_active` con `playback_visibility`.
- No usar `beat_access` para filtrar catalogo.
- No romper preview real al modificar player, descargas, licencias o pagos.
- No avanzar a marketplace multiusuario antes de consolidar ordenes/pagos controlados.

## SQL relacionado

- `docs/supabase/phase-13-preview-editor.sql`
- `docs/supabase/phase-13f-playback-visibility.sql`
- `docs/supabase/schema.sql`

## Archivos principales tocados o sincronizados

- `APP_STATE.json`
- `README.md`
- `AGENTS.md`
- `CHANGELOG.md`
- `PROJECT_STATUS.md`
- `CHATGPT_CONTEXT.md`
- `CODEX_CONTEXT.md`
- `src/data/product-updates.ts`
- `src/components/ProductUpdatesPanel.tsx`
- `src/components/BeatCard.tsx`
- `src/components/BeatAccessActions.tsx`
- `src/components/BeatAccessSummary.tsx`
- `src/components/admin/AdminBeatList.tsx`
- `src/components/admin/NewBeatForm.tsx`
- `src/context/PlayerContext.tsx`
- `src/lib/supabase/queries.ts`
- `docs/supabase/schema.sql`
- `docs/supabase/phase-13f-playback-visibility.sql`

## Validacion

- `npm run lint`: OK
- `npm run build`: OK
- SQL `playback_visibility` ejecutado en Supabase: OK
- Prueba manual ProductUpdatesPanel/modal: OK
- Prueba manual beat Publico/Privado: OK
- Prueba manual admin full global: OK
- Descarga/licencia protegidas: OK
- Confirmacion de correo real con Supabase SMTP + Resend: OK

## Estado final de Fase 13

```text
Fase 13 cerrada / preview real, player premium, auth SMTP y playback publico-privado
Estado: implemented / estable
Progreso aproximado: 92%
```

## Siguiente fase

Fase 14 - ordenes y pagos controlados.

Objetivo:

Crear flujo de orden/pago controlado desde admin para liberar acceso, descarga y licencia sin automatizar pagos completos ni marketplace multiusuario todavia.

Alcance inicial:

- Crear solicitud/intencion de compra.
- Crear estado de orden: pending / approved / rejected / cancelled.
- Permitir que admin confirme pago manualmente.
- Al aprobar pago, liberar `beat_access` y `license_type`.
- Mostrar al usuario el estado de su compra.
- Mantener descarga MP3/licencia protegida por sesion y `beat_access`.
- No usar `beat_access` para filtrar catalogo.
- No romper `playback_visibility`.

Fuera de alcance inicial:

- Stripe o pagos automaticos completos.
- Marketplace multiusuario.
- Perfiles publicos de productores/artistas.
- Escrow o pago protegido.
- Licencias legales avanzadas.

## Nota de continuidad

Si una sesion futura retoma este proyecto, usar este archivo junto con:

- `APP_STATE.json`
- `PROJECT_STATUS.md`
- `README.md`
- `AGENTS.md`
- `CHATGPT_CONTEXT.md`
- `CODEX_CONTEXT.md`
- `CHANGELOG.md`

La prioridad inmediata despues de este checkpoint es Fase 14: ordenes y pagos controlados.