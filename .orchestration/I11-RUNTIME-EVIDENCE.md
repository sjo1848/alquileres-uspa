# I11 runtime evidence and continuation checkpoint

Status: `READY_FOR_I11_HUMAN_PRODUCT_ACCEPTANCE`
Implementation base: `0fb88d2c75984904f340cc669d42ec7d23ebb85c`
Candidate SHA: recorded in `PROJECT-STATE.md` after durable commit

## Contract and implementation

Task Contract: `.orchestration/I11-TASK-CONTRACT.md`.

I11 implements the approved semantics:

- `Listing.lastConfirmedAt` is nullable and has no creation default.
- Historical timestamps that cannot be proven to be OWNER confirmations are
  nulled by migration `20260822000000_truthful_availability_confirmation`.
- Creation and unrelated listing edits do not confirm availability.
- Authenticated OWNER availability changes and reconfirmation do confirm it.
- Public catalog retains unavailable and stale/unconfirmed inventory without
  ranking changes.
- `availableOnly=true` is opt-in and OFF by default; it filters only AVAILABLE.
- Cards and detail show availability and freshness consistently, with neutral
  copy for stale/unconfirmed states and no `Invalid Date`.
- Loading, error/retry, empty and gallery-empty states are available on changed
  surfaces; responsive CSS reuses existing project primitives.
- Public contact flow is unchanged and remains operational.

Explicitly excluded: email/WhatsApp, phone/consent, chat, notifications,
lead-state expansion, amenities, gallery redesign, calendar, reservations,
payments, retention jobs, generic mobile redesign, CSRF/rate-limit hardening,
deployment and production infrastructure.

## Evidence executed

| Evidence | Result |
| --- | --- |
| API tests | PASS — 102 tests |
| Web tests | PASS — 25 tests |
| `pnpm test` | PASS — 127 tests total |
| `pnpm lint` | PASS |
| `pnpm format:check` | PASS |
| `pnpm security:check` | PASS |
| `pnpm build` | PASS |
| Prisma validate | PASS against isolated PostgreSQL 16 |
| `pnpm migration:evidence` | PASS; legacy fixture inserted before I11 SQL, nullable/no-default/cleanup verified |
| `pnpm i11:integration` | PASS; default catalog, opt-in filter, OWNER confirmation/reconfirm and contact regression |
| Browser journey | PASS for catalog, filter empty/reset, unavailable visibility, detail, empty gallery and contact feedback |

The migration evidence runner is `scripts/i11-migration-evidence.mjs`. It
constructs an isolated schema by applying migrations before I11, inserts a
legacy timestamped row, applies I11 exactly once, verifies cleanup and
nullable/no-default metadata, then drops only its generated schema. CI runs it
after normal Prisma deployment with `I11_PSQL_BIN=psql`.

The vertical runner is `scripts/i11-integration.mjs`. It is environment-driven
and uses synthetic data only; it does not contain production credentials.

## Local runtime used for verification

- Web: `http://localhost:5174/`
- API: `http://localhost:3300`
- Published listing detail: `http://localhost:5174/listings/i11-acceptance-available`
- OWNER area: `http://localhost:5174/owner`
- Isolated PostgreSQL: local temporary container on port `55432`.
- Seed: `DATABASE_URL=postgresql://alquileres:alquileres@localhost:55432/alquileres?schema=public pnpm i11:acceptance-seed`.

Synthetic credentials for Human Acceptance:

- OWNER A: `owner-i11-a@example.test` / `password123`
- OWNER B: `owner-i11-b@example.test` / `password123`

Seeded listing states:

- `i11-acceptance-available`: OWNER A, `AVAILABLE/UNCONFIRMED`.
- `i11-acceptance-unavailable`: OWNER B, `UNAVAILABLE/FRESH`.
- `i11-acceptance-stale`: OWNER A, `AVAILABLE/STALE`.

No production data, deployment or infrastructure change was used.

## Critics and REWORK

Workers:

- Heisenberg — backend/persistence/API worker.
- Hubble — public catalog/detail frontend worker.
- Boole — evidence/test REWORK worker.
- Pasteur — Product/UX REWORK worker.

Independent critics:

- Maxwell — initial technical/security critic; found UI copy and evidence gaps.
- Anscombe — initial Product/UX critic; found missing retry/gallery-empty and
  weak stale/unconfirmed visual distinction.
- Kepler — final technical/security critic; PASS after runner/CI REWORK.
- Banach — final Product/UX critic; PASS after UI REWORK.

Critics were separate workers, received no other critic outputs, did not edit
files and attempted to falsify implementation. Independence is evidenced by
separate prompts and independent PASS/FAIL reports.

REWORK loops:

1. Added neutral availability copy, explicit retry/recovery, gallery-empty
   placeholder, distinct stale/unconfirmed markers and visible focus.
2. Added controlled-time OWNER/ADMIN mutation tests and ValidationPipe filter
   coverage.
3. Rebuilt migration evidence so I11 SQL is applied once after a legacy fixture,
   and integrated it into CI.
4. Added reproducible synthetic seed and vertical I11 integration runner.

Known non-blocking debt remains outside I11: 180-day ContactEvent deletion is
not automated; CSRF and public-contact abuse/rate-limit concerns remain in the
security/production-hardening backlog. The pre-existing Docker volume on port
5432 has credential drift and was not destroyed.

## Autonomy and portability

- `human_coordination_messages`: 0 after Human Gate approval.
- Routine decisions/escalations: resolved by Codex and workers; no human relay.
- Runtime capability gap: none for implementation/critique; worker thread limit
  required closing completed workers before final critics, handled autonomously.
- Another runtime needs this file, `I11-TASK-CONTRACT.md`,
  `I11-HUMAN-ACCEPTANCE.md`, `PROJECT-STATE.md`, the repository and the final
  candidate SHA. No narrative handoff is required.
