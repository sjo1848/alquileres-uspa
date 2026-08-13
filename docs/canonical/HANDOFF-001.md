# HANDOFF-001 — Alquileres Uspallata

## Estado

Fase: BUILD
Incremento: I01 — base técnica, datos, auth y roles.
Rama de trabajo: `i01-foundation`.

## Dirección de producto aprobada

Producto hiperlocal para alquiler mensual, permanente y media estancia en Uspallata. Turismo de corta estancia queda fuera del primer build.

## Decisiones estructurales

- Buscador público sin cuenta.
- OWNER y ADMIN requieren autenticación.
- Autoservicio OWNER como camino principal; asistencia ADMIN como fallback.
- Primera publicación requiere revisión mínima.
- `publicationStatus` y `availabilityStatus` son conceptos distintos.
- Disponibilidad visible acompañada por última confirmación.
- Vue 3 + Vite, NestJS, Prisma/PostgreSQL, REST y object storage para imágenes.
- Sin WebSockets, microservicios, pagos, reservas ni contratos en el thin slice.

## I01

Incluye workspace, frontend y backend mínimos, PostgreSQL local, Prisma con User/roles, registro/login OWNER, guard JWT, infraestructura inicial de roles y CI de typecheck/build.

## Siguiente incremento

I02 — Listing DRAFT + ownership + CRUD autoservicio OWNER.

## Regla de continuidad

No pedir aprobación entre incrementos rutinarios. Detenerse sólo ante un cambio de alcance, trade-off estructural no cubierto, gasto material o riesgo significativo.
