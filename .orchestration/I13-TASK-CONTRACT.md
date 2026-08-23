# I13 Task Contract v0.1 — Product Domain Alignment — Buscayata

Status: `READY_FOR_I13_HUMAN_PRODUCT_ACCEPTANCE`
Approved Human Gate: 2026-08-23
Base canonical SHA: `ce3830716ddf9534b131ee75223df84cadbf99c2`
Scope owner: Codex orchestrator

## Objective

Align the implemented product with Buscayata Core: medium/long stays by rental
modality, not short-stay tourism. Replace tourist-facing price, occupancy and
catalog vocabulary across the complete product surface.

## Authorized domain

- `priceAmount`: integer amount in the selected currency.
- `pricePeriod`: `WEEK | MONTH`.
- `rentalDuration`: `WEEKS | MONTHS | PERMANENT | FLEXIBLE`.
- `maxOccupants`: positive integer.
- `currency`: `ARS | USD`.

## Safe migration strategy

The existing `pricePerNight` and `maxGuests` values have unknown semantic
provenance and are not converted. No multiplication, division, inference or
period assignment is performed. The migration adds nullable domain columns and
leaves the historical columns physically intact and nullable as quarantined
legacy data;
they are removed from Prisma/API/DTO/UI contracts and are never used to fill
new fields. Existing rows therefore have a truthful `NULL` domain state until
an authorized OWNER/ADMIN edits them. New create/update paths require the five
Buscayata fields. Public surfaces render an explicit missing-domain-data state
where applicable; filters operate only on non-null domain fields.

## Requirement → surface → acceptance → evidence

| Requirement | Expected surface | Acceptance | Evidence |
| --- | --- | --- | --- |
| Prices represent medium/long rental modality | Prisma, migration, API/DTO, OWNER/ADMIN forms, public card/detail | New/edited listing stores and returns amount, period and currency; no `pricePerNight` or “por noche” contract remains | Migration SQL, API tests, integration payloads, browser journey |
| Duration is explicit | Prisma, API/DTO, OWNER/ADMIN forms, public detail | `WEEKS`, `MONTHS`, `PERMANENT`, `FLEXIBLE` are validated and displayed with intentional copy | DTO tests, UI tests, browser evidence |
| Occupancy uses domain language | API/DTO, filters, cards/detail/forms | `maxOccupants` is validated and rendered as “ocupantes”; no `maxGuests`/“huéspedes” remains on product surfaces | grep/code review, API/web tests, browser evidence |
| Historical values remain truthful | Migration/persistence and public behavior | Existing tourist values are not converted; new fields are NULL; no historical price appears as weekly/monthly | migration evidence and integration fixture |
| Catalog/filter semantics are aligned | Public catalog, query DTO/service, URL/filter UI | Price range uses `minPriceAmount`/`maxPriceAmount`, currency is explicit, occupancy filter uses `maxOccupants`; null-domain listings are not falsely comparable | API tests, web tests, integration and browser |
| Existing product behavior survives | ContactEvent, availability, ownership, moderation, images | I10/I11 journeys and authorization remain green | regression/API/web/integration tests |
| Mobile is intentional | Catalog/detail and OWNER/ADMIN changed forms | At 320/375/390px labels, selects, currency/period/duration controls and missing-data states are usable without overflow | browser journey/screenshots |

## Scope

Schema/migration, API and DTO contracts, public catalog/filter/detail,
OWNER create/edit, ADMIN assisted/review surfaces, tests, integration,
browser evidence, and changed-surface responsive behavior.

## Explicit exclusions

WhatsApp, email CTA, RentalRequest, reservations, date calendar, payments,
contracts, amenities expansion, HMS, AI, monetization, deployment,
infrastructure changes and tourism-vertical behavior.

## Preservation requirements

Preserve ContactEvent and OWNER Consultas, I11 availability/freshness/
reconfirmation, OWNER isolation, publication/moderation and image behavior.

## Preliminary acceptance journey

1. Open the public catalog and verify Buscayata vocabulary and price modality.
2. Use price amount, currency and occupancy filters; verify reset and empty
   states.
3. Open a listing detail and verify amount, period, currency, duration and
   occupants are consistent with the card.
4. Create/edit a listing as OWNER using each authorized enum family.
5. Verify an old fixture with only legacy tourist values is not converted and
   is shown as domain data pending, not as a weekly/monthly claim.
6. Verify availability/freshness, ContactEvent/Consultas, ownership,
   publication/moderation and images remain functional.
7. Repeat changed catalog/detail/form surfaces at mobile widths.

Candidate SHA: pending final commit.

Human Product Acceptance is required; technical evidence does not substitute
for it.
