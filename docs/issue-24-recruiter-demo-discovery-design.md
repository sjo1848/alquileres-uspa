# Issue #24 — Recruiter demo discovery and design

**Phase:** DISCOVERY → DEFINITION → DESIGN  
**Build authorization:** Not granted by this report or Issue #24  
**Repository/base:** `sjo1848/alquileres-uspa`, `main` at `5bcde39e0ca8abd2d5d2e0a9e9c90c5b3bf47a51`  
**Candidate:** Option A — static, read-only demo using the real Vue public presentation and a bounded deterministic fixture source  
**Recommendation status:** Ready for Controller decision; BUILD remains stopped

## 1. Executive summary

Recommend **A**, a separately built static/read-only demo that reuses the actual Vue catalog/detail presentation with local synthetic fixtures. It best serves the approved “synthetic read-only catalog/detail” intent and permits a recruiter to explore the 30–90 second path without credentials. Use the existing Issue #20 screenshots and evidence process as complementary proof of the actual Nest/PostgreSQL/Vue runtime; do not treat screenshots as a substitute for A’s navigation.

Do **not** recommend B. A public API and database are disproportionate for this employment proof and create recurring operations, secrets, abuse controls, data lifecycle and a particularly material contact/PII risk. C is safe and inexpensive in public-runtime terms, and the repository already has reproducible screenshots, but a recording cannot offer recruiter-controlled navigation and is weaker than the approved catalog/detail demo. It remains the fallback only if a narrow A adapter cannot reuse the real presentation without a material fork.

A has one technical design condition to prove in future BUILD: separate the current app shell and data boundary so the demo build neither restores a session nor includes auth, OWNER, ADMIN, contact-write UI, API origins, or those routes, while sharing the actual catalog/detail presentation. If that needs duplicated templates or changes production semantics, stop and return to the Controller for a scope/architecture decision. No new hosting provider or paid service is selected here; static host, account plan, route fallback and any incremental cost must be verified before release.

No source, dependency, lockfile, workflow, application, data, content, infrastructure or deployment file was changed. This document is the only intended deliverable. The separate `alquileres-uspa-cloudflare` repository was not accessed or used.

## 2. Current public-flow inventory

The repository is a Vue 3/Vue Router SPA with a public catalog route `/` and listing-detail route `/listings/:id`; its same router also imports login/register, OWNER `/owner`, and ADMIN `/admin` routes ([router.ts:1–31](../apps/web/src/router.ts#L1-L31)). This is source-level route inventory, not a claim that the app is currently deployed publicly. No current public demo host or static-host rewrite configuration is established by this checkout.

| Surface | Current behavior | Evidence/source |
| --- | --- | --- |
| Catalog | On mount, loads `GET /public/listings`; query form sends location, amount range, currency, price period, duration, max occupants, `availableOnly`, page and page size. Cards render synthetic-or-product imagery, price/domain state, availability/freshness and “Ver ficha”. | [HomeView.vue:46–112, 119–202, 220–316](../apps/web/src/views/HomeView.vue#L46-L112) |
| Detail | Loads `GET /public/listings/:id`; renders ordered images, description, rental terms, status, freshness and last-confirmed date. Has retry and back-to-catalog links. | [ListingView.vue:58–73, 99–109, 112–187](../apps/web/src/views/ListingView.vue#L58-L73) |
| Image | Public detail/card image URL is served from API-managed image storage. | [HomeView.vue:91–95](../apps/web/src/views/HomeView.vue#L91-L95), [ListingView.vue:127–143](../apps/web/src/views/ListingView.vue#L127-L143), [public-listings.controller.ts:19–29](../apps/api/src/listings/public-listings.controller.ts#L19-L29) |
| Availability | Backend includes only approved/published listings and returns public fields; it computes `FRESH` within 30 days, `STALE` after 30 days and `UNCONFIRMED` when no confirmation exists. | [listings.service.ts:97–160, 163–193, 215–248](../apps/api/src/listings/listings.service.ts#L97-L160), [availability-helpers.ts:1–45](../apps/web/src/views/availability-helpers.ts#L1-L45) |
| Session startup | `App.vue` attempts `session.restore()` on mount. Router navigation also restores `/auth/me` when session is unknown; a session/network error can prevent `RouterView` from appearing. API fetches use `credentials: 'include'`. | [App.vue:6–21, 29–60](../apps/web/src/App.vue#L6-L21), [session.ts:45–65](../apps/web/src/session.ts#L45-L65), [router.ts:51–66](../apps/web/src/router.ts#L51-L66), [api.ts:18–39](../apps/web/src/api.ts#L18-L39) |
| Contact write | Detail includes visitor name/email/message and `sendContact()` posts to `/public/listings/:id/contact`. The API persists a `ContactEvent`. | [ListingView.vue:75–95, 188–218](../apps/web/src/views/ListingView.vue#L75-L95), [contact.controller.ts:21–27](../apps/api/src/contact/contact.controller.ts#L21-L27), [contact.service.ts:25–49](../apps/api/src/contact/contact.service.ts#L25-L49) |
| Registration/roles | Public auth API supports owner registration/login/logout. Protected OWNER/ADMIN APIs and UI exist elsewhere in the same repository. | [auth.controller.ts:36–105](../apps/api/src/auth/auth.controller.ts#L36-L105), [router.ts:14–30](../apps/web/src/router.ts#L14-L30) |
| Current demo labels/links | Existing app footer says “Entorno local · R1”; no persistent synthetic/read-only/non-production banner or return-to-portfolio/GitHub journey is present in the evidence screenshots. Detail returns only to the catalog. | [App.vue:29–60](../apps/web/src/App.vue#L29-L60), [ListingView.vue:122–124](../apps/web/src/views/ListingView.vue#L122-L124), Issue #20 captures below |

The frontend couples retrieval to `request()` and `apiUrl()`, not to an injected catalog port ([HomeView.vue:3, 77–95](../apps/web/src/views/HomeView.vue#L3-L3), [ListingView.vue:3, 58–70](../apps/web/src/views/ListingView.vue#L58-L70)). The current Vite config only installs the Vue plugin and does not define a static deployment/fallback contract ([vite.config.ts:1–4](../apps/web/vite.config.ts#L1-L4)). Thus a static frontend is plausible, but a fixture adapter and dedicated public-only app shell/route table are required; simply pointing the existing build at static hosting is not safe or sufficient.

### Existing Issue #20 evidence

Issue #20 / merged PR #23 already builds the real PostgreSQL + Nest API + Vue/Vite runtime with local synthetic illustrations, and captures catalog desktop, listing detail desktop and catalog mobile. The versioned files are:

- [`catalog-results-desktop-1440x1200.png`](media/portfolio/catalog-results-desktop-1440x1200.png) — 1440×1200.
- [`listing-detail-desktop-1440x1200.png`](media/portfolio/listing-detail-desktop-1440x1200.png) — 1440×1200.
- [`catalog-results-mobile-390x844.png`](media/portfolio/catalog-results-mobile-390x844.png) — 390×844.

`docs/portfolio-evidence.md` documents synthetic provenance and the three captures ([lines 3–25](portfolio-evidence.md#L3-L25)). `scripts/portfolio-evidence-capture.mjs` sets these viewport dimensions, waits for Vue/images, and validates PNG signature, exact size and minimum bytes ([lines 17–38, 142–192, 220–267](../scripts/portfolio-evidence-capture.mjs#L17-L38)). The workflow runs against PostgreSQL 16, applies migrations, seeds, starts API and web, captures, uploads an artifact retained 14 days, then can commit/push generated evidence using `contents: write` ([workflow lines 14–19, 21–43, 71–137](../.github/workflows/portfolio-evidence.yml#L14-L43)). Reuse its proven runtime/capture know-how and outputs; do not reuse its write-enabled branch workflow unchanged as a public-demo deployment pipeline.

Visual inspection of the existing mobile capture finds three cards and the stale state, but the first card is an unavailable listing, followed by the stale card and then fresh available. That is honest product-order evidence, but a future recruiter fixture should use deterministic demo-only ordering: **fresh available → stale available → unavailable**, leaving production ordering untouched. The capture’s footer “Entorno local · R1” must not ship unchanged as public demo copy.

The existing seed generates three local 1200×760 illustrations and uses fixed demo IDs/copy, including one fresh-available, one stale-available and one fresh-unavailable example ([seed lines 47–48, 150–187, 200–243, 282–305](../scripts/portfolio-evidence-seed.mjs#L47-L48)). Important reproducibility defect: `now = new Date()` and `stale = now − 45 days` drift on every execution ([lines 20–21](../scripts/portfolio-evidence-seed.mjs#L20-L21)); `bcrypt.hash()` also creates an OWNER database row with the `example.test` account and demo-only password hash ([lines 189–198](../scripts/portfolio-evidence-seed.mjs#L189-L198)). This is acceptable only in the isolated evidence runtime, not in a public static bundle. Existing assets/seed must not be described as a fully deterministic static demo without fixing its clock and excluding account data.

## 3. Synthetic data contract

### Data included in the proposed demo

- A versioned fixture set with at least three fictional listings and stable slugs/IDs, stable ordering and one rich detail. The first card demonstrates a FRESH + available **simulated record**, the second a STALE + last-recorded-available state, and another an unavailable state. This ordering is local to the demo fixture response, not a change to product API order.
- Only fictional titles/descriptions, broad illustrative locality (no street address/coordinates), synthetic rental amount/period/duration/maximum occupants/currency, explicit synthetic availability states and locally generated illustrations. Use no scraped text, property photographs, owner name, email, telephone, visitor details, production IDs or contact records.
- One richer detail can use existing domain fields and a small set of locally generated image assets. Do not add amenities, property facts, ratings, reviews, booking dates or other product capabilities just to fill the screen.
- Stable fixture `version`, `asOf` reference timestamp, status scenarios and SHA-256 manifest for fixture/image provenance. Rebuilding the same source commit and fixture version must produce identical fixture JSON and images.

### Freshness model

The live service uses a 30-day window (`listings.service.ts:79, 233–239`). The current evidence seed’s relative-to-now values are not byte-reproducible. Future A must use a frozen **demo clock/reference date** shared by fixture generation, display and tests; the FRESH example is confirmed within 30 demo-days, STALE is older than 30 demo-days. Display the reference date as simulated and never describe it as current real availability. Preserve `UNCONFIRMED` semantics in the model even if the minimum recruiter sample only needs FRESH and STALE. The user-facing sentence must clarify that every status/date is a scenario in synthetic data.

No OWNER row, email, password hash, JWT, session cookie, `ContactEvent`, backend URL or secret belongs in the static fixture or artifact. The `/public/listings` contract is a useful shape reference ([public-listings.controller.ts:6–36](../apps/api/src/listings/public-listings.controller.ts#L6-L36)); it is not a reason to expose or call the real API from A.

## 4. A/B/C comparison

Ratings below are ordinal, relative estimates from source inspection, not measured delivery estimates or provider prices. A high “risk/complexity” rating means worse.

| Criterion | A — static/read-only real Vue UI | B — public frontend + API + synthetic persistence | C — recorded walkthrough from real runtime |
| --- | --- | --- | --- |
| UI/product fidelity | High for actual Vue composition, routing interaction, filters, card/detail and responsive behavior; does not prove live Nest/database requests in the public demo. Pair with Issue #20 runtime captures for backend provenance. | Highest end-to-end runtime fidelity if the real API/database stay enabled and representative; still must remove or disable write/auth/contact surfaces. | High visual fidelity to captured real runtime; only the recorded sequence, no live user-controlled filter/navigation or detail exploration. |
| Recruiter usefulness | **High**: self-directed, credential-free catalog → detail → simulated freshness → return path. Best fit for the approved read-only catalog/detail intent. | High interaction, but additional fidelity adds little employment-proof value over A while increasing operational/security responsibility. | Medium: fast passive proof and works everywhere video is supported, but weakens exploration and accessible text/search; supplementary evidence only. |
| Privacy | Very low exposure if fixtures contain no real data and app never calls API. Static content is public and downloadable by design. | Medium/high exposure risk: public registration/contact/API surface; accidental writes can collect visitor PII as ContactEvents. Synthetic inventory does not neutralize personal-data capture. | Very low if recorded from isolated synthetic runtime; video may still accidentally capture credentials/real data unless capture inputs and frames are inspected. |
| Security/abuse | Lowest application attack surface: no API/database runtime or secrets; static reads can still incur bandwidth/hosting usage. Must guarantee no cross-origin API requests and no auth/contact/admin bundles/routes. | Highest: runtime patching, secret handling, DB/API hardening, registration/contact shutdown, abuse/rate limits, logs/backup/data retention and public attack surface. | Low public surface: media delivery only. Build/capture workflow still needs least-privilege permissions and artifact review. |
| Cost/operations | Low ongoing operations; moderate initial adapter/shell/build work. Existing static hosting and its limits/pricing are **unverified**; do not promise USD 0. No recurring DB/API operations. | High ongoing service burden. API host + persistence + backups/migrations/reset + monitoring/abuse controls + secret rotation; cost cannot be priced without provider, traffic, retention and service choices. | Low public-runtime operations; low/moderate production work if reusing CI capture. Runner minutes/video storage/media delivery depend on account plan; none are assumed free. |
| Reproducibility | High after clock, order, fixtures, image generator and manifest are frozen. Static content is immutable per build; no reset service is needed. | Medium: requires repeatable DB seeding, migrations, runtime versions, secret config and reset/reseed; mutable state can drift. | High for a pinned runtime and script, although video may be timing/codec-sensitive. Existing machinery currently reproduces PNGs, not a full video walkthrough. |
| Complexity/maintenance | Medium. Main risk is a parallel demo code path drifting from production. Mitigate by sharing presentation components and a thin read-only repository interface; parity test changes. | High. Ongoing service, secrets, migrations, DB lifecycle, attack protection and runtime regressions. | Low/medium. Minimal app work but re-recording/caption/transcript review after UI changes; cannot validate hands-on interaction. |
| Rollback/removal | Easy: remove portfolio link and static demo artifact/path; no stateful records to migrate/delete. Verify caches/routes removed. | Harder: remove public route, API, database, credentials, backups and persisted synthetic/contact records, then verify teardown. | Easiest: remove media link/file and retain or delete versioned proof. |
| Contract fit | **Recommended**, provided future spike proves real shared presentation and fixture-only boundary without material fork. | Not recommended; expressly triggers a cost/operations gate if pursued. | Existing screenshots already cover a useful part; video is not equivalent to the requested navigable catalog/detail proof. |

The contract already records Product Owner intent for a read-only synthetic catalog/detail demo (Issue #24, Canonical source and Discovery question). That makes A the clear match rather than an unresolved product choice between B and C. C should remain supplemental or serve as fallback only if A’s bounded reuse condition fails; it is not a second implementation recommendation.

## 5. Threat and privacy boundary

### A — required fail-closed boundary

1. Separate demo entry/router/app shell. Mount only catalog and fixed synthetic detail routes. Do not use current `App.vue` session-restoration shell or current all-route `router.ts` unchanged.
2. Use a fixture-only reader with an allowlist of catalog/detail/image **GET** operations (or direct local fixture imports). Unknown IDs, routes and methods fail closed. No remote fallback, `VITE_API_URL`, API host, credentials, cookie handling, write endpoint, ContactEvent or persistence.
3. Do not render contact fields/buttons, registration/login, OWNER/ADMIN, administrative data/actions, reservations, payments or booking affordances. A hidden form is not sufficient: assert the built output/network path cannot submit.
4. Bundle only the demo shell and public presentation components; verify production/auth/admin code chunks and route links are absent from the public artifact. No secrets or synthetic owner credentials in HTML, JS, source maps, build metadata or network traffic.
5. Use only local, generated illustrations and deterministic fixture content. An explicit visible demo banner appears before catalog/detail data; freshness dates/status remain identified as simulated.
6. Browser network tests allow only same-origin static GET/HEAD for page/fixture/image assets; assert no off-origin request, cookie/session request, POST/PUT/PATCH/DELETE, contact/register/login path or console/page error.

### B — minimum additional controls if reconsidered

In addition to the same UI restrictions, contact must be disabled server-side, registration disabled, OWNER/ADMIN interfaces and endpoints excluded or inaccessible, secrets isolated/rotated, public writes blocked, rate/abuse controls defined, synthetic DB seeded/reset idempotently, logs/backup retention defined and teardown tested. UI hiding and CORS alone are not security controls. Because B creates ongoing public operations and the contact API currently persists visitor PII, choosing B is a **HUMAN_GATE** under Issue #24.

### Invariant applicability for the proposed design

| Repository invariant | Design disposition |
| --- | --- |
| INV-AUTH-01 OWNER isolation | Applies as a negative boundary: no OWNER resource, page or API in A. Existing production authorization is untouched. |
| INV-PII-01 visitor PII | Applies: no contact inputs, ContactEvents or PII display/storage. |
| INV-AVAIL-01 truthful availability/freshness | Applies: FRESH/STALE are explicit simulated states against a frozen demo clock; never claim real availability. |
| INV-DOMAIN-01 rental vocabulary | Applies to fixture shape: use amount, period, duration, currency, max occupants; avoid tourist/nightly inference. |
| INV-MIG-01 no legacy inference | N/A: no migration or historical row translation. |
| INV-MIG-02 migration reproducibility | N/A for static A: no database migrations at runtime. Issue #20 backend screenshots remain separately attributable. |
| INV-AUTH-02 backend authorization | Applies as a boundary: A contains no backend/API, and no UI hiding is treated as access control. If any API is selected, server-side deny tests are required. |
| INV-SESSION-01 session topology | N/A: no session, cookie or authentication in A. |
| INV-CONTACT-01 bounded public contact | Applies by exclusion: no contact form/route or visitor submission in A; product contact stays unchanged. |
| INV-REG-01 accepted regressions | Applies to future BUILD if shared product surfaces change: rerun accepted I10/I11/I13 integration/browser regressions. |
| INV-EVIDENCE-01 evidence matches surface | Applies: existing screenshots prove runtime visuals only; a future browser test must prove demo route/no-write behavior. |
| INV-GATE-01 acceptance boundary | Applies: this report is design, not BUILD authorization, product acceptance, deployment or production acceptance. |

## 6. Cost and operations comparison

No provider, account plan, domain, traffic forecast or retention policy is specified in the repository. Therefore no dollar estimate or “free tier” claim is supportable.

- **A:** one-time implementation and build/capture CI; static asset storage/transfer and route support only if served by an already available static host. Check plan, quotas, public path and history fallback before deployment. No database, secret, reset, backup or public API operations. If this requires a paid recurring host/account, return to Product Owner/HUMAN_GATE rather than assume approval.
- **B:** recurring application/API/database capacity, storage, backups, migrations, monitoring, secret management, abuse controls and synthetic-state reset/verification. Exact cost is indeterminate and new ops owner is not identified. This does not meet the lowest-cost/lowest-risk selection criterion without a separate gate.
- **C:** public media storage/transfer and CI runner/artifact retention; reuses current capture infrastructure in part. Account billing/limits must still be checked. A long video may be materially larger than PNG evidence and requires captions/transcript plus future recapture.

Relative planning ranges (not quotes): A = moderate build / low ongoing ops; B = high build / high ongoing ops; C = low build / low ongoing ops but medium recurring evidence-refresh effort.

## 7. Recruiter journey (30–90 seconds)

1. Open the Alquileres case from the portfolio. Keep a concise secondary link to existing reproducible runtime evidence.
2. Choose one primary CTA: **“Abrir demo sintética (solo lectura)”**. Open a new tab only if the portfolio case remains easily reachable; do not make a modal mandatory.
3. Before the first card, read the persistent synthetic/read-only/non-production labels and the no-real-availability/no-booking statement.
4. Scan three deterministic cards in this order: synthetic FRESH sample, synthetic STALE sample with the last simulated confirmation, then unavailable sample. Price/period/term/occupants are visibly examples, not market data.
5. Open the rich detail; review local synthetic image(s), problem-relevant rental fields and the explicit freshness explanation. There is no contact or reservation action.
6. Return to catalog, then the portfolio case/GitHub through clear text links in the shell/footer.

No credentials, visitor data entry, account creation or explanation from the recruiter is required. The demo demonstrates Vue composition/responsive UI and modeled status presentation; Issue #20 captures provide separate real-runtime provenance for API/database behavior.

## 8. Proposed architecture for a future BUILD

**Separate static output, same public presentation.** Proposed high-level boundary only; implementation has not started.

- A dedicated Vite HTML/entry build and minimal Vue app/router contain only `/` and `/listings/:syntheticSlug`. They do not import the current session bootstrap or auth/OWNER/ADMIN route table.
- Share the existing catalog card, filter, detail, image/gallery, availability and freshness presentation (extract small presentational components if required). Keep contact form as a product-only composition, not part of the shared demo detail.
- Introduce a narrow public listing reader interface at the data edge. The product adapter continues to use existing GET endpoints. The demo adapter supplies deterministic local fixtures and local image paths for only the required read methods; it has no general `fetch` fallback and no write methods.
- Preserve existing product API/routing semantics. Do not fork entire templates; a focused parity test compares the shared UI and records any demo-only labels/links. If there is no bounded adapter path without material duplication/production behavior change, stop and ask the Controller rather than silently building a fork.
- Emit to a separate static output directory so regular app build and release remain isolated. Host only after choosing/verifying an existing static destination, URL path, HTTPS, no-store/cache policy appropriate to assets, and direct-detail refresh/fallback. No provider or cross-repo deploy integration is authorized by this report.
- Keep a provenance manifest: source commit, fixture version/hash, deterministic seed/build command, capture command, asset hashes, and exact limitations. Reuse Issue #20 local generated PNG approach and screenshot validation; do not reuse its workflow’s `contents: write` push behavior for a deploy build.

## 9. Exact labeling proposal

Use persistent plain text on **every** demo route, with color-independent contrast and screen-reader-visible text. Keep these exact English tokens and provide the accompanying Spanish text because the current UI copy is Spanish:

- `Synthetic demo` — `Demo sintética · datos 100% ficticios`
- `Read-only` — `Solo lectura`
- `Non-production` — `Entorno no productivo`
- `No real availability / no booking` — `No hay disponibilidad real ni se aceptan reservas`

On availability/freshness, add: **`Estado y fecha simulados para esta demo; no representan disponibilidad real.`** Use labels such as “Registro simulado: disponible” and “Disponibilidad no confirmada recientemente (estado simulado)”; avoid an unqualified “Disponible” headline that a recruiter could read as real inventory. No “live”, “production”, “accepted”, “reservable” or owner-contact claim.

## 10. Future BUILD acceptance criteria (proposal only)

1. Portfolio-to-demo CTA and return-to-portfolio/GitHub links complete the no-login journey; catalog and direct detail routes refresh successfully on the chosen static host.
2. Real shared Vue presentation is used; an adapter contract and component parity evidence prove the demo has not become a duplicated/forked product UI.
3. At least three fixed synthetic cards show FRESH, STALE and unavailable scenarios in deterministic recruiter-first ordering; one detail contains only existing domain vocabulary and sufficient synthetic illustration/detail.
4. All four labels above and the simulated-state explanation remain visible on catalog/detail; no language or color treatment implies actual inventory.
5. Fixture JSON, fixed reference clock, generated local image bytes and manifest reproduce byte-identically from the same fixture version. No user/owner row, real PII, photo, address, credential, cookie, API origin or server secret is present in output.
6. Artifact has only the two public route types; no auth/register/OWNER/ADMIN routes, contact UI, reservation/payment action or protected data appears in its route tree/accessibility tree or network output.
7. Network assertions prove fixture-only same-origin GET/HEAD; prohibited write/auth/contact methods/paths and off-origin API requests fail closed. Zero contact event can be created by demo interaction.
8. Catalog → detail → freshness → back and portfolio/GitHub return journey is keyboard-operable; heading/link semantics, visible focus, image alt, labels and status announcements pass automated accessibility checks plus keyboard review.
9. At 390, 768 and 1440 CSS px, no horizontal overflow, essential status/CTA clipping or unusable filters. Add 390 mobile evidence and desktop evidence; current repository has 390/1440 captures but no 768 evidence at this base.
10. Browser checks exercise Chromium, Firefox and WebKit; no console/page errors. A documented client/static asset budget is set from a baseline before any performance gate is asserted.
11. Reuse Issue #20 artifact capture/PNG validation where appropriate, and include commit, fixture hash, exact build/capture commands, browser/viewports and limitations with versioned evidence. Keep CI least privilege; no workflow self-push for deployment.
12. Existing I10/I11/I13 accepted regressions remain green if product-shared components/data code are changed. The normal product behavior and build are unchanged outside that reviewed shared component boundary.
13. Release verification checks selected static URL, canonical path/fallback, 200 responses, no accidental API traffic and complete reversible removal. Do not claim Product Acceptance or production service status.

## 11. Rollback/removal plan

- Feature-flag or remove the single portfolio link to the demo; keep the case study and Issue #20 evidence images available.
- Delete/disable only the separate static output path/deployment artifact and verify catalog/detail URLs return 404 or a deliberate portfolio fallback, not stale content.
- Purge static cache for the exact paths if the selected host caches them. There is no database to clean up, no account/session to revoke, no API deployment to tear down and no contact records to retain.
- Preserve source commit/fixture manifest and report as development evidence; remove public media if its content or synthetic labels become inaccurate. Record removal commit and post-removal HTTP checks.
- For B, teardown additionally requires stop API, revoke/rotate secrets, delete DB/storage/backups/logs under an approved retention plan and verify endpoint withdrawal; this operational burden is another reason not to choose it.

## 12. Risks, contradictions and unknowns

| Item | Evidence/impact | Handling |
| --- | --- | --- |
| Static adapter may fork behavior | Current `HomeView`/`ListingView` directly fetch API; full existing router/session shell imports auth/role routes and detail includes a PII POST. | BUILD starts with a bounded component/data-boundary proof; no duplicated full templates. Material fork → Controller gate. |
| “Available” can imply a real rental | Current UI labels fresh record “Disponible”; stale is qualified, but existing app has no persistent synthetic banner. | Persistent exact labels and simulation copy on every demo route; deterministic sample order. |
| Existing seed not fully deterministic | `Date.now()` shifts timestamps/status dates; random bcrypt hash and OWNER row are database-specific. | Do not ship the current seed output/user in A. Freeze demo clock, fixtures and asset bytes. |
| Current screenshots not complete interactive evidence | Issue #20 screenshots are real runtime evidence, only catalog desktop/mobile/detail desktop; no 768 or input-driven recording. Mobile capture first card is unavailable. | Use as complementary proof; produce ordered static-demo browser evidence in future authorized BUILD. |
| Current workflow has write privileges | `portfolio-evidence.yml` grants `contents: write`, self-commits/pushes generated assets and is branch-scoped. | Reuse capture technique/data, not workflow write/push behavior for serving a public demo. Set least privilege in any new CI. |
| Static SPA direct-detail route | Router uses `createWebHistory`; repository does not declare a production host or rewrite/fallback contract. | Verify provider/path/refresh behavior before release. If existing host cannot serve safely, gate a paid/new host or return to C. |
| Cost/host unresolved | No hosting plan, usage envelope or ongoing ops owner is evidenced. | Do not claim $0/free tier; verify current static-host account limits. Paid recurring infra → Product Owner gate. |
| Workspace orchestration state | `.orchestration/STATE.md` and `STATUS.json` still say I13 awaits Human Product Acceptance and `resume_authorized=false`; they prohibit another product increment. This report follows the latest explicit user/controller authorization for Issue #24 analysis only; it does not update I13 state or authorize BUILD. | Keep orchestration state untouched. Controller should reconcile whether this separate discovery is accepted alongside pending I13 gate before authorizing any implementation. |
| Broad testing unknown | Existing issue evidence is Chromium/headless capture. No multi-browser responsive suite at this base proves the proposed new static artifact. | Treat A’s cross-browser, keyboard, performance and route checks as future acceptance criteria, not existing evidence. |

## 13. Independent Critic

**PASS — Independent Critic.** The critic reviewed the Issue #24 contract, source-flow facts, A/B/C choice, static safety boundary, deterministic fixture/clock requirements, cost/hosting qualifications, orchestration-state conflict and no-BUILD boundary against the pinned base and this report. It verified that Issue #20 is runtime screenshot evidence rather than a hosted demo, and that current auth/role guards are not server-side isolation. No blocking omissions were identified. The critic was independent of the report author and made no implementation changes.

## 14. Integration Review

**PASS — Integration Review.** The reviewer verified fit with the current Vue/API product and Issue #20 evidence, the privacy boundary, recruiter journey, Project Method state, cost/hosting uncertainty, explicit scope and no-BUILD rule. Static host/deep-link behavior and bounded component-sharing feasibility remain future BUILD gates as documented. No integration changes were made.

## 15. HUMAN_GATE / Controller decision

**Required before any BUILD:** a new explicit Controller authorization of a bounded A implementation task after reviewing this report. This issue and this report do not authorize code or deployment.

No separate product-choice HUMAN_GATE is recommended now: A aligns with the already approved read-only synthetic catalog/detail intent, while C remains supporting/fallback evidence and B is rejected for this goal. Escalate to Product Owner/HUMAN_GATE if any of these arise during the Controller’s BUILD decision:

1. A requires a material fork of the real Vue presentation or production semantics.
2. No already-authorized static host can serve the artifact and a paid/recurring host or material operations commitment is needed.
3. The Controller changes direction to hosted API/database Option B or needs real data/PII.
4. Static deep-link fallback cannot be delivered without materially changing the approved demo journey; the Controller must choose between a routed static app and recorded-only C.

Until the new Controller authorization arrives, stop at DESIGN. No BUILD, deployment, ContactEvent, account, real inventory, product acceptance or production claim is made.

## Evidence and commands

The discovery inspection was performed against the exact clean `main` commit stated above. Inputs included full Issue #24, Issue #20, merged PR #23, Issue #21, `AGENTS.md`, canonical orchestration state, `README.md`, `docs/portfolio-evidence.md`, Vue route/shell/catalog/detail/session/API/CSS, public API/contact services, seed/capture scripts and evidence workflow. Existing PNGs were visually reviewed and their file signatures/dimensions confirmed with `file`; SHA-256 values were computed for provenance, not added as a product change.

Commands/evidence used: `git ls-remote ... refs/heads/main`; clean clone and checkout of the pinned SHA; `gh issue view 24`, `gh issue view 20`, `gh pr view 23`, `gh issue view 21`; `rg --files`; source reads with `nl -ba`; `file docs/media/portfolio/*.png`; and `sha256sum docs/media/portfolio/*.png`. No app build, DB seed, API start, deployment, dependency install, product test, cloudflare-lab access or file modification was performed.

Specialist contracts were assigned separately to source-flow inventory, security/cost comparison, and recruiter/evidence journey. Each was read-only, pinned to the same base SHA, and explicitly prohibited the Cloudflare laboratory and implementation. Their findings are reconciled above; their work is not used as self-approval.
