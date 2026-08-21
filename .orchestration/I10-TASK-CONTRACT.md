# I10 — OWNER Lead Inbox Task Contract

Status: `READY_FOR_I10_HUMAN_PRODUCT_ACCEPTANCE`

Approved at Human Gate: 2026-08-21

Repository checkpoint before implementation: `63748c09f20418e0ba1097ae036e8aa49db29c77`

Final I10 acceptance candidate: branch `i10-owner-lead-inbox-acceptance`,
commit `b464bcb270c034a45d062d80c3a6921bcb450c8c`.

Acceptance readiness rule: `PRODUCT_ACCEPTANCE_READY` requires a durable,
reproducible candidate normally identified by commit SHA; a working-tree
fingerprint is BUILD evidence only.

## Requirement → Expected Surface → Acceptance → Evidence

| Requirement                                    | Expected surface                                   | Acceptance                                                                                                             | Evidence                                                                                                     |
| ---------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Visitor contact becomes an OWNER-operable lead | Public UI + public API + persistence               | Public listing contact creates one `ContactEvent` as `UNREAD`, associated server-side to the listing owner             | Existing `ListingView.vue`, `ContactService`, `ContactEvent`; add state persistence and integration coverage |
| OWNER sees only own leads                      | Authenticated OWNER API + authorization + OWNER UI | OWNER A lists/reads only events for listings owned by A; OWNER B cannot access A events; ADMIN has no global PII inbox | Server derives owner from session and query relation; add A/B tests                                          |
| OWNER can discover inbox state                 | OWNER UI + API                                     | `/owner` exposes Consultas, unread count, loading, empty and error states                                              | `AreaView.vue`, existing session API; add UI tests/integration evidence                                      |
| OWNER can inspect visitor and listing context  | API + UI                                           | Each lead shows visitor name/email, message, timestamp, listing title/context                                          | Select only approved lead fields; UI renders responsive context                                              |
| OWNER can transition lead state                | Persistence + API + UI                             | Opening/explicit action marks `READ`; OWNER can restore `UNREAD` if UI exposes it; no CONTACTED/CLOSED                 | Enum and guarded mutation; transition tests                                                                  |
| Privacy retention is bounded                   | Persistence/operation/documentation                | Current policy is 180 days; no silent scope expansion to automated deletion                                            | Document enforcement gap if deletion is not implemented in I10                                               |
| Existing public contact remains intact         | Public UI/API/persistence                          | Valid contact still returns `RECEIVED`; invalid/non-public behavior remains unchanged                                  | Existing contact tests plus vertical integration test                                                        |

## Approved scope

- Add `UNREAD` and `READ` lead state, defaulting new events to `UNREAD`.
- Add authenticated OWNER list/count/read-state API, constrained by persisted
  listing ownership.
- Add OWNER Consultas UI within existing `/owner` experience.
- Display listing context, visitor data, message and timestamp.
- Mark `READ` on explicit/open action and expose restore to `UNREAD`.
- Add loading, empty, error, session-expired and responsive/mobile behavior.
- Add unit, authorization, UI and real API/DB integration evidence where the
  current repository test harness supports it.
- Preserve 180-day retention as the authoritative policy and document that
  automated deletion is not implemented in I10 unless separately evidenced.

## Out of scope

WhatsApp, notifications, platform replies/chat, CONTACTED/CLOSED states,
calendar availability, amenities, payments, reservations, unrelated search or
availability improvements, deployment, production and infrastructure changes.

## Security invariants

- Never accept `ownerId` from the client for lead reads or mutations.
- Every lead query must constrain through `listing.ownerId = session.user.id`.
- ADMIN does not receive a global visitor-PII inbox in I10.
- Do not return password, session, storage or unrelated owner-private fields.

## Required verification

- `pnpm security:check`
- `pnpm format:check`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- real UI/API integration for public contact → OWNER inbox → read/unread
- independent product/UX and technical/security critics
- autonomous REWORK for every failed or materially incomplete criterion

## Stop condition

Do not declare Product Accepted and do not begin another increment. Stop at
`READY_FOR_I10_HUMAN_PRODUCT_ACCEPTANCE` with the local app prepared and the
manual journey persisted in `.orchestration/I10-HUMAN-ACCEPTANCE.md`.
