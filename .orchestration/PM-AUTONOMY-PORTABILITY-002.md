# PM-AUTONOMY-PORTABILITY-002 — Discovery, critique and prioritization

Status: `READY_FOR_I10_HUMAN_PRODUCT_ACCEPTANCE`

Date: 2026-08-21

Repository: `/home/sjo1848/dev/alquileres-uspa`

Canonical checkout: `main` at `63748c09f20418e0ba1097ae036e8aa49db29c77`

The discovery Human Gate was approved on 2026-08-21. I10 was implemented
without expanding scope. Current execution state and evidence are in
`.orchestration/PROJECT-STATE.md`, `.orchestration/I10-RUNTIME-EVIDENCE.md`
and `.orchestration/I10-HUMAN-ACCEPTANCE.md`.

## 1. Canonical Project State reconstructed

### Product

Alquileres Uspallata is a local-first marketplace/catalog for public lodging
listings. The current product supports three actors:

- visitante: public catalog, filters, listing detail, images, availability/freshness and contact form;
- OWNER: account/session, own listing CRUD, images, submission, availability and reconfirmation;
- ADMIN: review queue, approval/rejection/publication, assisted listing operations and audit.

The current product flow is:

`OWNER creates → ADMIN reviews/publishes → visitante discovers → visitante contacts → ContactEvent persisted`

The flow stops operationally after persistence: there is no OWNER surface to
discover, read or manage the resulting consultation.

### Current capabilities confirmed

| Capability              | Current state                                                                                          | Evidence                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Public catalog          | Implemented: published listings, location/price/guest filters, pagination                              | `apps/web/src/views/HomeView.vue`; `apps/api/src/listings/listings.service.ts`; README public catalog section              |
| Public detail/images    | Implemented; internal ownership/storage fields are not exposed                                         | `apps/web/src/views/ListingView.vue`; public listing controller/service/tests                                              |
| Availability/freshness  | Implemented as global `AVAILABLE/UNAVAILABLE`, owner reconfirmation and 30-day FRESH/STALE calculation | `schema.prisma`; `listings.service.ts`; `ListingView.vue`; migration `20260817000000_listing_availability_freshness`       |
| Visitor contact capture | Implemented: public form, server-side listing/owner resolution, `ContactEvent` persistence             | `ListingView.vue`; `contact.controller.ts`; `contact.service.ts`; contact tests; migration `20260818000000_direct_contact` |
| OWNER listing workflow  | Implemented: own listing CRUD, images, submit, availability/reconfirm                                  | `AreaView.vue`; `listings.controller.ts/service.ts`                                                                        |
| ADMIN workflow          | Implemented: review, publication, assisted operations and audit                                        | `AdminView.vue`; `admin-listings.controller.ts`; `admin-audit.service.ts`; migration `20260819000000_admin_assisted_audit` |
| OWNER lead inbox        | Not implemented                                                                                        | No `ContactEvent` read route, OWNER UI or lead state found                                                                 |
| WhatsApp                | Not implemented                                                                                        | No owner phone/WhatsApp field, URL or public CTA found                                                                     |
| Structured amenities    | Not implemented                                                                                        | Listing has title, description, location, price, max guests and images only                                                |
| Date calendar           | Not implemented                                                                                        | Only global availability exists; no date/range model                                                                       |

### Canonical repository/Git state

- Worktree was clean: `git status --short --branch` reported `main...origin/main`.
- `origin/main` and local `HEAD` are the same commit.
- `git ls-remote --heads origin` exposed the I01–I09/recovery branches and current `main`; no newer remote branch was found.
- README says I09 is operational QA only and excludes payments, reservations, tourism, realtime flows and notifications.
- CI defines security check, formatting, Prisma deploy, lint, tests and build; it does not deploy production.

## 2. Evidence used and evidence limits

### Direct evidence used

- Source files and tests under `apps/api/src`, `apps/web/src`.
- `apps/api/prisma/schema.prisma` and all seven migrations.
- `README.md`.
- `docs/recovery-001-closeout.md`, `docs/recovery-001-traceability.md`, `docs/recovery-001-r1-runtime-evidence.md`.
- Git status, log, branch refs, remote heads and CI workflow.
- Local validation on this checkout:
  - `pnpm security:check`: passed, 91 text files scanned.
  - `pnpm format:check`: passed.
  - `pnpm lint`: passed for API and web.
  - `pnpm test`: passed, API 14 files/87 tests and web 2 files/17 tests.
  - `pnpm build`: passed for API and web.

The API test suite emits expected stderr from compensation-failure tests for
image storage; the command still exits successfully. This is test evidence,
not a product failure.

### Evidence not recoverable from this checkout

- No `.orchestration/` existed before this artifact.
- No versioned Project Method, Project State or Task Contracts were found.
- The full Design Package is explicitly absent from `main` in the traceability document.
- Raw Playwright snapshots/logs are not committed.
- `output/playwright/r5/QA-REPORT.md`, referenced by closeout, is not present in this checkout.
- No real pilot users, lead volume, conversion, search failure, amenities demand or calendar demand evidence is persisted.

The recovery closeout records that local integrated journeys were run, but the
raw artifacts are not independently reconstructable here. That claim is
treated as documented historical evidence, not as a substitute for current
source inspection.

### Resolved contradictions / REWORK

1. Two workers reported partial or inconclusive test runs and different counts.
   The primary runtime re-ran the current checkout and established the
   canonical result: 104 tests passed (87 API + 17 web). The differing worker
   reports are not used as final execution evidence.
2. Historical README/traceability references older recovery branches and
   baselines. Current `main`/HEAD and current source were used as canonical;
   historical baselines remain provenance only.
3. `ContactEvent` existence was challenged against product completeness. The
   conclusion is explicit: persistence/capture is implemented, OWNER
   reception/operation is not.
4. `lastConfirmedAt` defaults to `now()`, which can make a new listing appear
   FRESH without an explicit reconfirmation. This is an unresolved product
   semantics risk, not evidence to expand the next increment.

## 3. Candidate evaluations

### A. OWNER consultation/lead management

**Requirement → Expected Surface → Current Evidence → Gap → Acceptance Evidence**

Visitor contact must become visible, recoverable work for the correct OWNER.
Expected surface: OWNER UI + authenticated API + existing persistence +
server-side security; no background worker required for v1. Current evidence:
public form and `POST /public/listings/:id/contact` create a `ContactEvent`
with server-resolved `ownerId`, listing, visitor, message and timestamp. Gap:
no OWNER read endpoint, inbox, context view, read state or operational action.
Acceptance evidence: an integrated public-contact → OWNER-inbox journey; only
the target OWNER can read it; OWNER B cannot access OWNER A's event; listing,
visitor, message and timestamp remain visible after reload/restart; UI exposes
loading, empty, error and expired-session states.

Value: visitor 4/5, OWNER 5/5, ADMIN 2/5. Complexity/risk: medium, with
privacy and ownership risk. Reversibility: high. Pilot learning: high.

### B. Direct contact / WhatsApp

**Requirement → Expected Surface → Current Evidence → Gap → Acceptance Evidence**

Visitor should have a lower-friction direct channel. Expected surface: public
UI + owner phone/WhatsApp configuration + validation/privacy/operation. Current
evidence: only form contact exists; no phone, WhatsApp URL or consent policy.
Gap: new data model, owner setup, international format/visibility, fallback and
lead measurement. Acceptance would require a configured and safely exposed
channel while defining whether a WhatsApp click also creates a measurable lead.

Value: visitor 5/5, OWNER 4/5, ADMIN 2/5. Complexity/risk: medium and
externally coupled. Reversibility: medium-high. Pilot learning: medium.

### C. Rich information / structured amenities

**Requirement → Expected Surface → Current Evidence → Gap → Acceptance Evidence**

Visitor should compare trustworthy lodging attributes. Expected surface: OWNER
editing + API + persistence + ADMIN review/publication + public detail, with
optional search filters. Current evidence: description, capacity, location,
price and images only. Gap: taxonomy, validation, editorial ownership, legacy
compatibility and data population. Acceptance would require OWNER/ADMIN/public
journey with approved amenities and no private-field leakage.

Value: visitor 4/5, OWNER 3/5, ADMIN 3/5. Complexity/risk: medium-high.
Reversibility: medium-high. Pilot learning: medium, currently unsupported by
real demand/data evidence.

### D. Search improvements

**Requirement → Expected Surface → Current Evidence → Gap → Acceptance Evidence**

Visitor should find relevant published listings efficiently. Expected surface:
UI + API, possibly indexes/persistence. Current evidence: location, price,
guests, deterministic pagination and empty/error states already exist. Gap:
no evidence of a specific failed search or demand for additional filters;
availability/freshness and richer text/amenity search are absent. Acceptance
must be tied to observed search behavior and deterministic combined-query
tests, not merely more controls.

Value: visitor 4/5, OWNER 3/5, ADMIN 2/5. Complexity/risk: medium.
Reversibility: high. Pilot learning: medium only after measurement exists.

### E. Availability/freshness improvements

**Requirement → Expected Surface → Current Evidence → Gap → Acceptance Evidence**

Visitor should trust that availability is current. Expected surface: public
cards/ficha + OWNER operation + API/persistence + policy/background if reminders
are introduced. Current evidence: global availability, reconfirmation, 30-day
freshness and ficha display exist. Gap: cards do not expose freshness clearly,
API has no freshness filter/reminder, and default `now()` semantics are not
product-validated. Acceptance must define never-confirmed, stale, boundary and
reconfirmed cases across OWNER, catalog and ficha.

Value: visitor 4/5, OWNER 4/5, ADMIN 2/5. Complexity/risk: low-medium.
Reversibility: high. Pilot learning: medium-high. This is the strongest
secondary candidate, not the recommended next increment.

### F. Simple availability calendar

**Requirement → Expected Surface → Current Evidence → Gap → Acceptance Evidence**

Visitor should understand availability for concrete dates. Expected surface:
new date/range persistence + OWNER/ADMIN operations + public UI/API + overlap,
timezone and semantics rules. Current evidence: only a global boolean exists.
Gap: date model, blocked ranges, validation, conflicts and reservation
boundary. Acceptance would require explicit date semantics and proof that it is
not a reservation promise while preserving existing listings.

Value: visitor 5/5, OWNER 5/5, ADMIN 3/5. Complexity/risk: high.
Reversibility: low-medium. Pilot learning: medium. Postpone.

## 4. Comparative matrix

Scores are qualitative: 1 low, 5 high. Complexity/risk is scored high when it
increases delivery risk; lower is better for prioritization.

| Candidate                         | Visitor value | OWNER value | ADMIN value | Gap evidence | Surface breadth | Complexity/risk | Pilot learning | Reversibility | Priority |
| --------------------------------- | ------------: | ----------: | ----------: | -----------: | --------------: | --------------: | -------------: | ------------: | -------: |
| OWNER lead inbox                  |             4 |           5 |           2 |            5 |               3 |               2 |              5 |             5 |        1 |
| Availability/freshness visibility |             4 |           4 |           2 |            4 |               3 |               2 |              4 |             5 |        2 |
| Amenities                         |             4 |           3 |           3 |            3 |               4 |               3 |              3 |             4 |        3 |
| Search improvements               |             4 |           3 |           2 |            3 |               3 |               3 |              3 |             4 |        4 |
| WhatsApp                          |             5 |           4 |           2 |            2 |               3 |               3 |              3 |             4 |        5 |
| Calendar                          |             5 |           5 |           3 |            2 |               5 |               5 |              3 |             2 |        6 |

Priority is not a claim about maximum theoretical market value. It combines
proven gap, existing capability, pilot learning, low dependency and safe
reversibility.

## 5. Recommendation for the next increment

Recommend: **I10 — OWNER consultation inbox v1**.

It completes an already-started loop:

`visitor submits → server associates → OWNER discovers, reads and acts`

It reuses `ContactEvent`, listing ownership and existing OWNER session/UI. It
does not require WhatsApp, background jobs, notifications, reservations or
new infrastructure.

### Proposed scope

- Authenticated OWNER endpoint to list only that OWNER's consultations.
- Server-side filtering by authenticated `ownerId`; no client-supplied actor.
- Listing context, visitor name/email, message and timestamp.
- Bounded ordering/pagination appropriate to existing data volume.
- OWNER UI integrated into `/owner`.
- Loading, empty, error and expired-session states.
- Minimal read interaction only if approved at the Human Gate.
- Ownership, privacy and integrated journey tests.

### Preliminary acceptance criteria

1. A valid visitor submission for an approved/published listing is persisted
   with the listing's owner, independently of visitor-supplied owner data.
2. The target OWNER can list and inspect the consultation with listing,
   visitor, message and timestamp.
3. A different OWNER cannot read or mutate the consultation; the server
   enforces the boundary.
4. The UI has explicit loading, empty, error and session-expired behavior.
5. Results are deterministically ordered and bounded.
6. Existing public contact and OWNER listing journeys remain green.
7. The integrated acceptance journey proves
   `public listing → contact → OWNER inbox → inspect` against PostgreSQL.
8. No password, session token, storage key or unrelated private owner data is
   exposed.

### Out of scope

- WhatsApp, phone configuration and external messaging.
- Email/push/SMS notifications or background jobs.
- Chat or in-platform replies.
- CRM/scoring/automation and complex lead statuses.
- Reservations, payments, contracts or calendar dates.
- Amenities and broad search redesign.
- Production, deployment, hosting, outreach or infrastructure changes.

### Risks

- Cross-OWNER data leakage: mitigate with server-derived ownership and A/B
  authorization tests.
- Visitor PII retention/privacy: policy is not present and requires human
  authority.
- Ambiguous meaning of “read”: avoid adding persistence until chosen at Gate.
- Listing deletion cascades contact events under current schema: policy must be
  accepted before treating the inbox as durable CRM.
- Spam/abuse: no rate limiting or moderation policy is currently evidenced;
  keep v1 read-only and do not expand into notification delivery.

## 6. Specialists, critics and independence

Workers used:

- OWNER/lead specialist: `Linnaeus`, analyzed capture vs operational gap.
- Visitor/opportunity specialist: `Einstein`, compared visitor candidates.
- Independent critic A: `Hypatia`, separately prioritized candidates.
- Independent critic B: `Tesla`, separately prioritized candidates.

Critics were spawned independently and were not given other workers' outputs.
Their convergence on the OWNER inbox is therefore evidence of independent
agreement. One worker incorrectly described the runtime as lacking workers;
that statement was superseded by direct runtime evidence and is recorded as a
worker observation, not a project fact.

Discovery workers did not edit files. I10 implementation was later delegated to
backend worker `Fermat` and frontend worker `Erdos`; their changes are covered
by the I10 Task Contract and runtime evidence files.

## 7. Autonomy metrics

- `human_coordination_messages`: 0.
- Human interventions required during discovery: 0.
- Unnecessary escalations: 0.
- Material decisions resolved autonomously: canonical HEAD, capability inventory,
  API-vs-product distinction, candidate comparison, evidence conflict and
  stop condition.
- Specialists used: 2.
- Independent critics used: 2.
- Evidence of independence: critics received separate prompts and returned
  separate analyses without shared results; both independently selected the
  same next increment.
- REWORK loops: 1 explicit evidence reconciliation; historical-documentation
  contradiction review; test-count/runtime discrepancy review.
- Runtime capability gap: `RUNTIME_CAPABILITY_GAP` — no Project Method,
  Project State, Task Contracts or prior `.orchestration/` artifacts were
  recoverable from this checkout. The prompt's required phases were applied
  as a fallback and this file bootstraps the missing portable state.
- Method conversation dependency: none after the initial experiment request;
  no human was needed to relay messages or coordinate workers.

## 8. Portability handoff

Another runtime can continue from this file by:

1. checking out `/home/sjo1848/dev/alquileres-uspa` at `63748c0`;
2. reading this document and the linked README/recovery evidence;
3. resolving only the Human Gate decisions below;
4. reading `.orchestration/I10-TASK-CONTRACT.md`,
   `.orchestration/PROJECT-STATE.md` and `.orchestration/I10-RUNTIME-EVIDENCE.md`;
5. treating I10 as implemented and ready for runtime transfer, not starting a
   new increment automatically.

The Human Gate decision and I10 implementation state are persisted; no
conversation narrative is required to continue.

## 9. Human Gate decision recorded

The following decisions were approved on 2026-08-21:

1. **I10 — OWNER consultation inbox v1** is approved.
2. Lead state is exactly `UNREAD/READ`, with reversible state action.
3. WhatsApp, notifications, replies, reservations, calendar, amenities and
   unrelated improvements remain out of scope.
4. Retention target is 180 days; automated deletion is not implemented and is
   documented as an enforcement gap.

Technical implementation details were resolved autonomously.

`READY_FOR_I10_HUMAN_PRODUCT_ACCEPTANCE`
