# I13 Human Product Acceptance

State: `READY_FOR_I13_HUMAN_PRODUCT_ACCEPTANCE`
Candidate SHA: `8e11beb`
Product acceptance: `PENDING HUMAN GATE`

## Local access

- Public catalog: `http://localhost:5175/`
- Public fixture: `http://localhost:5175/listings/i11-acceptance-available`
- OWNER area: `http://localhost:5175/owner`
- API health: `http://localhost:3301/health`
- OWNER A: `owner-i11-a@example.test` / `password123`
- OWNER B: `owner-i11-b@example.test` / `password123`

The API uses synthetic data in PostgreSQL container
`alquileres-uspa-i13-postgres` on port `55433`.

## Exact acceptance journey

1. Open the catalog and verify rental-by-modality vocabulary without tourist
   terms.
2. Verify available, unavailable, stale and unconfirmed states.
3. Use currency, amount, periodicity, duration, maximum-occupants and the
   opt-in `Solo disponibles` filters; verify reset and understandable empty
   results.
4. Open a detail and verify amount, explicit currency, period, duration,
   occupants and availability are consistent with the card.
5. Submit a public contact inquiry and verify existing feedback.
6. Login as OWNER A, open `Consultas`, then open a listing editor.
7. Verify Importe, Moneda, Periodicidad, Duración and Ocupantes máximos, and
   save a synthetic edit.
8. Verify availability/reconfirmation, publication/moderation and images
   remain usable where the fixture permits.
9. Login as OWNER B and verify isolation.
10. Repeat catalog, detail and OWNER changed surfaces at 320 px, checking
    readability, controls, scrolling and empty/error states.

Human Product Acceptance is required; automated evidence does not declare
`PRODUCT_ACCEPTED`.
