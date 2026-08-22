# Canonical Project State — Alquileres Uspallata

State: `READY_FOR_NEXT_NATURAL_IMPROVEMENT_HUMAN_GATE`

Repository: `/home/sjo1848/dev/alquileres-uspa`

Base commit: `63748c09f20418e0ba1097ae036e8aa49db29c77`

Canonical branch: `main`
Canonical HEAD: `8bcdafbd947b9644c5db110a3b360b555c84f67a`

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

I10 is closed and canonically integrated at
`d2668443997a579d46539c10f62093c85410fdee`. Discovery is complete; the
pending Human Gate is documented in
`.orchestration/NEXT-NATURAL-IMPROVEMENT-DISCOVERY.md`.

The recommended next increment is **truthful availability and freshness in the
public catalog**, subject to material policy decisions about what counts as an
OWNER confirmation and how `UNAVAILABLE`/`STALE` results behave in discovery.
Do not implement it before approval.

- The I10 follow-up email action remains a postponed, bounded UI
  discoverability candidate: owner-scoped visitor email already exists as a
  `mailto:` link; WhatsApp remains out of scope pending consent/data policy.
- The 180-day ContactEvent retention target has no automated deletion and
  remains an explicit enforcement gap. Cookie-authenticated state changes also
  need a future CSRF review; neither debt is silently included in the proposed
  product increment.

## I11 current state

I11 — Truthful availability and freshness in the public catalog is implemented,
human accepted and canonically closed. Read, in order:

1. `.orchestration/I11-TASK-CONTRACT.md`
2. `.orchestration/I11-RUNTIME-EVIDENCE.md`
3. `.orchestration/I11-HUMAN-ACCEPTANCE.md`

I11 candidate SHA: `d378b83aa4fb6c23f0fa74908458fe299e63037f`.
Human Product Acceptance: `PASS` with zero new blocking findings.
Canonical closure SHA: `8c5c0448838dbc5eca7bc37804d9ec33b284512a`.

The implementation makes `lastConfirmedAt` nullable and truthful, keeps
unavailable/stale listings visible, adds opt-in `Solo disponibles`, aligns
catalog/detail copy and preserves public contact. No next improvement is
authorized; discovery is pending the next Human Gate in
`.orchestration/NEXT-NATURAL-IMPROVEMENT-POST-I11.md`.
