# I10 runtime evidence and continuation checkpoint

Status: `READY_FOR_I10_HUMAN_PRODUCT_ACCEPTANCE`

Generated after implementation and REWORK on 2026-08-21.

Human acceptance preparation is persisted in
`.orchestration/I10-HUMAN-ACCEPTANCE.md`.

## Canonical implementation checkpoint

Repository: `/home/sjo1848/dev/alquileres-uspa`

Base product commit: `63748c09f20418e0ba1097ae036e8aa49db29c77`

Acceptance candidate branch: `i10-owner-lead-inbox-acceptance`

Acceptance candidate commit: `b464bcb270c034a45d062d80c3a6921bcb450c8c`

All technical evidence below corresponds to the I10 implementation in that
candidate commit; the later metadata checkpoint does not change product code.

I10 working tree changes are the files shown by `git status --short`; no
feature outside the approved contract was changed.

Task Contract: `.orchestration/I10-TASK-CONTRACT.md`

Project State: `.orchestration/PROJECT-STATE.md`

## Implementation

- `ContactEventState` enum: `UNREAD | READ`.
- New public contacts persist `UNREAD`.
- OWNER API:
  - `GET /owner/contact-events`
  - `GET /owner/contact-events/:id`
  - `PATCH /owner/contact-events/:id/state` with `{ state: "READ" | "UNREAD" }`
- Queries and mutations require both the persisted event owner and the
  related listing owner to equal the authenticated OWNER.
- OWNER UI is integrated in `/owner` under `Consultas`.
- UI includes listing title/location, visitor name/email, message, timestamp,
  unread count, READ/UNREAD action, loading, empty, error/retry and session
  expiry behavior.
- Mobile CSS makes the state action full-width below 640px.
- Retention policy is displayed as 180 days. Automated deletion is **not
  implemented in I10**; this is an explicit enforcement gap and not a hidden
  scope expansion.
- No ADMIN global PII inbox exists.
- No WhatsApp, notifications, chat, CONTACTED/CLOSED, calendar, amenities,
  payments or reservations were added.

Migration: `apps/api/prisma/migrations/20260821000000_contact_event_state/`.

## Automated checks

Final local checks after REWORK:

| Check                                         | Result                                              |
| --------------------------------------------- | --------------------------------------------------- |
| `pnpm security:check`                         | PASS, 110 text files scanned                        |
| `pnpm format:check`                           | PASS                                                |
| `pnpm lint`                                   | PASS                                                |
| `pnpm test`                                   | PASS, API 15 files/94 tests; web 3 files/20 tests   |
| `pnpm build`                                  | PASS                                                |
| `DATABASE_URL=... pnpm prisma:validate`       | PASS                                                |
| `pnpm --filter @alquileres/api prisma:deploy` | PASS on isolated PostgreSQL 16 at `127.0.0.1:55435` |
| `node scripts/i10-integration.mjs`            | PASS                                                |

The repository's persisted Docker volume on port 5432 had historical
credentials that rejected the documented password. It was not destroyed or
reset for this experiment. An isolated temporary PostgreSQL container was used
instead; this runtime assumption is recorded rather than treated as product
failure.

## Reproducible vertical integration

The versioned runner is `scripts/i10-integration.mjs`. It exercises:

`public contact x2 → ContactEvent UNREAD → OWNER A inbox/count → READ → count -1 → UNREAD → count restored → OWNER B empty/404 isolation`

The run used a published synthetic listing owned by `owner-i10-a@example.test`
and a second synthetic OWNER. Final output:

```json
{
  "status": "PASS",
  "journey": "public contact → UNREAD → OWNER A inbox → READ → UNREAD",
  "ownerBIsolation": "PASS",
  "adminInbox": "not exposed by I10 route design",
  "retention": "180 days documented; automated deletion not implemented"
}
```

The runner is intentionally environment-driven; it does not contain
credentials or create production data.

## Browser evidence

Using the Playwright CLI against the running API/UI:

- OWNER A `/owner` snapshot showed `Consultas`, `1 sin leer`, `Cabaña I10`,
  visitor/email/message/listing location and `Marcar consulta como leída`.
- After the action, the snapshot showed `0 sin leer`, `Leída` and
  `Restaurar consulta como sin leer`.
- A 390x844 viewport screenshot was visually inspected. The Consultas card,
  visitor fields, email link, message and full-width restore action fit the
  mobile layout without horizontal overflow.
- Browser route/API origin was `http://127.0.0.1:5174` →
  `http://127.0.0.1:3302`; CORS was explicitly configured for this local run.

## Critics and REWORK

Independent critics:

- Product/UX critic: `Parfit` — initial `FAIL`; verified UI/state/scope and
  requested durable evidence and state update.
- Technical/security critic: `James` — initial `FAIL`; found missing
  relational ownership predicate, integration evidence, migration evidence and
  stale Project State.

Final re-review result: both `Parfit` and `James` returned `PASS` after REWORK;
remaining blocker count is zero. The 180-day automated-deletion gap is accepted
debt explicitly recorded in this checkpoint.

Critics were spawned independently, received no other critic output and did
not edit files. REWORK completed:

1. Added `listing.ownerId` to OWNER list/detail/state authorization predicates.
2. Updated the failing service expectation.
3. Added and executed `scripts/i10-integration.mjs` with two contacts and
   count/state/isolation assertions.
4. Ran Prisma validation and deployed all eight migrations on isolated
   PostgreSQL.
5. Persisted this evidence, Project State and the explicit retention
   enforcement gap.
6. Re-ran formatting, lint, tests and build successfully.

## Remaining debt

- Automated deletion after 180 days is not implemented. This is accepted as an
  explicit I10 enforcement gap, not silently deferred.
- The browser run uses synthetic local data and is not Product Acceptance.
- The existing persisted Docker volume credential mismatch remains a local
  runtime issue; no production state was touched.
- No deployment or production readiness work was performed.

## Autonomy metrics

- `human_coordination_messages`: 0 after the Human Gate approval.
- Human implementation interventions: 0.
- Workers: backend `Fermat`, frontend `Erdos`.
- Critics: `Parfit`, `James`; independent and non-editing.
- Worker/critic coordination delegated to runtime: 0 human relay messages.
- REWORK loops: 2 (route-contract mismatch; critic-driven ownership/evidence/
  portability corrections).
- Runtime capability gap: completed workers had to be closed before critics
  could spawn because the worker thread limit was reached. This was handled
  autonomously. No product decision was escalated.

## Exact next-runtime checkpoint

Another runtime should read, in order:

1. this file;
2. `.orchestration/PROJECT-STATE.md`;
3. `.orchestration/I10-TASK-CONTRACT.md`;
4. `README.md` and the recovery evidence documents;
5. `git diff` from base commit `63748c0`.

No next increment is authorized by this checkpoint. The next permitted action
is Sebastián's manual Product Acceptance of I10, not automatic implementation
of I11.
