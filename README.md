# Alquileres Uspallata

I05 public catalog on branch `i05-public-catalog`.

This increment adds the public listings catalog on top of I04 review and publication. The catalog exposes only listings whose `status` is `APPROVED` and whose `publicationStatus` is `PUBLISHED`; drafts, submitted, rejected, approved-but-unpublished, and other private listings are excluded.

## States

`status` is the review workflow: `DRAFT` → `SUBMITTED` → `APPROVED` or `REJECTED`. Owners can submit drafts and rejected listings. Admins can approve or reject submitted listings; rejection requires a non-blank reason. A rejected listing stores `rejectionReason`, and re-submit clears it. Repeating reject is idempotent only when the reason is identical; a different reason conflicts.

`publicationStatus` is independent and starts as `UNPUBLISHED`. Only an `APPROVED`/`UNPUBLISHED` listing can be published; repeating publish on `PUBLISHED` is idempotent.

## Public catalog (I05)

`GET /public/listings` returns a paginated catalog with optional filters: `location`, `minPricePerNight`, `maxPricePerNight`, and `maxGuests`. Pagination uses `page` (1–10,000, default 1) and `pageSize` (1–50, default 20), with deterministic ordering and total counts.

`GET /public/listings/:id` returns the public listing ficha, including its public fields and ordered image metadata. Internal ownership, workflow, publication, and storage fields are not exposed. A listing that is not both `APPROVED` and `PUBLISHED` is treated as unavailable.

## Local setup

```bash
cp .env.example .env
pnpm install --frozen-lockfile
docker compose up -d postgres
pnpm prisma:generate
pnpm --filter @alquileres/api prisma:migrate:dev
pnpm dev
```

The API exposes the foundation auth endpoints plus I02/I03/I04/I05:

- `POST /auth/login`, `GET /auth/me`, `GET /auth/admin-check`
- `GET /listings` and `GET /listings/:id` (authenticated owner's listings)
- `POST /listings`, `PATCH /listings/:id`, `DELETE /listings/:id`
- `POST /listings/:id/submit` (owner; `DRAFT`/`REJECTED`, or idempotent `SUBMITTED`)
- `POST /listings/:id/images`, `GET /listings/:id/images`, image delete/reorder (own drafts)
- `GET /admin/listings/review` (admin; submitted listings)
- `POST /admin/listings/:id/approve`, `/reject` with `{ "reason": "..." }`, `/publish`
- `GET /public/listings` and `GET /public/listings/:id` (public catalog and ficha)

I06 and all later increments are explicitly excluded: availability, contact events, assisted admin, audit, deployment, payments, reservations, tourism, realtime flows, and any functionality introduced after I05.
