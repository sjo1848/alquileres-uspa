# Canonical Project State — Alquileres Uspallata

State: `I10_PRODUCT_ACCEPTED_CANONICAL_MAIN`

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

- Human Product Acceptance: `PASS` on 2026-08-22.
- Task Contract: `.orchestration/I10-TASK-CONTRACT.md`.
- Runtime evidence: `.orchestration/I10-RUNTIME-EVIDENCE.md`.
- Human acceptance prep: `.orchestration/I10-HUMAN-ACCEPTANCE.md`.
- OWNER routes: `GET /owner/contact-events`, `GET /owner/contact-events/:id`,
  `PATCH /owner/contact-events/:id/state`.
- State values are exactly `UNREAD` and `READ`.
- Ownership is enforced from authenticated OWNER plus related listing owner.
- ADMIN has no global visitor-PII inbox.
- Mobile was accepted for I10. A non-blocking mobile UX improvement debt is
  retained for future prioritization; the Human Gate did not specify a more
  granular defect.

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
- Human Product Acceptance passed: public inquiry, OWNER A authentication and
  inbox inspection, READ/UNREAD transitions, OWNER B isolation and mobile.

## Continue from here

I10 is closed. Reconstruct and prioritize the next natural product improvement;
do not implement it before its Human Gate approval.
