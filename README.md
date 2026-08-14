# Alquileres Uspallata

I02 owner listing draft CRUD on branch `i02-listing-draft-owner-crud`.

This increment adds authenticated OWNER management of their own Listing records in `DRAFT` status. Ownership is derived server-side from the bearer token; clients cannot choose `ownerId`. Publication, images, moderation, availability, contact events, assisted admin, payments, reservations, tourism, and realtime flows are not included.

## Local setup

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres
pnpm prisma:generate
pnpm --filter @alquileres/api prisma:migrate:dev
pnpm dev
```

The API exposes the foundation auth endpoints plus I02:

- `POST /auth/login`
- `GET /auth/me`
- `GET /auth/admin-check` (foundation-only server-side role enforcement check)
- `GET /listings` (authenticated OWNER's drafts)
- `POST /listings` (creates a DRAFT; `ownerId` is ignored/not accepted from input)
- `GET /listings/:id`, `PATCH /listings/:id`, `DELETE /listings/:id` (own drafts only)
