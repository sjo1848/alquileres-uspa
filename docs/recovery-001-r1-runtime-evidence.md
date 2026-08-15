# RECOVERY-001 R1 — evidencia runtime

Referencia: `recovery-001-r1-frontend-foundation@7290444` (HEAD verificado el
2026-08-14).

Entorno reproducible: API compilada desde ese HEAD, `NODE_ENV=test`, puerto
`3301`, y PostgreSQL local aislado `recovery-001-postgres` en
`localhost:55434`, con las 7 migraciones aplicadas. Se usó un email sintético
`@example.test`, una contraseña efímera y un `JWT_SECRET` sólo en variables de
entorno del proceso; no se registran credenciales, tokens ni emails concretos.

Comandos resumidos:

```bash
docker compose up -d postgres
DATABASE_URL='postgresql://...@localhost:55434/alquileres?schema=public' \
  pnpm --filter @alquileres/api prisma:deploy
pnpm prisma:generate
pnpm build
PORT=3301 DATABASE_URL='postgresql://...@localhost:55434/alquileres?schema=public' \
  JWT_SECRET='<runtime-only>' NODE_ENV=test node apps/api/dist/main.js
```

Resultados HTTP observados (valores sensibles redactados):

| Recorrido                                              | Resultado                                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `POST /auth/register` con email sintético              | `201`; respuesta con `role: OWNER`; `Set-Cookie` incluye `HttpOnly`, `SameSite=Lax`, `Max-Age=900` |
| `POST /auth/login` con email equivalente en mayúsculas | `201`; cookie de sesión emitida con los mismos atributos; confirma canonicalización a minúsculas   |
| `GET /auth/me` con cookie                              | `200`; identidad canonicalizada y `role: OWNER`                                                    |
| `GET /auth/me` sin credenciales                        | `401`                                                                                              |
| `GET /auth/admin-check` autenticado como OWNER         | `401`; rol rechazado server-side                                                                   |
| `POST /auth/logout`                                    | `200`; `{ "ok": true }`; cookie expirada con `HttpOnly`                                            |
| `GET /auth/me` sin credenciales después de logout      | `401`                                                                                              |

La primera ejecución también confirmó que un email con espacios externos es
rechazado por la validación HTTP (`400`); la canonicalización se verificó con
la variante válida en mayúsculas.
