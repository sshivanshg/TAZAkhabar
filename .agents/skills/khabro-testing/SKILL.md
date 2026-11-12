---
name: khabro-testing
description: Write or review Khabro tests: xUnit unit/integration tests in apps/api.Tests, Jest + RNTL in apps/app, Playwright E2E against the Expo web export.
---

# Khabro Testing

Rules: [.codex/rules/testing.mdc](../../../.codex/rules/testing.mdc).

- API: `apps/api.Tests` (xUnit). Endpoint tests use `TazaKhabarWebApplicationFactory` (Testing env, per-test DB name, test ingest key/admin creds) and real HTTP. Fakes: `FakeRssFeedClient`, `FakeScrapeHttpClient`, `FakeArticleIntelligence`, `FakeArticleRewriter`; fixtures in `Fixtures/`.
- Reader: Jest + React Native Testing Library (`apps/app/__tests__`, `jest.setup.ts`, `__mocks__`).
- E2E: Playwright against the Expo web export for critical flows; keep them fast.
- Assert behavior and outputs, not that mocks were called. Write the failing test first ([test-driven-development](../test-driven-development/SKILL.md)).
- Commands: `pnpm test:api`, `pnpm test:app`, `pnpm lint:app`. CI must pass before promotion.
