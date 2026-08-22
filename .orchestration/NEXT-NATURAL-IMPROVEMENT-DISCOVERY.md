# Next Natural Improvement Discovery — after I10

State: `READY_FOR_NEXT_NATURAL_IMPROVEMENT_HUMAN_GATE`
Canonical source: `main` at `d2668443997a579d46539c10f62093c85410fdee`
Date: 2026-08-22

## 1. I10 closure and reconstructed product

I10 — OWNER Lead Inbox is `PRODUCT_ACCEPTED` and canonically integrated.

- Human Product Acceptance PASS: public inquiry, OWNER A authentication and
  inbox inspection, `UNREAD → READ → UNREAD`, OWNER B isolation and mobile.
- Acceptance PR: #12. Merge commit: `d2668443997a579d46539c10f62093c85410fdee`.
- Post-merge canonical CI run `32598108629` passed: security, format, Prisma,
  migrations, lint, tests and build. No deployment was performed.
- I10's accepted non-blocking debt remains: a future mobile UX improvement,
  without a more specific Human finding.

The current product has public catalog/search (location, price and capacity),
listing detail with gallery, global availability and 30-day freshness,
visitor contact capture, OWNER listing controls and consultations, and ADMIN
review/assistance/audit. It does not have amenities, calendar ranges,
reservations, owner WhatsApp configuration, visitor phone consent, chat, or
notifications.

Canonical evidence was reconstructed from `README.md`,
`apps/api/prisma/schema.prisma`, `apps/api/src/listings/listings.service.ts`,
`apps/web/src/views/HomeView.vue`, `apps/web/src/views/ListingView.vue`,
`apps/web/src/views/AreaView.vue`, the I10 contract/evidence/acceptance files,
and merged GitHub CI/PR evidence.

## 2. Candidate comparison

Ratings are relative: 5 is favorable for value, low complexity/risk and
reversibility; the recommendation is based on evidence, not a numeric total.

| Candidate | Visitor / OWNER value | Current evidence and actual gap | Required surface | Complexity / risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Availability/freshness truthfulness in catalog | High / medium | API returns global `AVAILABLE`/`UNAVAILABLE`, confirmation date and `FRESH`/`STALE`; listing detail shows them, but catalog cards omit them and catalog results mix unavailable/stale listings. New listings also receive `lastConfirmedAt=now`, so fresh is not necessarily owner-confirmed. | Public catalog UI; public-list query/filter only if policy approves; existing OWNER reconfirmation semantics; tests. Potentially API/persistence only if the meaning of confirmation is corrected. | Low-medium / medium semantic risk | **Recommend first, gated.** It fixes a visitor-trust contradiction already present in the product. |
| Explicit OWNER email action after a lead | Medium / high | Human acceptance reported no obvious next action. The inbox already renders the visitor email as `mailto:`; it is data, not a clearly labeled response action. | OWNER UI and mobile CSS; browser `mailto:` link; UI tests. No API, persistence or background work. | Low / low | Postpone one increment. Worth a small UX slice, but an existing capability means it is not the highest product gap. |
| WhatsApp follow-up | Unknown / potentially high | ContactEvent has name, email and message only. There is no visitor phone/opt-in, owner WhatsApp configuration, channel policy or fallback. | New visitor data/consent, OWNER configuration, secure outbound URL, privacy policy and tests. | Medium-high / high privacy and third-party risk | Reject now. No evidence that email is unsuitable. |
| Rich listing information / amenities / gallery | Potentially high / medium | Detail has free text and an image grid; no amenity taxonomy or structured characteristics. Gallery already supports multiple ordered images. | Amenity model/taxonomy, migration, OWNER editing, possible ADMIN review, public display; search only later if justified. | Medium / medium data-quality and image metadata risk | Postpone. Needs local taxonomy and owner-data supply evidence; do not bundle search. |
| Search/filter improvements | Medium / low | Location, price, capacity, pagination, loading/error/empty states already exist. No evidence of failed searches. Availability data is not yet product-trustworthy. | Public query DTO/service/UI and URL state only after availability policy. | Low-medium / medium zero-results and misleading-filter risk | Postpone. First decide truthfulness of availability; then a filter can be evaluated. |
| Simple date calendar | Potentially high / high | A global availability flag does not answer date availability. No range persistence, timezone, overlap, cancellation or reservation policy exists. | New persistence/API/OWNER UI/public UI/security/operation. | High / high implied-booking and temporal-risk | Reject now. Not a small availability enhancement. |
| Mobile UX redesign | Medium / medium | I10 was accepted at 390×844; a generic debt remains but no concrete failure is recorded. Responsive CSS and basic reflow already exist. | Cross-product UI/CSS/browser research. | Low-medium / high risk of subjective scope | Postpone. Fold focused mobile checks into the selected increment; do not redesign without a task-based finding. |

## 3. Requirement → surface → evidence → gap → acceptance evidence

### Recommended: availability/freshness truthfulness in catalog

| Requirement | Expected surface | Current evidence | Gap | Acceptance evidence |
| --- | --- | --- | --- | --- |
| A visitor can understand a result's global availability before opening it. | Public catalog card UI; existing list API projection. | The public list response already contains availability and freshness; `ListingView` displays them, `HomeView` does not. | API existence is not visitor-visible catalog value. | Available and unavailable fixtures render distinct, understandable status in desktop and mobile cards; contact/publication behavior remains unchanged. |
| A visitor can distinguish recent owner confirmation from stale information. | Catalog badge/copy; detail consistency; potentially confirmation persistence semantics. | Freshness is computed at 30 days and detail exposes it. Creation and availability changes currently update `lastConfirmedAt`. | “Fresh” may mean recent system mutation, not owner confirmation. | Fixtures prove never-confirmed, fresh, exactly-30-day boundary, stale and reconfirmed behavior against an injected clock; public copy matches the approved policy. |
| Catalog filtering/ranking must not silently hide inventory. | Optional public query/UI control, only if approved. | Catalog currently returns available and unavailable listings; no availability filter exists. | Default behavior and stale/unavailable consequences are undefined. | If a filter is approved, it is opt-in, removable, URL-restorable, has deterministic pagination and an understandable zero-results state. |
| OWNER can make the listing truthful without automation. | Existing OWNER availability/reconfirmation controls; tests. | OWNER can toggle global availability and reconfirm. | Whether either action counts as a confirmation requires product policy. | Approved action semantics are tested; no reminders, jobs, notification or calendar is introduced. |

### Other evaluated candidates

| Requirement | Expected surface | Current evidence | Gap | Acceptance evidence if later approved |
| --- | --- | --- | --- | --- |
| OWNER has an obvious next action after reading a lead. | Labeled `Responder por email` action in Consultas, accessible on mobile. | Existing owner-scoped email is rendered as an unlabeled `mailto:` link. | Discoverability/action clarity, not missing transport. | Correct URI-encoded recipient; keyboard/mobile usable; no persistence of a reply and no cross-owner exposure. |
| OWNER can use WhatsApp appropriately. | Phone/opt-in collection, owner channel configuration, secure link policy. | No visitor phone, opt-in or owner WhatsApp data exists. | Consent, privacy, data model and operation are missing. | Explicit consent and E.164 tests, fixed host URL, no third-party PII prefill without authority, owner isolation. |
| Visitors compare relevant amenities. | Curated amenity model, owner editor, public projection. | Only free text/images exist; gallery is already multi-image. | Taxonomy, validation and data population are absent. | Allowed values only, mobile detail clarity, owner authorization, data-quality policy and image privacy review. |
| Visitors find listings that meet a new decision criterion. | Public API/UI filter and URL state. | Existing filters cover location, price and guests. | No validated unmet search demand; availability semantics are unsettled. | Deterministic combined filters, clear/resettable empty state, pagination stability and no PII collection. |
| Visitors inspect dates rather than a global status. | Date-range schema/API/OWNER/public UI. | Only global availability and a confirmation timestamp exist. | Booking/blocking semantics and timezone rules are absent. | IANA timezone, half-open ranges, overlap/concurrency, cancellation and DST/authorization tests. |
| Mobile tasks are materially easier. | Targeted responsive UI/CSS. | I10 mobile was accepted; generic debt only. | No bounded task failure. | At 320/360/390 px: no horizontal overflow, visible focus, usable targets, long content and loading/error states. |

## 4. Component review

- **REUSE:** existing native Vue controls and project CSS for status badges and
  an optional filter. No component library is installed; importing one would
  not improve this bounded UI enough to offset dependency/style cost.
- **ADAPT later:** if a calendar is independently approved, evaluate
  `v-calendar` as presentation only, with backend-owned range/timezone rules.
  It is not appropriate for the current global availability problem.
- **REJECT now:** UI framework, carousel/lightbox and generic lead-contact
  action component. Gallery works as a responsive grid; a generic action
  abstraction needs at least two settled consumers.

## 5. Independent specialists, critics and REWORK

All four agents were spawned with separate prompts, `fork_context=false`, did
not edit files and did not receive one another's results. That is the evidence
of independent analysis; no false claim of shared-critic independence is made.

| Role | Agent | Result |
| --- | --- | --- |
| Visitor/product specialist | Bacon | Ranked availability/freshness first; documented existing search and gallery capability. |
| OWNER-operations specialist | James | Ranked an explicit email CTA first; established that `mailto:` already exists and WhatsApp lacks consent/data. |
| Independent product critic | Anscombe | Falsified a broad “availability improvement”; required a narrow truthfulness policy and Human decisions. |
| Independent technical/security/mobile critic | Maxwell | Ranked availability first; rejected WhatsApp/calendar now and identified existing CSRF, retention and public-contact abuse debts. |

REWORK loop 1 — reconciliation: James's real Human signal supports a future
email CTA, but the repository proves email transport already exists. Bacon,
Anscombe and Maxwell independently identified a broader visitor-facing
contradiction: current catalog discovery omits data it already returns and
labels freshness ambiguously. The recommendation was narrowed from “improve
availability” to **truthful availability/freshness**, with policy decisions
held at the Human Gate. No code change was made.

Security debt observed by Maxwell is recorded, not silently absorbed into the
recommendation: cookie-authenticated state changes lack visible CSRF
protection, ContactEvent's 180-day retention is unenforced, and public contact
creation has no evidenced rate limiting. These may be prioritized separately;
they are not authorization to broaden this discovery increment.

## 6. Recommendation for Human Gate

### Proposed next increment: truthful availability and freshness in the public catalog

Why it wins: it addresses an existing visitor decision/trust problem on the
highest-traffic discovery surface; reuses already persisted data; has no new
PII or external dependency; and remains reversible if catalog policy is
wrong. It also establishes dependable semantics required before availability
search or a calendar could be credible. The I10 follow-up email gap is real
but is a UI discoverability refinement over an existing `mailto:` capability.

Proposed scope after approval:

1. Define and implement the meaning of owner confirmation versus creation and
   availability-toggle mutation.
2. Show global availability and freshness clearly on public catalog cards,
   consistent with detail.
3. Add an availability filter only if the Gate chooses an opt-in catalog
   policy; never silently exclude results without that decision.
4. Exercise relevant desktop and mobile states, existing public contact flow,
   OWNER reconfirmation, exact freshness boundary, and public API behavior.

Explicit exclusions: email CTA, WhatsApp, phone/consent data, internal chat,
notifications, new lead states, amenities, gallery redesign, calendar/date
ranges, reservations/payments, background reminders/deletion, deployment,
and infrastructure changes.

Preliminary Human Product Acceptance journey after implementation:

1. Open the public catalog on desktop and mobile.
2. Identify an available/fresh listing, an unavailable listing and a stale
   listing from their cards before opening a detail page.
3. Verify detail wording agrees with its card.
4. If approved, enable and clear the availability filter and observe an
   understandable no-results state.
5. As the listing OWNER, reconfirm availability; verify the approved fresh
   state and public card update.
6. Submit a public inquiry and verify the existing contact journey is
   unaffected.

## 7. Material Human Gate decisions

1. What exactly counts as an OWNER confirmation: only explicit reconfirmation,
   or also listing creation and a global availability toggle?
2. What should discovery do with `UNAVAILABLE` and `STALE` results: show with
   labels only, opt-in filter, ranking change, exclusion, or contact warning?
3. If a filter is included, approve that it is opt-in and resettable rather
   than the default catalog policy.
4. Is the previously documented 180-day ContactEvent retention enforcement
   gap more urgent than discovery trust? If yes, authorize it as a separate
   privacy/security increment rather than silently expanding this one.

No routine technical decision requires Human coordination. No next increment
is authorized until these material decisions are recorded.

## 8. Autonomy and portability

- `human_coordination_messages`: 0 during closure and discovery; the I10 PASS
  is the legitimate Human Gate input.
- Unnecessary escalations: 0.
- Specialists: 2; independent critics: 2; all results and reconciliation are
  recorded above.
- Runtime-specific assumptions: local GitHub CLI access and four
  multi-agent workers were available. Discovery relied on repository evidence
  rather than conversation history. External package versions were inspected
  only for component evaluation; none was installed.
- `RUNTIME_CAPABILITY_GAP`: none for this phase. A critic's missing local
  `DATABASE_URL` prevented an independent `prisma validate`; canonical CI had
  already executed it with a valid test database, so this is environment
  evidence, not a schema failure.
- Another runtime needs only this file, `PROJECT-STATE.md`, I10 artifacts and
  `main` at the recorded SHA to reconstruct the decision pending at this
  Human Gate.
