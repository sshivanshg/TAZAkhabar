# [Subsystem name]

> **Living doc** — update in the same change when this subsystem’s behavior or boundaries move.  
> **Last verified against:** YYYY-MM-DD (commit/branch or “local working tree”)

## Purpose

One paragraph: what this subsystem is for.

## Boundaries

- **In scope:** …
- **Out of scope:** …

## Context diagram

```mermaid
flowchart LR
  A[Upstream] --> B[This subsystem]
  B --> C[Downstream]
```

## Components / key types

| Name | Role |
|------|------|
| … | … |

## Data & control flows

```mermaid
sequenceDiagram
  participant A
  participant B
  A->>B: request
  B-->>A: response
```

## Key files

- `path/to/file`

## Public contracts

Endpoints, events, env vars, OpenAPI operation names — as applicable.

## Failure modes & invariants

- …

## Related docs

- ADR-…
- `docs/PRD.md`
- Specs/plans if any

## Change checklist

When you change … → update …
