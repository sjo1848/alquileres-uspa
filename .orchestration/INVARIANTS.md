# Project Invariants — Alquileres Uspallata

Status: `BINDING`

Every Task Contract must classify each relevant invariant as `APPLIES` or `N/A` with rationale. Applicable invariants require explicit acceptance evidence before artifact publication.

## INV-AUTH-01 — OWNER isolation

An authenticated OWNER may only read/mutate resources belonging to that OWNER. Cross-owner listing, lead/contact, availability and management surfaces must deny access server-side.

## INV-PII-01 — Visitor PII scope

Visitor contact data remains owner-scoped through the related listing. ADMIN must not silently gain an unrestricted global visitor-PII inbox.

## INV-AVAIL-01 — Truthful availability/freshness

`AVAILABLE`, `UNAVAILABLE`, `STALE` and unconfirmed/unknown states must remain semantically distinct. Unknown/stale data must not be silently rendered or filtered as confirmed available.

## INV-DOMAIN-01 — Rental vocabulary alignment

Persistence/API/DTO/public/OWNER/ADMIN surfaces must use aligned rental-domain semantics for `priceAmount`, `currency`, `pricePeriod`, `rentalDuration` and `maxOccupants` where the I13 domain applies.

## INV-MIG-01 — No invented legacy semantics

Historical tourist-domain values such as nightly price/guest count must not be multiplied, divided, period-assigned or otherwise semantically inferred into the rental domain without explicit Product Authority approval.

## INV-MIG-02 — Migration reproducibility

Versioned migrations must apply from the supported historical baseline in a clean isolated database and preserve accepted data semantics. A passing final schema alone is insufficient evidence.

## INV-AUTH-02 — Backend authorization is authoritative

UI visibility, routing or client state cannot substitute for API authorization checks.

## INV-SESSION-01 — Session topology truthfulness

Authentication/session cookies must work under the explicitly supported topology. Local same-site defaults and any approved cross-site frontend/API deployment behavior must both be tested when affected.

## INV-CONTACT-01 — Public contact remains bounded

Public contact submission must remain associated to the intended listing/OWNER, preserve accepted feedback behavior and not weaken existing ownership isolation.

## INV-REG-01 — Accepted regression surfaces

An increment touching listing/public/OWNER/auth/availability behavior must rerun the applicable accepted I10/I11/I13 integration/browser regressions rather than relying only on new unit tests.

## INV-EVIDENCE-01 — Evidence matches required surface

API evidence cannot prove required UI behavior; mocks cannot prove required integration; local-only checkpoints cannot prove synchronized closure. Claims must be backed by evidence from the surface being claimed.

## INV-GATE-01 — Acceptance boundaries stay distinct

`TECHNICAL_PASS`, Independent Critic PASS, `PRODUCT_ACCEPTANCE_READY`, `PRODUCT_ACCEPTED`, production eligibility, deployment and production acceptance are distinct states and must not be collapsed.

## Promotion rule

When an Independent Critic identifies a reusable root-cause pattern, promote the generalized correctness rule here before the next delivery wave. Do not add one-off bug descriptions.