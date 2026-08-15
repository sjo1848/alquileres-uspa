# RECOVERY-001 — contrato observable y trazabilidad compacta

Estado de referencia: `recovery-001-r1-frontend-foundation@7290444`.

Este documento es el rebaseline compacto de RECOVERY-001. Traza únicamente
capacidades visibles, externamente observables, integradas o de riesgo
material. No pretende enumerar DTOs, helpers ni decisiones internas.

## Fuente y regla de aceptación

La fuente canónica disponible en el repositorio es `README.md`, complementada
por el contrato aprobado de RECOVERY-001. El Design Package completo no está
versionado en `main`; esa ausencia queda registrada como riesgo de trazabilidad.

Para cada capacidad se exige:

`Requirement → Expected Surface → Acceptance → Evidence`.

Una evidencia API no sustituye una superficie UI requerida.

Estados usados: `EXISTING_BACKEND`, `RECOVERY_REQUIRED`, `NOT_APPLICABLE`.

## Matriz compacta

| Requirement                   | Expected Surface                  | Acceptance                                                                          | Evidence in R1                                                                                                         | Recovery |
| ----------------------------- | --------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| BUSCADOR: catálogo y filtros  | UI + API                          | Un visitante filtra, pagina y ve resultados publicados                              | API pública; UI missing                                                                                                | R2       |
| BUSCADOR: ficha               | UI + API + storage                | Un visitante abre una ficha con imágenes, datos públicos y estado de disponibilidad | Ficha y metadata API existentes; storage de gestión existente; entrega pública de bytes de imagen faltante; UI missing | R2       |
| BUSCADOR: freshness           | UI + API                          | La ficha muestra disponibilidad y última confirmación según reglas aprobadas        | Backend existente; UI missing                                                                                          | R2       |
| BUSCADOR: contacto            | UI + API + ContactEvent           | Un visitante envía contacto y recibe resultado visible                              | Endpoint/ContactEvent existentes; UI missing                                                                           | R2       |
| OWNER: registro y login       | UI + API + persistence + security | Una persona crea cuenta OWNER, inicia sesión y conserva una sesión segura           | Registro OWNER, login, cookie HttpOnly, sesión y UI de auth implementados en R1                                        | —        |
| OWNER: mis publicaciones      | UI + API + security               | OWNER ve sólo sus listings                                                          | API/ownership existentes; UI missing                                                                                   | R3       |
| OWNER: draft CRUD             | UI + API + persistence            | OWNER crea, edita y elimina un DRAFT propio                                         | API existente; UI missing                                                                                              | R3       |
| OWNER: imágenes               | UI + API + storage                | OWNER sube, lista, ordena y elimina imágenes con errores recuperables               | API/storage/validación existentes; UI missing                                                                          | R3       |
| OWNER: revisión               | UI + API                          | OWNER envía a revisión, ve estados y puede corregir rechazo                         | API/lifecycle existentes; UI missing                                                                                   | R3       |
| OWNER: disponibilidad         | UI + API                          | OWNER cambia disponibilidad y reconfirma; el cambio se refleja públicamente         | API existente; UI missing                                                                                              | R3, R5   |
| ADMIN: login y cola           | UI + API + security               | ADMIN accede a cola y detalle de revisión                                           | API/roles existentes; UI missing                                                                                       | R4       |
| ADMIN: moderación/publicación | UI + API + audit                  | ADMIN aprueba, rechaza con razón y publica; la acción queda auditable               | API/audit existentes; UI missing                                                                                       | R4       |
| ADMIN: flujo asistido         | UI + API + audit                  | ADMIN opera el flujo asistido sobre reglas existentes                               | API/audit existentes; UI missing                                                                                       | R4       |
| Transversal: estados UI       | UI                                | Pantallas reales exponen loading, empty, error y sesión expirada                    | Estados de auth implementados en R1; estados de journeys restantes pendientes                                          | R2–R5    |
| Transversal: responsive/a11y  | UI                                | Journeys reales funcionan en desktop, mobile y teclado                              | Shell only                                                                                                             | R5       |
| Transversal: integración      | UI + API + DB + storage           | Journeys OWNER→ADMIN→público funcionan con PostgreSQL/storage reales                | Unit tests y API aislada                                                                                               | R5       |
| Transversal: seguridad        | security + UI/API                 | Auth server-side, ownership, roles y errores de sesión se verifican en journeys     | Foundation backend existente                                                                                           | R1, R5   |

## Journey gates

1. OWNER register/login → create listing → upload image → submit → ADMIN review
   → reject with reason → OWNER corrects and resubmits → approve/publish →
   catálogo → ficha loads public image bytes (not private `objectKey`/metadata)
   → contacto.
2. OWNER modifica availability → el catálogo refleja el cambio.
3. OWNER A intenta operar un listing de OWNER B → acceso rechazado.
4. ADMIN assisted flow → create/update/availability/reconfirm/submit →
   operación visible y registro verificable en audit log.

Estos journeys deben ejecutarse contra PostgreSQL local y storage local, y no
se consideran probados por unit tests aislados o por endpoints no recorridos.

## Recovery increments

- **R1:** foundation frontend funcional, auth/session y registro OWNER.
- **R2:** BUSCADOR y contacto.
- **R3:** autoservicio OWNER.
- **R4:** operación ADMIN.
- **R5:** integración real, E2E, responsive, accesibilidad y estados transversales.

## Riesgos abiertos de R0

- Falta el Design Package completo como artefacto versionado.
- Los journeys de catálogo, OWNER autoservicio, ADMIN e integración completa siguen fuera de R1.
- La evidencia de R1 demuestra la fundación de auth en runtime; no sustituye los recorridos de producto de R2+.
- Producción, release, hosting y outreach permanecen fuera de alcance.
