# Portfolio visual evidence

This repository generates portfolio screenshots from the real Alquileres Uspallata runtime using a dedicated synthetic dataset.

## Provenance

The evidence workflow starts PostgreSQL, applies the repository migrations, generates the Prisma client, seeds deterministic demo listings, starts the Nest API and Vue/Vite web application, and captures the public UI with headless Chrome.

No customer, owner, property, contact, or other real personal data is used. The demo owner uses the reserved `example.test` domain, all listing IDs begin with `portfolio-demo-`, and the listing illustrations are generated locally by `scripts/portfolio-evidence-seed.mjs` rather than downloaded from third parties.

## Generated evidence

Successful runs version these files under `docs/media/portfolio/`:

- `catalog-results-desktop-1440x1200.png` — public catalog scrolled to the real results grid at desktop viewport.
- `listing-detail-desktop-1440x1200.png` — public listing detail for `portfolio-demo-casa-montana`.
- `catalog-results-mobile-390x844.png` — public catalog scrolled to the real results grid at mobile viewport.

The capture script uses Chrome DevTools Protocol to wait for Vue and listing images to finish loading before focusing the results grid. It validates PNG signature, exact viewport dimensions, and a minimum byte size before evidence can be committed.

## Reproduction contract

The canonical automation is `.github/workflows/portfolio-evidence.yml`. The workflow also uploads the capture directory as an Actions artifact so the generated files can be inspected independently of the repository commit.

These screenshots are product evidence, not claims about real rental inventory. The synthetic listing copy explicitly identifies the fixtures as demo data.
