# Canonical Runtime State — Alquileres Uspallata

Status: `PRODUCT_ACCEPTANCE_READY`

Canonical branch: `main`
Bootstrap base HEAD: `26e1801940932ece7d56cd8042fe7a74d39d7ddf`

## Current product state

I10 and I11 are closed with Human Product Acceptance PASS. I13 — Product Domain Alignment — has a durable technical candidate and acceptance evidence, but Human Product Acceptance is still pending.

I13 substantive candidate: `8e11bebdb197321d500678f06233d6f174f03438`
I13 acceptance checkpoint: `8fcfb14a79f45825aa5ad3a29085cb0437d95722`

Read before any I13 decision:

1. `.orchestration/I13-TASK-CONTRACT.md`
2. `.orchestration/I13-RUNTIME-EVIDENCE.md`
3. `.orchestration/I13-HUMAN-ACCEPTANCE.md`

Do not start I14/another product increment, deploy, or declare `PRODUCT_ACCEPTED` while this gate remains pending.

## Current gate

Type: `HUMAN_PRODUCT_ACCEPTANCE`
Task: `I13`
Reason: technical/integration/browser evidence is complete under the previous orchestration model; only the explicit Human Product Acceptance journey remains.

This is a legitimate Human Gate. Runtime automation must remain non-resumable until the Human records PASS/REWORK for I13 and the canonical state is updated.

## Method migration

The repository previously used durable Task Contracts, runtime evidence, independent critics and Human Acceptance files but lacked the modern canonical `STATE.md` + `STATUS.json` dispatch layer.

The modern Project Method is now the governing layer. Historical `.orchestration/PROJECT-STATE.md` and I10/I11/I13 evidence remain valid history, but mutable state must be read from this file and `STATUS.json`.

Automatic Runtime Watch is intentionally not enabled by this bootstrap. The corrected watcher is being stabilized separately before porting; until then, no manual/local checkpoint may be treated as a global PASS or external-review artifact.

## Next authorized action

`HUMAN_PRODUCT_ACCEPTANCE_I13`

After Human Product Acceptance:

- PASS → persist `PRODUCT_ACCEPTED`/closure for I13, then discovery/Task Contract for the next authorized increment.
- REWORK → persist bounded I13 REWORK and set `READY_TO_RESUME`; Codex repairs autonomously through Pre-Critic and External Independent Critic before returning to Product Acceptance.

No other product work is authorized by this state.