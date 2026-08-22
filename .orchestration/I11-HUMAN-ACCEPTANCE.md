# I11 Human Product Acceptance preparation

Status: `READY_FOR_I11_HUMAN_PRODUCT_ACCEPTANCE`
Candidate SHA: recorded in `PROJECT-STATE.md` after final commit

Use synthetic local data only.

## Access

- Public catalog: `http://localhost:5174/`
- Public available/unconfirmed listing: `http://localhost:5174/listings/i11-acceptance-available`
- OWNER area: `http://localhost:5174/owner`
- API origin: `http://localhost:3300`
- OWNER A: `owner-i11-a@example.test` / `password123`
- OWNER B: `owner-i11-b@example.test` / `password123`

If data is not present, run:

```bash
DATABASE_URL='postgresql://alquileres:alquileres@localhost:55432/alquileres?schema=public' pnpm i11:acceptance-seed
```

## Exact Human Product Acceptance journey

1. Open the public catalog and verify cards expose availability and freshness.
2. Confirm these fixtures are visible by default:
   - `Disponible`/unconfirmed;
   - `No disponible`;
   - stale availability communicated as a past/uncertain confirmation.
3. Open a listing detail and confirm copy matches its catalog card.
4. Confirm unavailable inventory remains visible with the default filter OFF.
5. Enable `Solo disponibles`; verify unavailable inventory is excluded.
6. Reset filters; verify the checkbox returns OFF and unavailable inventory
   returns.
7. Produce a zero-result state and verify it is understandable.
8. Verify loading, API error and retry behavior on catalog and detail.
9. As OWNER A, open `i11-acceptance-available` and verify it starts without a
   confirmation, then explicitly change availability or click Reconfirm.
10. Return to the public catalog/detail and verify the confirmation becomes
    recent; edit an unrelated draft field if available and verify it does not
    refresh confirmation.
11. Submit a public inquiry and verify the existing success feedback remains.
12. Repeat the changed catalog/detail/filter surfaces at mobile width
    (320–390px): readability, no horizontal scroll, focus, touch targets,
    retry and empty state.

Human Product Acceptance is the only authority for `PRODUCT_ACCEPTED`. This
file records preparation, not acceptance.
