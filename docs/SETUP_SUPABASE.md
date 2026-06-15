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
- B.R mantiene beats, permisos y accesos en datos demo locales.
- No hay pagos, Storage, `profiles` real ni `beat_access` real todavía.
