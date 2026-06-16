# Setup Supabase Auth para B.R

## 1. Crear proyecto Supabase

1. Entra a Supabase.
2. Crea un proyecto nuevo.
3. Espera a que el proyecto termine de inicializar.

## 2. Obtener variables

1. Ve a `Project Settings > API`.
2. Copia `Project URL`.
3. Copia `anon public key`.
4. No copies ni uses `service_role` en el frontend.

## 3. Configurar local

1. Crea `.env.local` en la raíz del proyecto.
2. Usa esta estructura:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BRCEO_EMAIL=
```

3. Pega `Project URL` en `NEXT_PUBLIC_SUPABASE_URL`.
4. Pega `anon public key` en `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Define el email admin en `NEXT_PUBLIC_BRCEO_EMAIL`.
6. Reinicia `npm run dev`.

## 4. Crear usuario B.RCEO

1. Abre `/register`.
2. Registra una cuenta usando el mismo email definido en `NEXT_PUBLIC_BRCEO_EMAIL`.
3. Si Supabase requiere confirmación de email, confirma el usuario desde Supabase Auth o desde el correo.
4. Abre `/login`.
5. Inicia sesión con el email B.RCEO.
6. Prueba `/admin`.

## 5. Configurar Vercel

1. Entra al proyecto en Vercel.
2. Ve a `Settings > Environment Variables`.
3. Agrega:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_BRCEO_EMAIL
```

4. Usa los mismos valores que en `.env.local`.
5. Redeploy del proyecto.

## Notas

- `.env.local` no debe subirse a git.
- B.R usa Supabase real para beats, permisos y accesos principales.
- No hay pagos automaticos todavia, pero Storage, profiles real y beat_access real ya existen.

# Setup Supabase - B.R / br-platform

Este documento describe el estado y configuracion actual de Supabase para B.R.

## Estado actual

B.R ya usa Supabase real.

```text
Supabase Auth real
Supabase Postgres real
Supabase Storage real
Bucket beats funcional
profiles real
beats real
beat_access real
access_requests real
```

## Proyecto Supabase

```text
Supabase URL: https://nshutjhqgnsclvbhuxty.supabase.co
Bucket principal: beats
Admin B.RCEO: barbillaredcord@gmail.com
```

## Variables esperadas

En `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nshutjhqgnsclvbhuxty.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BRCEO_EMAIL=barbillaredcord@gmail.com
SUPABASE_SERVICE_ROLE_KEY=
```

Regla critica:

```text
SUPABASE_SERVICE_ROLE_KEY nunca debe exponerse al cliente.
Solo debe usarse server-side.
```

## Variables en Vercel

En Vercel deben existir las mismas variables necesarias para produccion:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_BRCEO_EMAIL
SUPABASE_SERVICE_ROLE_KEY
```

Despues de cambiar variables en Vercel, hacer redeploy.

## Tablas principales

```text
public.profiles
public.beats
public.beat_access
public.access_requests
public.account_access_recovery
```

## Storage

Bucket:

```text
beats
```

Uso actual:

```text
Subida de MP3 reales
Reproduccion de beats
Base futura para preview/full/watermark
```

## Schema

El schema principal esta en:

```text
docs/supabase/schema.sql
```

Ese archivo incluye estructura para:

```text
profiles
beats
beat_access
access_requests
account_access_recovery
indices
triggers
RLS
policies
migraciones seguras
```

## Regla permanente de catalogo

```text
El catalogo no debe depender de beat_access.
Todo beat activo debe ser visible para los usuarios previstos.
beat_access solo controla preview/full, descargas, badges y acciones protegidas.
```

## Regla de cuenta eliminada

Decision actual de producto:

```text
Si el usuario elimina su cuenta, se eliminan datos/accesos.
No se garantiza recuperacion automatica al registrarse de nuevo con el mismo correo.
Esta regla debe documentarse despues en terminos y condiciones.
```

`account_access_recovery` existe como estructura tecnica/historica, pero la regla de producto actual no debe prometer restauracion automatica.

## Verificaciones SQL utiles

Tabla `account_access_recovery`:

```sql
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'account_access_recovery'
order by ordinal_position;
```

Constraint de `access_requests`:

```sql
select
  conname,
  pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.access_requests'::regclass
  and conname = 'access_requests_status_check';
```

Debe permitir:

```text
pending
approved
rejected
contacted
```

## Crear o confirmar B.RCEO

1. El email admin debe coincidir con `NEXT_PUBLIC_BRCEO_EMAIL`.
2. El admin actual esperado es `barbillaredcord@gmail.com`.
3. Si se crea una cuenta nueva para B.RCEO, debe existir tambien en `public.profiles`.
4. No usar fallback admin para acciones protegidas.

## Validacion app

Despues de cambios Supabase/app:

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

## Pendiente Supabase futuro

```text
Fase 12: player full/preview por acceso
Preview real de 15 segundos
Descarga controlada
Licencias
Pagos
Suscripciones
Watermark
```

## Notas

- `.env.local` no debe subirse a git.
- B.R ya no depende de datos locales simulados para beats, perfiles ni accesos principales.
- Storage, `profiles`, `beats`, `beat_access` y `access_requests` ya existen como parte del flujo real.