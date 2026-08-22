# Canonical Project State — Alquileres Uspallata

State: `READY_FOR_I10_HUMAN_PRODUCT_ACCEPTANCE`

Repository: `/home/sjo1848/dev/alquileres-uspa`

Base commit: `63748c09f20418e0ba1097ae036e8aa49db29c77`

Acceptance candidate branch: `i10-owner-lead-inbox-acceptance`
Acceptance candidate commit: `a3471a9c01705299cea1b62367c4699d2bab1c01`

`PRODUCT_ACCEPTANCE_READY` requires a durable, reproducible candidate,
normally identified by commit SHA. A working-tree fingerprint is BUILD
evidence only and is not sufficient for Human Product Acceptance.

## Current product

Public catalog, listing detail/images, availability/freshness, visitor contact
capture, OWNER listing workflow and ADMIN review/assistance/audit exist.

I10 now completes the visitor-to-OWNER lead loop:

`public listing → visitor contact → ContactEvent UNREAD → OWNER Consultas → READ/UNREAD`

## I10 current state

- Approved at Human Gate.
- Task Contract: `.orchestration/I10-TASK-CONTRACT.md`.
- Runtime evidence: `.orchestration/I10-RUNTIME-EVIDENCE.md`.
- Human acceptance prep: `.orchestration/I10-HUMAN-ACCEPTANCE.md`.
- OWNER routes: `GET /owner/contact-events`, `GET /owner/contact-events/:id`,
  `PATCH /owner/contact-events/:id/state`.
- State values are exactly `UNREAD` and `READ`.
- Ownership is enforced from authenticated OWNER plus related listing owner.
- ADMIN has no global visitor-PII inbox.

## Human acceptance finding and repair

The previous candidate failed Human Product Acceptance in the two-subdomain
Quick Tunnel environment: login returned 201, but the browser rejected the
session cookie, so `/auth/me` and OWNER routes returned 401. The root cause
was the default `SameSite=Lax` cookie policy for a cross-site frontend/API
deployment.

The repair is persisted in candidate `a3471a9c01705299cea1b62367c4699d2bab1c01`:
explicit `COOKIE_SAME_SITE=none` forces `Secure=true`, while local defaults
remain `Lax` and non-secure. Fresh browser sessions verified OWNER A and B,
logout/account switching, inbox access and invalid-session redirect.
- Retention target is 180 days; automated deletion is not implemented and is
  explicitly recorded as an enforcement gap.
- Out of scope remains WhatsApp, notifications, chat, CONTACTED/CLOSED,
  calendar, amenities, payments, reservations and unrelated improvements.

## Evidence status

- API: 96 tests passed.
- Web: 20 tests passed.
- Full test suite: passed.
- Lint, format, security and build: passed.
- Prisma schema validation: passed with a valid test DATABASE_URL.
- All eight migrations, including I10, applied to isolated PostgreSQL 16.
- Versioned HTTP integration runner passed.
- Browser OWNER journey passed from fresh sessions with exact OWNER A/B
  credentials, including logout/account switching and invalid-session redirect.
- Critics initially failed; REWORK completed and evidence persisted.
- Local API/web are prepared for Sebastián's manual Product Acceptance; no
  Product Acceptance has been declared.

## Continue from here

Do not implement another increment automatically. Await Sebastián's manual
Product Acceptance PASS/FAIL findings. Any future product change requires a
new Human Gate or explicit Task Contract.
