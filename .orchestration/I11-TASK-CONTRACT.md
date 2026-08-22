# I11 Task Contract — Truthful availability and freshness

Status: `APPROVED_FOR_IMPLEMENTATION`
Approved at Human Gate: 2026-08-22
Implementation base: `0fb88d2c75984904f340cc669d42ec7d23ebb85c`
Scope owner: Codex orchestrator

## Product intent

Make the public catalog truthful about global availability and the recency of
OWNER confirmation. `lastConfirmedAt` must represent an actual OWNER statement
about current availability, not listing creation or unrelated listing edits.

## Authoritative semantics

- An explicit authenticated OWNER availability change refreshes
  `lastConfirmedAt`.
- An explicit authenticated OWNER reconfirmation refreshes `lastConfirmedAt`.
- Listing creation does not set an availability confirmation.
- Unrelated listing mutations do not refresh availability confirmation.
- Existing records whose timestamp cannot be proven to be an OWNER confirmation
  must not be presented as confirmed merely because of the old creation-time
  default. The migration must preserve truthfulness and document its treatment
  of historical rows.
- `AVAILABLE` and `UNAVAILABLE` remain globally scoped statuses, not date
  availability.
- `UNAVAILABLE` remains in the public catalog, is labeled clearly `No
  disponible`, and is not hidden or re-ranked by I11.
- `STALE` remains in the public catalog and is clearly communicated without
  presenting availability as current fact. It is not hidden or re-ranked.
- `Solo disponibles` is an opt-in, reversible public filter, OFF by default.
  It filters only `AVAILABLE`; it is resettable and must have understandable
  empty/no-results behavior.
- No freshness filter is included unless implementation evidence proves it is
  necessary for correctness within this contract.

## Requirement → Expected Surface → Acceptance → Evidence

| Requirement | Expected surface | Acceptance | Evidence to preserve |
| --- | --- | --- | --- |
| Confirmation reflects an OWNER statement | Persistence/schema, create/update/reconfirm API paths, OWNER UI | New creation has no confirmation; explicit OWNER availability change and reconfirm refresh it; title/description/price/guest/image edits do not | Migration, service tests with clock-controlled timestamps, API integration tests, OWNER browser evidence |
| Public list data is truthful | Public listing API and DTO | Public items expose availability plus nullable/accurate confirmation/freshness fields; `STALE` and never-confirmed are not represented as current | API tests, integration responses, OpenAPI/runtime evidence |
| Visitor understands status before opening detail | Catalog cards | Cards show `Disponible`, `No disponible`, and a distinct stale/unconfirmed message; status is readable at desktop and mobile widths | Web tests, browser screenshots/journey, accessibility assertions |
| Detail is consistent with catalog | Public detail view | Same availability/freshness meaning and copy; no invalid date shown for never-confirmed | Web tests and browser journey |
| Visitor can opt into availability filtering | Catalog API and UI | `Solo disponibles` defaults OFF, filters only available listings, is resettable, preserves understandable loading/error/empty behavior and pagination | DTO/service tests, API integration, web tests, desktop/mobile journey |
| Default discovery preserves inventory | Public list API | Without the filter, unavailable listings remain visible and ranking/order is unchanged | API regression tests and integration fixture |
| Existing contact behavior remains intact | Public listing detail/contact API/UI | Inquiry submission, feedback and persistence remain unchanged | Existing API/web tests plus I11 integration regression |
| Mobile is intentional on changed surfaces | Catalog filter/cards/detail | At 320/360/390px no horizontal overflow; filter and status are readable/tappable; loading/error/empty states remain usable | Responsive browser journey and targeted web tests |

## Scope

- nullable/semantically correct confirmation persistence and migration;
- public list query support for opt-in availability filter;
- public catalog API/DTO and cards;
- public detail consistency;
- existing OWNER availability-change/reconfirm behavior;
- loading, error and empty states on changed surfaces;
- API, web, integration and browser regression evidence;
- Project Method and orchestration evidence.

## Explicit out of scope

Email CTA, WhatsApp, visitor phone/consent, chat, notifications, lead-state
changes, amenities, gallery redesign, calendar/date ranges,
reservations/payments, background retention/deletion jobs, generic mobile
redesign, ranking changes, default hiding, freshness filter, deployment,
production infrastructure, CSRF hardening and contact rate limiting.

## Preliminary Human Product Acceptance journey

1. Open the public catalog on desktop and mobile.
2. Verify available, unavailable and never-confirmed/stale cards communicate
   distinct states before opening a detail.
3. Open each detail and verify its status/freshness copy matches the card.
4. Confirm the catalog initially includes unavailable inventory.
5. Enable `Solo disponibles`; verify unavailable cards disappear, then reset it
   and verify they return.
6. Exercise loading, API error and zero-results behavior.
7. As OWNER A, create or inspect a listing and verify creation alone does not
   show confirmation; explicitly reconfirm and verify freshness updates.
8. Change availability as OWNER A and verify confirmation updates; perform an
   unrelated listing edit and verify confirmation does not update.
9. Submit a public inquiry and verify existing contact behavior is unchanged.
10. Repeat changed catalog surfaces at mobile width and verify readability,
    scrolling and action clarity.

## Risks and controls

- Historical timestamps may be indistinguishable from creation timestamps;
  migration must not claim proof that does not exist.
- A global status is not a calendar; no date promises are introduced.
- Stale/unavailable content remains visible by policy; copy must avoid false
  current-availability claims.
- The existing 180-day ContactEvent deletion gap, CSRF concern and public
  contact abuse/rate-limit concern remain explicit production-hardening debt;
  they are not silently added to I11.
- Reuse existing Vue primitives and project CSS. Do not introduce a component
  framework; adapt a mature Vue component only if implementation evidence shows
  a material UX or maintenance benefit.

## Stop condition

After implementation, independent critics, autonomous REWORK, Integration
Review, canonical CI and durable candidate creation, stop at
`READY_FOR_I11_HUMAN_PRODUCT_ACCEPTANCE`. Do not declare product acceptance.
