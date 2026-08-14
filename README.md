# Alquileres Uspallata

I03 listing images on branch `i03-listing-images`.

This increment adds authenticated OWNER-only image management for their own `DRAFT` Listings: validation, ordering, deletion, cleanup/compensation, and a replaceable storage abstraction. Listing CRUD from I02 remains available. Ownership is derived server-side from the bearer token; clients cannot choose `ownerId`. I04 and later are explicitly out of scope: publication, moderation, catalog, availability, contact events, assisted admin, audit, deployment, payments, reservations, tourism, and realtime flows.

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
- `POST /listings/:id/images` (multipart field `image`; own drafts only)
- `GET /listings/:id/images` (own drafts only)
- `DELETE /listings/:id/images/:imageId` (own draft image only)
- `PATCH /listings/:id/images/:imageId` with `{ "position": 0 }` (own draft image only)

Images are validated as PNG, JPEG, or WebP using MIME and file signatures, with local defaults of 5 MiB per image and 20 images per listing. The local adapter writes bytes under `LISTING_IMAGE_STORAGE_DIR`; PostgreSQL stores only image metadata and a generated object key, so the adapter can be replaced by approved object storage later.
