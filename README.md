# Alquileres Uspallata

I01 foundation on branch `i01-h07-controlled-build`.

This increment contains only the pnpm monorepo foundation, Vue 3 + Vite, NestJS, PostgreSQL + Prisma, authentication/roles foundation, CI, and test structure. Product increments I02–I09 are intentionally not implemented.

## Local setup

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres
pnpm prisma:generate
pnpm --filter @alquileres/api prisma:migrate:dev
pnpm dev
```

The API exposes only the foundation auth endpoints:

- `POST /auth/login`
- `GET /auth/me`
- `GET /auth/admin-check` (foundation-only server-side role enforcement check)

No listing, image, moderation, catalogue, availability, contact, assisted-admin, or deploy product flows are included in I01.
