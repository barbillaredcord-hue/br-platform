# Fase 14.5A - Cutover seguro de Full Audio

Este paso no se ejecutó automáticamente. Es necesario porque el bucket actual `beats` es público y contiene previews y full audio históricos. Volverlo privado rompería los previews públicos.

## Objetivo

- `beats`: conservar público y usar solo `previews/*`.
- `beat-full`: bucket nuevo, privado, para `full/*`.
- `public.beats.full_audio_url`: guardar referencia interna `storage://beat-full/<path>`, nunca una URL pública.

## Orden seguro

1. Respaldar y revisar referencias actuales, sin exponerlas fuera de un entorno administrativo:

```sql
select id, slug, full_audio_url, preview_url
from public.beats
order by created_at;
```

2. Crear en Supabase Storage el bucket `beat-full` con `Public bucket = false`.

3. Aplicar solamente las políticas de escritura para administradores. No crear una política `SELECT` para clientes: el endpoint server-side usa la service role para firmar URLs después de autorizar al usuario.

```sql
create policy "br_admin_upload_full_audio"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'beat-full'
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "br_admin_delete_full_audio"
on storage.objects for delete to authenticated
using (
  bucket_id = 'beat-full'
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);
```

4. Copiar cada objeto histórico de `beats/full/*` a `beat-full/full/*`, conservando nombre y tipo MIME. Definir `cacheControl` máximo de `60` segundos en la copia.

5. Tras verificar cada copia con un admin, actualizar exclusivamente su referencia:

```sql
update public.beats
set full_audio_url = 'storage://beat-full/full/<slug>/<archivo>.mp3'
where id = '<beat-uuid>';
```

6. Validar usuario sin acceso, usuario autorizado y admin mediante `/api/beats/<id>/playback`. Las respuestas deben ser 401, 403 y 200 respectivamente; la respuesta 200 devuelve una URL firmada de 60 segundos.

7. Confirmar que `preview_url` no coincide con el full original y que el preview público sigue disponible.

## Gate pendiente

## Ejecución remota — 2026-08-16

- `beat-full` creado con `public = false`.
- 53 objetos históricos de `beats/full/*` respaldados y verificados en `beat-full/full/*`.
- 2 fulls estáticos locales respaldados en `beat-full`; después se movieron de `public/audio/full/*` a `private/audio/full/*`.
- 44 registros `public.beats.full_audio_url` normalizados a `storage://beat-full/<path>`.
- 6 registros cuyo preview apuntaba al full recibieron un preview público independiente de 20 segundos.
- Tras verificar cada respaldo, se retiraron los 53 objetos de `beats/full/*`. No se tocaron previews, portadas ni otros assets.
- Una URL pública histórica conocida ya falla sin sesión; un preview público respondió correctamente.

## Gate pendiente

Falta ejecutar con sesiones reales los casos de usuario con `beat_access`, admin y usuario revocado contra el endpoint desplegado. Hasta completar esos tres casos, 14.5A permanece `in_progress`.
