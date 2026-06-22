# B.R

Generado automaticamente por BR.autocar Documentation Engine. No editar manualmente.

## Foco principal

Consolidar el flujo Beat -> preview real -> solicitud -> pago/acceso -> descarga/licencia.

El foco principal de esta app es B.R. BR.autocarmation es soporte interno y no debe sustituir el objetivo del producto.

## Resumen

Convertir B.R en una plataforma musical premium para productores, musicos, beatmakers, DJs, artistas e ingenieros.

## Estado actual

- App: `br-platform`
- Tipo: marketplace musical / plataforma privada de beats
- Fase: Fase 14D - historial administrativo y continuidad
- Estado: implemented
- Avance: 96%
- Siguiente fase: Fase 14 M2 - estados formales de orden

## Oferta del producto

- Catalogo publico de beats activos
- Gestion admin de beats activos e inactivos
- Preview real generado desde beat completo
- Preview Editor con FFmpeg WASM
- Player global premium full/preview por acceso
- playback_visibility publico/privado por beat
- Supabase Auth con confirmacion SMTP Resend
- Supabase Storage bucket beats
- Solicitudes de acceso
- beat_access como permiso real de descarga/licencia
- Descarga MP3 protegida
- Licencia HTML protegida por tipo basic/premium/exclusive
- Pagos manuales por usuario + beat
- Actividad comercial compacta
- Usuarios comerciales
- Revocaciones de acceso
- Panel admin B.RCEO
- B.R Cambios con admin_change_logs
- Historial temporal de Gestion de Beats por 7 dias
- Historial permanente agrupado por anio con soft delete
- Descarga PDF manual del historial temporal
- Dominio brstudios.org en Vercel con Cloudflare DNS

## Usuarios objetivo

- B.RCEO
- Artistas
- Productores
- Beatmakers
- Musicos
- DJs
- Ingenieros de audio
- Clientes que buscan beats/licencias

## Limites del producto

- Pagos automaticos completos pendientes
- Ordenes formales avanzadas pendientes
- Licencias legales avanzadas pendientes
- Marketplace multiusuario pendiente
- Perfiles publicos de productores/artistas pendientes
- Chat interno pendiente

## Arquitectura

- Stack: Next.js App Router, TypeScript, Tailwind, Supabase, Vercel, Cloudflare DNS, Resend
- Nivel de datos: Supabase Postgres
- Backend: True
- Database: True
- Auth: True

## BR.autocar como soporte

- Managed: True
- Rol dentro del producto: Infraestructura de soporte
- Regla de foco: BR.autocar debe actuar como soporte y no como foco principal cuando esta app no sea BR.autocar Admin Web.
- Template version: app-state-schema-v3
- Future sync target: BR.autocar Admin Web

## Comandos BR

```bash
# Desde BR.autocarmation:
./scripts/br-wake /Users/fabianhonoriogonzalezandrade/br-platform
./scripts/br-health /Users/fabianhonoriogonzalezandrade/br-platform
./scripts/br-sync-docs /Users/fabianhonoriogonzalezandrade/br-platform
```

## Documentacion

La documentacion de este proyecto es generada automaticamente desde `APP_STATE.json`.

Archivos derivados:

- `PROJECT_STATUS.md`
- `CHANGELOG.md`
- `CHATGPT_CONTEXT.md`
- `CODEX_CONTEXT.md`
- `AGENTS.md`
- `CLAUDE.md`
- `README.md`

Ultima generacion: 2026-06-21T20:14:45
