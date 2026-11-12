# Task: <specific user-visible outcome>

## Context

- GitHub issue:
- Surface (api / app / admin / site / shared-types / infra):
- Current behaviour and source paths:
- User goal:
- Architecture / ADR references (`docs/architecture/`, `docs/adr/`):

## Acceptance criteria

Write observable outcomes, including the important failure case.

- [ ]
- [ ]

## Scope and constraints

- Components/files to change:
- Invariants (API is the only DB client, no reader auth, OpenAPI ↔ shared-types in sync, untrusted feed content sanitized):
- External operations authorized for this task, if any (deploys, migrations, env vars):
- Compatibility with deployed clients (reader web/native, admin):

## Plan

Keep a small ordered plan. Assign disjoint file ownership for parallel work.

1.
2.
3.

## Verification

- Baseline and exact commands (`pnpm test:api`, `pnpm lint:app`, `pnpm test:app`, builds):
- Regression or negative test:
- Running-app journey, when relevant:
- Checks that could not be run and why:

## Completion evidence

- GitHub issue updated:
- Behaviour changed:
- Tests/checks actually run and results:
- Independent review verdicts and resolution:
- Migration / rollback steps, when relevant:
- Session summary + ADR / architecture pages:
- Remaining work:
