# RECOVERY-001 R1 — evidencia runtime

Runtime target = `b2e449a`, el commit que contiene el código R1 validado.
Este documento fue agregado posteriormente; no afirma que existiera en ese
commit.

Entorno reproducible: API compilada desde ese commit, `NODE_ENV=test`, puerto
`3301`, y PostgreSQL local aislado `recovery-001-postgres` en
`localhost:55434`, con las 7 migraciones aplicadas. Se usó un email sintético
`@example.test`, una contraseña efímera y un `JWT_SECRET` sólo en variables de
entorno del proceso; no se registran credenciales, tokens ni emails concretos.
Los valores se inyectan únicamente por el entorno de ejecución y no se
escriben en archivos. Los placeholders de abajo no son credenciales utilizables.

Comandos resumidos:

```bash
read -rsp 'DB_PASSWORD: ' DB_PASSWORD
printf '\n'
export DB_PASSWORD
read -rsp 'JWT_SECRET: ' JWT_SECRET
printf '\n'
export JWT_SECRET

docker run -d --name recovery-001-postgres \
  -e POSTGRES_DB=alquileres \
  -e POSTGRES_USER=alquileres \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \
  -p 55434:5432 postgres:16-alpine

until docker exec recovery-001-postgres pg_isready -U alquileres -d alquileres; do
  sleep 1
done

DATABASE_URL="postgresql://alquileres:${DB_PASSWORD}@localhost:55434/alquileres?schema=public" \
  pnpm --filter @alquileres/api prisma:deploy
DATABASE_URL="postgresql://alquileres:${DB_PASSWORD}@localhost:55434/alquileres?schema=public" \
  pnpm prisma:generate
pnpm build
PORT=3301 \
  DATABASE_URL="postgresql://alquileres:${DB_PASSWORD}@localhost:55434/alquileres?schema=public" \
  JWT_SECRET="$JWT_SECRET" NODE_ENV=test \
  node apps/api/dist/main.js
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
