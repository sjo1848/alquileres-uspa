# Canonical Project State — Alquileres Uspallata

State: `READY_FOR_I10_HUMAN_PRODUCT_ACCEPTANCE`

Repository: `/home/sjo1848/dev/alquileres-uspa`

Base commit: `63748c09f20418e0ba1097ae036e8aa49db29c77`

Acceptance candidate branch: `i10-owner-lead-inbox-acceptance`
Acceptance candidate commit: `b464bcb270c034a45d062d80c3a6921bcb450c8c`

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
- Retention target is 180 days; automated deletion is not implemented and is
  explicitly recorded as an enforcement gap.
- Out of scope remains WhatsApp, notifications, chat, CONTACTED/CLOSED,
  calendar, amenities, payments, reservations and unrelated improvements.

## Evidence status

- API: 94 tests passed.
- Web: 20 tests passed.
- Full test suite: passed.
- Lint, format, security and build: passed.
- Prisma schema validation: passed with a valid test DATABASE_URL.
- All eight migrations, including I10, applied to isolated PostgreSQL 16.
- Versioned HTTP integration runner passed.
- Browser OWNER journey passed at desktop and was visually checked at 390x844.
- Critics initially failed; REWORK completed and evidence persisted.
- Local API/web are prepared for Sebastián's manual Product Acceptance; no
  Product Acceptance has been declared.

## Continue from here

Do not implement another increment automatically. Await Sebastián's manual
Product Acceptance PASS/FAIL findings. Any future product change requires a
new Human Gate or explicit Task Contract.
