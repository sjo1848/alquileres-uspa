# Next Natural Improvement Discovery — post-I11

State: `READY_FOR_NEXT_NATURAL_IMPROVEMENT_HUMAN_GATE`
Canonical source: `main` at `8c5c0448838dbc5eca7bc37804d9ec33b284512a`
I11 accepted: `PRODUCT_ACCEPTED` on 2026-08-22
Human coordination messages in this phase: `0`

## Canonical current state

I11 is implemented, Human Product Acceptance passed with no new findings, and
the candidate is canonically closed on `main`. The accepted product now has:

- public catalog and detail with location, price, capacity, images,
  availability and truthful freshness;
- default visibility of unavailable/stale listings and opt-in `Solo
  disponibles` filtering;
- visitor contact submission with server-derived listing ownership;
- authenticated OWNER listing management and `Consultas` inbox;
- OWNER `UNREAD`/`READ` state management with listing context and visitor
  email;
- ADMIN review, assisted listing workflows and audit surfaces.

Evidence sources: repository at the canonical SHA, `PROJECT-STATE.md`,
`I10-*`, `I11-*`, prior discovery, merged GitHub PR/CI records, and direct
inspection of the current API/web code.

Known debts remain separate from this product discovery:

- ContactEvent 180-day deletion is documented but not automatically enforced.
- Cookie-authenticated mutations need a CSRF review.
- Public contact creation needs abuse/rate-limit hardening.
- The historical local Docker database has credential drift.

These are not silently included in the recommended product increment.

## Candidates and evidence

Ratings are relative; they are not a substitute for acceptance evidence.

| Candidate | Requirement → Expected Surface | Current evidence → Gap | Value / cost / risk | Decision |
| --- | --- | --- | --- | --- |
| Explicit OWNER email action | OWNER `Consultas` card → visible `Responder por email` anchor; native UI/CSS only | `AreaView.vue` already exposes a clickable visitor `mailto:` under `Email`. I10 Human Acceptance explicitly observed that the next action after receiving/reading a consultation was not obvious. Gap is discoverability/affordance, not transport. | High OWNER value; low cost; low risk; reversible; no new PII/API/DB | **Recommend, bounded** |
| Manual OWNER freshness UX | OWNER listing editor → clearer pending/stale state and reconfirm action | I11 already validates confirmation semantics and exposes reconfirmation/status. No post-I11 human failure says OWNER cannot understand it. A later workflow slice is plausible, but the gap is not yet measured. | Medium value; low-medium cost; semantic risk if expanded to reminders | Postpone; no jobs/notifications |
| Amenities / structured information | OWNER editor + API/data + public detail; ADMIN review only if required | Schema has title, description, location, price, capacity and images; no taxonomy or structured amenities. This is a real capability gap, but no validated taxonomy, data supply or visitor demand evidence exists. | Potentially high value; medium cost; data-quality risk; medium reversibility | Postpone; do not bundle search |
| Search/filter expansion | Public API/UI/URL state | Location, price, capacity, pagination, loading/error/empty and availability filter already exist. No persisted failed search or missing criterion is evidenced. | Medium value; low-medium cost; over-filtering risk | Postpone pending demand evidence |
| Task-specific mobile improvement | One identified OWNER/visitor task → focused responsive UI | I10/I11 mobile surfaces were accepted; only a generic prior debt exists, with no reproducible task failure. | Uncertain value; medium scope risk | Reject generic redesign; require a concrete finding |
| Date calendar | New date-range persistence/API/OWNER/public surfaces and temporal rules | Current availability is global. No ranges, timezone, overlap, reservation or cancellation semantics exist. | Potentially high value; high complexity and misleading-availability risk | Reject now |
| Security/operational hardening | CSRF, retention, contact abuse/rate-limit, observability | Debts are real and production-relevant, but are not a natural visitor/product enhancement and are independently scoped. | High risk reduction; variable cost | Track as separate hardening increment |

### Explicit candidate contract: OWNER email action

| Requirement | Expected Surface | Current Evidence | Gap | Acceptance Evidence |
| --- | --- | --- | --- | --- |
| OWNER can identify the next action after inspecting a consultation | OWNER `Consultas` card, visible labeled anchor `Responder por email` | The email is already a `mailto:` link, but the Human I10 observation says the next action is not obvious | The existing transport is discoverable only as a data field | Human can open a consultation and identify the response action without instruction; browser evidence shows the labeled CTA |
| The action reaches only the displayed visitor email | UI helper and anchor; no API/persistence | Server-side inbox isolation already limits the displayed event to the authenticated OWNER's listings | Existing interpolation lacks an explicit mailto construction helper and focused encoding tests | Helper encodes the recipient safely for reserved/Unicode characters; unit tests cover `+`, `&`, Unicode and reserved characters; no ownerId is client-controlled |
| The action remains usable on mobile and keyboard | Existing Vue anchor and project CSS | I10 mobile inbox was accepted, but this specific affordance was not tested | No CTA-specific mobile/focus evidence | Manual/browser journey at 320/375/390px verifies visible, focusable, readable target and no overflow |
| The action does not imply platform chat or tracked reply | CTA copy and scope documentation | No reply, notification or chat capability exists | A misleading CTA could imply internal response tracking | Copy says it opens the OWNER's email client; no CONTACTED/CLOSED state, API, persistence, analytics or message prefill is added |

## Recommendation

Recommend the next increment as a narrowly bounded **OWNER “Responder por
email” discoverability slice**.

Why it wins: it directly addresses the only new product signal from I10, uses
an already functioning owner-scoped `mailto:` capability, requires no schema,
API, background process or external integration, and is easy to reverse. It
also gives the pilot a concrete task-level acceptance question: after opening
a lead, can an OWNER recognize and initiate the next action without guidance?

This recommendation is deliberately not presented as “email integration”. It
adds an explicit UI affordance over an existing browser capability.

The independent product critic challenged the priority because no measured
abandonment or confusion rate exists. The independent technical critic found
the candidate safe but required an encoding helper, focused tests and explicit
tunnel/mobile verification. Reconciliation: the I10 Human observation is
valid product evidence for a small candidate, but the contract must prove
discoverability and not claim a new transport capability.

## Proposed scope after Human Gate approval

- Add a clearly labeled `Responder por email` link/action to each OWNER lead.
- Reuse the existing owner-scoped visitor email; no new data collection.
- Add a small mailto builder with explicit recipient encoding and tests for
  reserved and Unicode characters.
- Keep the action free of subject/body prefill unless separately approved;
  default behavior is opening the OWNER's email client addressed to the
  visitor.
- Preserve `UNREAD`/`READ`, lead content, listing context and OWNER isolation.
- Verify desktop, keyboard and 320/375/390px mobile behavior.
- Verify the same behavior through the prepared local/tunnel runtime without
  changing authentication or CORS policy.

## Explicit exclusions

No API endpoint, persistence, reply tracking, CONTACTED/CLOSED state, chat,
platform replies, notifications, email sending, WhatsApp, visitor phone or
consent, email templates, subject/body prefill, CRM, analytics, amenities,
search expansion, calendar, reservations, payments, generic mobile redesign,
CSRF fix, retention job, rate limiting, deployment or infrastructure changes.

## Preliminary Human Product Acceptance journey

1. Use synthetic data and log in as OWNER A.
2. Open `Consultas` and select a lead belonging to OWNER A.
3. Verify the visitor email remains visible and a clearly labeled
   `Responder por email` action is present.
4. Activate it with mouse/touch and verify the browser opens the OWNER email
   client addressed to the exact visitor email.
5. Repeat with keyboard focus/activation.
6. Repeat at 320px, 375px and 390px; verify readable label, target clarity,
   no horizontal overflow and no loss of lead content.
7. Log in as OWNER B and verify its action is available only for B's own
   consultations; no A event or email is exposed.
8. Confirm READ/UNREAD and public contact submission remain unchanged.
9. Confirm the UI does not claim that a reply is sent, stored or tracked by
   the platform.

Human acceptance evidence should include the generated `mailto:` target (with
PII redacted except for test fixture identity), browser/mobile evidence and
regression results. Product acceptance must not be inferred from unit tests.

## Component decision: REUSE → ADAPT → CUSTOM

- **REUSE:** native Vue anchor, existing project CSS, existing inbox card and
  session/ownership behavior.
- **ADAPT:** a small local mailto helper and existing responsive action styles;
  no external component library materially improves this one-action surface.
- **CUSTOM rejected:** no framework, modal, email composer, chat widget or
  mail component is justified.

## Workers, critics, disagreement and REWORK

Workers/specialists, each with `fork_context=false` and no file edits:

- `Jason` — independent visitor/product specialist; recommended explicit
  email CTA and documented all candidate surfaces and acceptance evidence.
- `Socrates` — independent technical/operational specialist; agreed CTA is
  smallest candidate, highlighted ADMIN-confirmation ambiguity and kept
  hardening separate.

Independent critics, separately prompted and not given specialist outputs:

- `Wegener` — product/UX critic: **REWORK**; falsified any claim that a new
  email capability is missing and required task evidence for discoverability.
- `Nietzsche` — technical/security/integration critic: **REWORK acotado**;
  required explicit mailto encoding tests and mobile/tunnel verification,
  while confirming owner isolation and no need for API/persistence.

Reconciliation loop: retain the CTA recommendation because the Human I10
observation is direct evidence, narrow it to discoverability, add the critics'
encoding/mobile acceptance requirements, and exclude all transport, tracking
and automation. No implementation has started.

## Autonomy and portability

- `human_coordination_messages`: `0` after the I11 Human Gate.
- Human interventions required in this discovery: `0`.
- Routine decisions resolved autonomously: canonical closure, candidate scope,
  component reuse, API-vs-UI classification, security-debt separation and
  reconciliation of critic disagreement.
- Workers/specialists: `2`; independent critics: `2`.
- Independence evidence: all four received separate prompts with
  `fork_context=false`; critics received no specialist or peer output, did
  not edit files and issued independent challenge reports.
- REWORK loops: `1` candidate-recommendation reconciliation plus critic-driven
  contract tightening.
- Runtime capability gaps: none for this phase; multi-agent workers and GitHub
  evidence were available. `RUNTIME_CAPABILITY_GAP` was not required.
- Runtime assumptions: local repository and GitHub CLI are available; browser
  acceptance may use localhost or configured tunnels, with the API CORS origin
  and cookie settings matching the exact frontend origin. No package was added.
- Another runtime can continue from `main` at the canonical SHA by reading this
  file, `PROJECT-STATE.md`, I10/I11 artifacts and the repository. The only
  pending authority is the Human Gate decision on the bounded CTA contract.

## Material Human Gate decisions

1. Approve or reject the bounded next increment: OWNER
   `Responder por email` discoverability.
2. Confirm that the action may only open the OWNER's external email client and
   must not send, store, track or prefill a reply.
3. Confirm that no additional API, persistence, notification, WhatsApp or
   lead-state scope is authorized.

No routine technical question requires Human coordination.

