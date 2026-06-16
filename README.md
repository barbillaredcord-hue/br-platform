# B.R

Generado automaticamente por BR.autocar Documentation Engine. No editar manualmente.

## Foco principal

Consolidar el flujo Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia.

El foco principal, continuidad, avances y meta final de esta app pertenecen a B.R. BR.autocarmation dentro de esta app es infraestructura de soporte y no debe sustituir el objetivo principal del producto.

## Resumen

Convertir B.R en un marketplace musical para productores, musicos, beatmakers, DJs, artistas e ingenieros.

## Estado actual

- App: `br-platform`
- Tipo: Marketplace musical / plataforma privada de beats
- Fase: Fase 11F-C completada / estabilidad de catalogo, usuarios y accesos
- Estado: implemented
- Avance: 70%
- Siguiente fase: Consolidacion comercial

## Oferta del producto

- Catalogo de beats
- Preview de beats
- Solicitud de acceso
- Acceso manual administrado por B.RCEO
- Subida de MP3 reales
- Panel admin
- Perfiles de usuario con telefono
- Eliminacion de usuarios
- Base futura para licencias, pagos y marketplace

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

- Preview real de 15 segundos pendiente
- Pagos automaticos pendientes
- Licencias descargables pendientes
- Marketplace multiusuario pendiente
- Chat interno pendiente

## Arquitectura

- Stack: Next.js, TypeScript, Tailwind, Supabase, Vercel
- Nivel de datos: Supabase Postgres
- Backend: True
- Database: True
- Auth: True

## BR.autocar como soporte

- Managed: True
- Rol dentro del producto: Objetivo secundario e infraestructura de continuidad
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

Ultima generacion: 2026-06-15T12:38:03

# B.R / br-platform

B.R es una plataforma musical privada/premium para administrar beats, previews, solicitudes, accesos y futuras licencias.

## Meta principal

Consolidar el flujo comercial base antes de expandir a marketplace multiusuario:

```text
Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia
```

## Estado actual

```text
Fase actual: Fase 11F-C completada / estabilidad de catalogo, usuarios y accesos
Progreso aproximado: 80%
Siguiente fase: Fase 12 - player por acceso y preview real
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
Favoritos
Mis Beats
Player global
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
Catalogo activo visible para usuarios nuevos, existentes y admin
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

## Decisiones de producto

```text
Si un usuario elimina su cuenta, se eliminaran sus datos/accesos.
Si vuelve a crear una cuenta con el mismo correo, B.R no garantiza recuperar accesos anteriores.
Esto debe aclararse despues en terminos y condiciones.
```

## Pendientes principales

```text
Fase 12: player full/preview por acceso
Preview real de 15 segundos
Descarga controlada
Licencias descargables
Pagos automaticos
Suscripciones / freemium / watermark
Terminos y condiciones
Marketplace multiusuario
Chat / rooms de colaboracion
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