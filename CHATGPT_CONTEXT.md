# ChatGPT Context - B.R

Generado automaticamente por BR.autocar Documentation Engine. No editar manualmente.

## Foco principal al retomar sesión

El foco principal de esta sesión debe ser `B.R`, no BR.autocar.

Foco del producto:
Consolidar el flujo Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia.

Regla:
El foco principal, continuidad, avances y meta final de esta app pertenecen a B.R. BR.autocarmation dentro de esta app es infraestructura de soporte y no debe sustituir el objetivo principal del producto.

BR.autocar dentro de esta app debe tratarse como: Objetivo secundario e infraestructura de continuidad.

## Resumen del proyecto

`br-platform` es `B.R`.

Tipo: Marketplace musical / plataforma privada de beats

Vision:
Convertir B.R en un marketplace musical para productores, musicos, beatmakers, DJs, artistas e ingenieros.

Posicionamiento:
Plataforma musical premium, privada y escalable con enfoque en acceso controlado, licencias y colaboracion.

## Estado actual

- Fase: Fase 11F-C completada / estabilidad de catalogo, usuarios y accesos
- Estado: implemented
- Avance: 70%
- Health: 3 healthy / 0 risk / 0 blocked
- Siguiente accion: Registrar B.R en BR.autocarmation y luego iniciar consolidacion Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia.

## Reglas de continuidad

- Al cambiar de sesión, primero recuperar el foco, fase, pendientes y próxima acción de `B.R`.
- BR.autocar es soporte interno dentro de esta app; no debe reemplazar el roadmap del producto.
- APP_STATE.json es la fuente principal.
- No editar manualmente PROJECT_STATUS.md, CHANGELOG.md, CHATGPT_CONTEXT.md, CODEX_CONTEXT.md, AGENTS.md, CLAUDE.md ni README.md.
- Regenerar documentacion con `./scripts/br-sync-docs`.

## Contexto de continuidad

Sin contexto registrado

## Pendiente principal

- Preview real de 15 segundos
- Guardar beat / favoritos
- Pagos
- Licencias descargables
- Descargas controladas por tipo de licencia
- Marketplace multiusuario
- Perfiles publicos de productores/artistas
- Servicios musicales
- Escrow o pago protegido

Ultima generacion: 2026-06-15T12:38:03

# CHATGPT_CONTEXT.md - B.R / br-platform

Generado por BR.autocar Documentation Engine. Mantener alineado con APP_STATE.json.

## Foco principal al retomar sesion

El foco principal de esta sesion debe ser `B.R`, no BR.autocarmation.

B.R es el producto principal. BR.autocarmation dentro de esta app es infraestructura de soporte, continuidad y administracion secundaria; no debe sustituir la meta del producto.

## Resumen del proyecto

`br-platform` es `B.R`.

Tipo: Marketplace musical / plataforma privada de beats.

Vision:
Convertir B.R en un marketplace musical para productores, musicos, beatmakers, DJs, artistas e ingenieros.

Posicionamiento:
Plataforma musical premium, privada y escalable con enfoque en acceso controlado, licencias y colaboracion.

## Meta principal

Consolidar el flujo comercial base antes de expandir a marketplace multiusuario:

```text
Beat -> preview -> solicitud -> pago/acceso -> descarga/licencia
```

## Estado actual

- Fase: Fase 11F-C completada / estabilidad de catalogo, usuarios y accesos
- Estado: completed
- Avance: 80%
- Backend: Supabase real
- Deploy: Vercel
- BR.autocarmation: B.R ya registrada en Core v3
- Siguiente fase: Fase 12 - player por acceso y preview real
- Siguiente accion: Implementar player full si el usuario tiene acceso, preview si no tiene acceso, siguiente/anterior por acceso y base de preview real de 15 segundos.

## Funcionalidad lista

```text
Supabase Auth
Supabase Storage
Bucket beats
MP3 reales
Home con beats reales
Explore / Ver todo
Favoritos
Mis Beats
Player global
Solicitudes de acceso
Contacto por WhatsApp
Aprobar/rechazar solicitudes
Dar/quitar acceso
Admin B.RCEO
Admin Access centrado en beat
Usuarios admin expandibles
Eliminacion de usuario/cuenta
Usuarios nuevos, existentes y admin reciben beats activos nuevos
```

## Regla permanente de catalogo

```text
Todo beat activo debe aparecer en el catalogo para visitantes, usuarios nuevos, usuarios existentes y admin/B.RCEO, segun la visibilidad publica prevista.

beat_access no debe filtrar la visibilidad del catalogo.

beat_access solo controla:
- preview/full
- descarga
- badges
- acciones protegidas
```

## Regla de player para Fase 12

Pendiente inmediato:

```text
Si el usuario tiene acceso al beat -> reproducir full audio.
Si no tiene acceso -> reproducir preview.
Si no hay sesion -> reproducir preview.
Siguiente/anterior deben resolver acceso por beat, no reutilizar la URL anterior.
```

## Regla de cuenta eliminada

```text
Si un usuario elimina su cuenta, se eliminan sus datos y accesos.
Si vuelve a crear una cuenta con el mismo correo, B.R no garantiza recuperar accesos anteriores.
Esta regla debe incluirse despues en terminos y condiciones.
```

## Seguridad

```text
No exponer SUPABASE_SERVICE_ROLE_KEY al cliente.
Mantener B.RCEO como unico admin real.
No permitir acciones protegidas con fallback admin.
Usar rutas server/API para operaciones privilegiadas.
```

## Pendiente principal

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

## Validaciones minimas

```bash
python3 -m json.tool APP_STATE.json >/dev/null
npm run lint
npm run build
```

Ultima actualizacion: Fase 11F-C cerrada / preparacion Fase 12