# Mandatory Pre-Critic Gate

Status: `BINDING`

Codex must complete this gate before publishing any substantive immutable artifact for ChatGPT Independent Critic.

## 1. Contract integrity

- Active Task Contract exists and scope is bounded.
- No unapproved product/scope/architecture/cost/irreversible decision was introduced.
- Every material requirement maps `Requirement → Expected Surface → Acceptance → Evidence`.

## 2. Invariant mapping

- Every registry invariant is marked `APPLIES` or `N/A` with rationale for the task.
- Every applicable invariant has explicit evidence.
- No applicable invariant remains `FAIL` or `UNPROVEN`.

## 3. Technical validation

Run all task-relevant checks, including as applicable:

- lint/format/type/build;
- unit and integration tests;
- Prisma/schema validation;
- clean migration/replay evidence;
- security/authorization checks;
- accepted I10/I11/I13 regressions.

A green build does not replace domain or migration evidence.

## 4. Adversarial QA

Attempt to falsify the candidate, including as applicable:

- OWNER A/B cross-access;
- unauthenticated/expired-session paths;
- direct API access when UI hides a capability;
- stale/unavailable/unconfirmed discovery behavior;
- missing/null rental-domain state;
- historical migration values and no-inference guarantees;
- public contact ownership/PII boundaries;
- empty/error/mobile changed surfaces;
- cleanup/replay/idempotence assumptions.

## 5. Surface evidence

- Required UI behavior has browser evidence.
- Required API behavior has HTTP/integration evidence.
- Persistence/migration claims have database evidence.
- Evidence is from the final candidate, not an earlier checkpoint.

## 6. Scope and debt audit

- Diff is within contract scope.
- New debt/known limitations are explicit.
- Existing accepted debt is not silently expanded.
- No production/deployment claim is made unless separately authorized.

## 7. Publication readiness

Only if all sections PASS:

- create/update task invariant evidence;
- persist truthful state;
- publish the substantive immutable artifact;
- set the external Independent Critic boundary.

A failed Pre-Critic item is autonomous REWORK, not self-PASS and not automatically a Human Gate.