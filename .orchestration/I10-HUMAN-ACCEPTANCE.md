# I10 — Human Product Acceptance record

State: `PRODUCT_ACCEPTED_CANONICAL_MAIN`

Human Product Acceptance: `PASS` issued by Sebastián on 2026-08-22.
Automated tests and technical critics did not substitute for this decision.

Acceptance candidate branch: `i10-owner-lead-inbox-acceptance`

Acceptance candidate commit: `a3471a9c01705299cea1b62367c4699d2bab1c01`

## Local runtime

- Web: `http://127.0.0.1:5174`
- Public listing: `http://127.0.0.1:5174/listings/cmt39g87f0003gcblq23wi725`
- OWNER area: `http://127.0.0.1:5174/owner`
- API health: `http://127.0.0.1:3302/health`
- Public acceptance web tunnel:
  `https://segments-cleanup-lace-glucose.trycloudflare.com`
- Public acceptance API tunnel:
  `https://glossary-reform-authentic-thread.trycloudflare.com`
- Database: isolated synthetic PostgreSQL at `127.0.0.1:55435`.
- Current demo listing: `Cabaña I10`, `Uspallata`.
- Current prepared inquiry: visitor `Sebastián PA`,
  `sebastian-pa@example.test`, message `Consulta preparada para Product
  Acceptance`, state `UNREAD`.
- Preparation verification: API health returned `200`; OWNER A `/owner`
  showed exactly `1 sin leer` and the prepared inquiry.

The tunnel API must run with `COOKIE_SAME_SITE=none` and
`COOKIE_SECURE=true`; otherwise browsers reject the cross-site session cookie.

The app is running from the current I10 worktree. The persisted Docker volume
on the normal port 5432 is not used because its historical credentials do not
match the documented local password; no persistent volume was destroyed or
modified.

## OWNER access

- OWNER A email: `owner-i10-a@example.test`
- OWNER B email: `owner-i10-b@example.test`
- Password: ephemeral local test password supplied in the acceptance handoff;
  it is intentionally not committed to the repository.

Both accounts are synthetic `OWNER` accounts. OWNER A owns the prepared
listing. OWNER B exists only for isolation testing.

## Exact manual acceptance journey

### A. Visitor

1. Open the public listing URL.
2. Confirm the listing is `Cabaña I10` in `Uspallata`.
3. Submit a new inquiry using any synthetic visitor name/email/message.
4. Confirm visible submission feedback: `Tu consulta fue enviada. El propietario podrá contactarte.`

### B. OWNER

5. Log in at `/auth/login` with OWNER A.
6. Open `Consultas` in `/owner`.
7. Confirm the new inquiry appears.
8. Confirm the unread counter increases by exactly one for that inquiry.
9. Verify visitor name, email, message, listing title/location and date/time.
10. Select `Marcar consulta como leída` and confirm state becomes `Leída` and
    counter decreases.
11. Select `Restaurar sin leer` and confirm state becomes `Sin leer` and counter
    increases again.

### C. Isolation

12. Log out and log in as OWNER B.
13. Confirm OWNER B cannot see OWNER A's inquiry in `Consultas`.
14. Confirm OWNER B cannot access OWNER A's inquiry URL. Expected result is
    unavailable/not found; no visitor PII should be shown.

### D. Mobile

15. Repeat the relevant OWNER inbox steps at approximately 390×844 viewport.
16. Evaluate navigation, readability, scrolling, action clarity, loading,
    empty/error states and general usability.

Record product observations and issue severity. Do not treat the 180-day text
as proof of deletion: automated deletion is a known I10 enforcement gap.

## Technical readiness already verified

- `pnpm test`: API 96 and web 20 tests passed.
- `pnpm lint`, `pnpm format:check`, `pnpm security:check`, `pnpm build` passed.
- Prisma validation passed and all eight migrations are applied in the isolated
  acceptance database.
- Versioned integration runner and independent critics passed after REWORK.
- Human acceptance repair: fresh browser OWNER A and OWNER B sessions passed;
  logout/account switching and invalid-session redirect also passed.

## Accepted result and debt

- Public inquiry submission: PASS.
- OWNER A authentication, inbox, inspection and READ/UNREAD: PASS.
- OWNER B isolation: PASS.
- Mobile: accepted for I10.
- Non-blocking debt: improve mobile UX in a future prioritized increment; no
  more granular finding was supplied by the Human Gate.

I10 is Product Accepted. The next action is discovery and a new Human Gate,
not automatic implementation.
