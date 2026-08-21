# B.R

Generado automaticamente por BR.autocar Documentation Engine. No editar manualmente.

## Foco principal

Construir Fase 15 - Motor Comercial Inteligente / CRM como conocimiento organizado sobre personas, relaciones, oportunidades y seguimiento, sin duplicar las autoridades de Beat Room.

El foco principal de esta app es B.R. BR.autocarmation es soporte interno y no debe sustituir el objetivo del producto.

## Resumen

Convertir B.R en una plataforma musical premium para productores, musicos, beatmakers, DJs, artistas e ingenieros.

## Estado actual

- App: `br-platform`
- Tipo: marketplace musical / plataforma privada de beats
- Fase: Fase 15 - Motor Comercial Inteligente / CRM
- Estado: in_progress
- Avance: 12%
- Siguiente fase: 15.2 - Opportunities

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
- beat_access como autoridad de acceso Full activo
- Descarga MP3 protegida por beat_access activo y manual_payments confirmado
- Licencia HTML protegida por beat_access activo, manual_payments confirmado y tipo basic/premium/exclusive
- Pagos manuales por usuario + beat
- Actividad comercial compacta
- Usuarios comerciales
- Home Discovery con busqueda
- Playlist Full Beats
- Generos multi-tag
- Admin Beats Dashboard
- Commercial Detail Dock
- AI Beat Analysis Lite con Procesar de nuevo
- Deteccion real de BPM y tonalidad con Meyda/chroma y fallback
- Analisis FFT, features musicales y Beat Quality Score explicable
- Autoanalisis al abrir Preview Editor y reproceso manual
- Dashboard comercial compacto
- Revocaciones de acceso
- Sincronizacion Realtime privada de beat_access entre sesiones
- Panel admin B.RCEO
- B.R Cambios con admin_change_logs
- Historial temporal de Gestion de Beats por 7 dias
- Historial permanente agrupado por anio con soft delete
- Descarga PDF manual del historial temporal
- Dominio brstudios.org en Vercel con Cloudflare DNS
- Identidad B.R con app icons, manifest y splash de entrada

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
- Mejoras futuras de precision y UI del analisis musical conservador
- Terminos y condiciones pendientes
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

Ultima generacion: 2026-08-21T07:57:48
