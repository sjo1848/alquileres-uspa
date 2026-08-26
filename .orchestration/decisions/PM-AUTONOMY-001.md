# PM-AUTONOMY-001 — Autonomous Execution Policy

Status: `APPROVED`

## Decision

Once a bounded Task Contract is authorized, Codex owns the routine execution loop without Human relay:

`plan → implement → test → adversarial QA → repair → re-test → integration/browser evidence → Pre-Critic → immutable artifact`.

ChatGPT is the External Project Controller / Independent Critic. The Human is Product/Risk Authority and is not used for routine coordination.

## Routine work that does not require a Human Gate

- implementation choices inside approved architecture/scope;
- red tests and ordinary bugs;
- failed local migrations or fixture problems;
- incomplete browser/integration evidence;
- ordinary security/authorization defects;
- bounded Independent Critic REWORK;
- retries/workarounds that do not change material product intent, security posture, cost or irreversibility.

## Legitimate Human Gates

- material product intent/scope change;
- architecture/topology decision with material trade-offs;
- security/risk acceptance;
- paid/material recurring-cost change;
- irreversible migration/cutover/real-data action;
- unresolved product trade-off;
- explicit Human Product Acceptance.

ChatGPT classifies whether a proposed Human Gate is legitimate; the Human decides the gate.

## Review policy

Codex cannot self-approve substantive work. Mature immutable artifacts stop for ChatGPT Independent Critic. `REWORK` returns to Codex automatically. Human Product Acceptance remains distinct from technical/critic PASS.

## Runtime continuity

A routine Codex session ending while authorized work remains is not a workflow boundary. Persist `READY_TO_RESUME` with the exact next action. Local checkpoints are recovery points only; they are not Artifact A, PASS or synchronized closure.
