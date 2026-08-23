# I13 Runtime Evidence — Product Domain Alignment

Status: `READY_FOR_I13_HUMAN_PRODUCT_ACCEPTANCE`
Candidate SHA: `8e11beb`
Base SHA: `ce3830716ddf9534b131ee75223df84cadbf99c2`

## Contract and migration

I13 aligns listings with Buscayata medium/long-rental semantics: `priceAmount`,
`pricePeriod` (`WEEK|MONTH`), `rentalDuration`
(`WEEKS|MONTHS|PERMANENT|FLEXIBLE`), `maxOccupants`, and `currency`
(`ARS|USD`). Public catalog, filters, detail, OWNER forms, ADMIN assisted
surfaces, DTOs, Prisma and mobile changed surfaces use this vocabulary.

Historical `price_per_night` and `max_guests` values were not multiplied,
divided, inferred or assigned a period. The migration adds nullable domain
columns, keeps the historical columns physically present and nullable as
quarantined legacy data, removes them from Prisma/API/DTO/UI contracts, and
leaves old rows in a truthful missing-domain state. New create/update paths
require the five domain fields.

## Evidence

- API: 105 tests passed; web: 27; full suite: 132 passed.
- Lint, format, security check, Prisma validation and API/web build: PASS.
- I13 migration evidence: PASS; legacy `123|7` preserved, new domain values
  NULL, legacy columns nullable.
- I13 integration: PASS — public domain catalog/filter, OWNER domain create,
  cleanup and contact regression.
- I11 integration: PASS — availability/freshness and contact regression.
- I10 integration: PASS — public contact, UNREAD/READ/UNREAD and OWNER B
  isolation. The repository has no `i10:integration` package alias; its
  canonical runner was executed directly with `node scripts/i10-integration.mjs`.
- CI now runs legacy and I13 migration evidence.

## Browser evidence

Synthetic local environment only:

- Web: `http://localhost:5175/`
- API health: `http://localhost:3301/health`
- Public fixture: `http://localhost:5175/listings/i11-acceptance-available`
- OWNER area: `http://localhost:5175/owner`
- PostgreSQL: `alquileres-uspa-i13-postgres`, host port `55433`.

Fresh browser evidence confirmed public filters for currency, periodicity,
duration, amount, occupants and availability; explicit ARS, period, duration
and occupants in card/detail; public contact; OWNER A login, Consultas and
domain create/edit fields. At 320x844 catalog, detail, login and OWNER all
reported `scrollWidth == clientWidth == 320` after mobile REWORK.

## Workers, critics and REWORK

Implementation workers were disjoint and real:

- Anscombe: backend/persistence/API, commit
  `48ffb7e6bdcc4da2024f84c3f6def333eba4e9ce`.
- Sartre: web/catalog/OWNER/Admin, commit
  `f788eb21524945ad8a2c8205f7aa9c4c064714d9`.

Independent critics were separate from implementers and each other:

- Dirac: Product/UX critic — `REWORK`.
- Parfit: Technical/security critic — `REWORK`.

They received separate prompts and did not receive each other's findings or
implementation output. Their falsification targets included domain semantics,
currency visibility, domain-state rendering, filters, mobile overflow,
validation bounds, migration truthfulness, ownership, auth and regressions.

REWORK completed autonomously: legacy columns became nullable; migration
evidence was strengthened; integration cleanup was corrected to HTTP 200;
currency/domain-state/periodicity/duration behavior was completed; 320 px
overflow was reproduced and fixed with `minmax(0, 1fr)`; DTO integer bounds
were added; I10/I11 integrations were rerun against the final API.

## Debt and autonomy

Outside I13: ContactEvent 180-day deletion enforcement, CSRF review, public
contact abuse/rate limiting, historical Docker credential drift, and accepted
I10 mobile UX debt. I12 email CTA is rejected/superseded. No deploy or
production-eligibility claim was made.

- `human_coordination_messages`: `0` since the I13 Human Gate.
- Routine human interventions: `0`.
- Workers: `2`; independent critics: `2`; REWORK loops: `6`.
- `RUNTIME_CAPABILITY_GAP`: host `psql` was unavailable; Docker fallback
  produced passing migration evidence and did not block the candidate.
