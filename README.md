# Alquileres Uspallata

I04 admin review and publication on branch `i04-admin-review-publication`.

This increment adds OWNER listing submission and idempotent ADMIN review and publication. I04 supports re-submit of `DRAFT` and `REJECTED` listings, review through approve/reject, and publication after approval. Repeating a legitimate completed operation returns the current listing without changing it; invalid state transitions remain conflicts. I05 and later are explicitly out of scope.

## States

`status` is the review workflow: `DRAFT` → `SUBMITTED` → `APPROVED` or `REJECTED`. Owners can submit drafts and rejected listings. Admins can approve or reject submitted listings; rejection requires a non-blank reason. A rejected listing stores `rejectionReason`, and re-submit clears it. Repeating reject is idempotent only when the reason is identical; a different reason conflicts.

`publicationStatus` is independent and starts as `UNPUBLISHED`. Only an `APPROVED`/`UNPUBLISHED` listing can be published; repeating publish on `PUBLISHED` is idempotent.

## Local setup

```bash
cp .env.example .env
pnpm install --frozen-lockfile
docker compose up -d postgres
pnpm prisma:generate
pnpm --filter @alquileres/api prisma:migrate:dev
pnpm dev
```

The API exposes the foundation auth endpoints plus I02/I03/I04:

- `POST /auth/login`, `GET /auth/me`, `GET /auth/admin-check`
- `GET /listings` and `GET /listings/:id` (authenticated owner's listings)
- `POST /listings`, `PATCH /listings/:id`, `DELETE /listings/:id`
- `POST /listings/:id/submit` (owner; `DRAFT`/`REJECTED`, or idempotent `SUBMITTED`)
- `POST /listings/:id/images`, `GET /listings/:id/images`, image delete/reorder (own drafts)
- `GET /admin/listings/review` (admin; submitted listings)
- `POST /admin/listings/:id/approve`, `/reject` with `{ "reason": "..." }`, `/publish`

I05+ are excluded: catalog, availability, contact events, assisted admin, audit, deployment, payments, reservations, tourism, realtime flows, and any later increment functionality.
