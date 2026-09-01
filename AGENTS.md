# TazaKhabar Codex Rules

This repository mirrors the Cursor agent rules in `.codex/rules/`. Treat these
rules as always available project instructions for Codex.

## Session Start Reminder

Before making structural or product-scope changes, read
`.codex/rules/architecture.mdc` and `docs/PRD.md`.

Remember the core constraints:

- API is the only database client.
- No auth for MVP readers.
- The reader client is Expo at `apps/app` for web and native. Do not add a
  separate Vite/CRA reader app.
- OpenAPI and `packages/shared-types` must stay in sync with API contract
  changes.

## Architecture

Deep "how it works now" docs live in `docs/architecture/`. Keep them in sync
per `.codex/rules/architecture-docs.mdc`.

Layout:

```text
/apps
  /app            # Expo universal client (web + iOS + Android)
  /admin          # Vite editorial SPA (internal; ADR-006)
  /api            # .NET 8 Web API - only process that talks to Postgres
/packages
  /shared-types   # TS types generated from API OpenAPI (NSwag)
/infra
  /docker         # Dockerfiles for api and app (web static)
  /migrations     # EF Core migrations (checked in; never edit applied ones)
/docs
  /architecture   # Living system atlas
  /adr            # One markdown file per architecture decision
  PRD.md          # Product requirements - read before structural/product changes
```

Hard boundaries:

- API is the only thing that talks to the database. Frontend never queries
  Postgres/Neon directly.
- All new endpoints must appear in the OpenAPI document exposed by the API.
  Shared TS types are generated from that document.
- No breaking changes to shared-types without updating API and consumers
  (Expo app and/or admin) in the same PR.
- No auth for MVP readers. Admin uses shared password + JWT.
- One reader client codebase: Expo in `apps/app` serves web for MVP hosting and
  native later. Do not add a separate Vite/CRA reader. Admin Vite SPA at
  `apps/admin` is the narrow exception.
- Product name is TazaKhabar. Follow `.codex/rules/branding.mdc` and
  `docs/brand.md`; do not invent alternate brand names.
- MVP UI is light with TazaKhabar blue as its primary accent and saffron only
  as a restrained freshness/breaking-news signal.

Before structural changes, read the matching `docs/architecture/` page,
`.codex/rules/architecture.mdc`, and `docs/PRD.md`. Prefer an ADR under
`docs/adr/` when changing hosting, auth, data ownership, or monorepo shape.

## Architecture Docs

Before structural/product changes, read the matching page(s) under
`docs/architecture/` (hub: `docs/architecture/README.md`).

Same-change updates required when touching:

- Boundaries/topology: `00-system-overview.md` plus affected page.
- `apps/api/Endpoints/*`, `Program.cs`: `02-api.md`, plus `00` if topology
  changes.
- `apps/api/Data/*`, `infra/migrations/*`: `03-data-model.md`.
- `apps/api/Ingest/*`: `04-ingestion.md`.
- `apps/admin/**`: `05-admin.md`.
- `apps/app/**`: `06-reader-app.md`.
- `packages/shared-types/**`, OpenAPI: `07-shared-types.md`.
- `render.yaml`, docker, Cloudflare, env examples, CI deploy:
  `08-hosting-and-ci.md`.
- Workspace layout/root scripts: `01-monorepo.md`.

Rules:

1. Bump "Last verified against" on every edited atlas page.
2. New subsystem: create a page from `docs/architecture/_template.md`, link it
   from the hub README, and add a row to this mapping.
3. No parallel "how it works now" docs outside `docs/architecture/`.
4. If atlas and code disagree, fix them in the same change.
5. Do not rewrite ADRs for current behavior. ADRs are decision history.

## Backend Conventions

For `apps/api/**/*.{cs,csproj}`:

- Minimal APIs only. Keep endpoint maps organized by feature files if the
  surface grows.
- Use async/await for all I/O. No `.Result`, `.Wait()`, or blocking DB/HTTP
  calls.
- Single project: `apps/api` plus `apps/api.Tests`. Do not introduce Clean
  Architecture layers until pain is real.
- EF Core owns data access. Migrations live in `infra/migrations`.
- Never edit a migration that has already been applied or merged. Add a new
  migration.
- API owns the database connection; connection string via
  `ConnectionStrings__Database`.
- Validate all input.
- Return ProblemDetails (RFC 7807) for errors. Never expose raw exception text
  to clients.
- Document endpoints so OpenAPI stays complete; regenerate
  `packages/shared-types` after contract changes.
- Use Serilog structured logging only. No `Console.WriteLine`.
- Config through environment variables and strongly typed options. Never
  hardcode secrets or connection strings.
- Rate-limit public endpoints. CORS allowlist from config; no `*`.

## Frontend Conventions

For `apps/app/**/*.{ts,tsx}`:

- Expo + React Native with React Native Web for Cloudflare Pages.
- Required web packages are installed: `react-dom`, `react-native-web`,
  `@expo/metro-runtime`.
- Entry must import `@expo/metro-runtime` first (`index.ts`).
- Functional components + hooks only. No class components.
- TypeScript strict mode. Prefer `@tazakhabar/shared-types`.
- Use RN primitives (`View`, `Text`, `Pressable`, `ScrollView`). Avoid web-only
  DOM/CSS except thin `Platform.OS === 'web'` forks.
- No inline `fetch` in screens. All HTTP goes through `src/api/`.
- Config through `EXPO_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_APP_ENV`. Never
  hardcode secrets.
- Minimum 16px base font size, WCAG AA contrast, large tap targets, and
  readability for a 40+ demographic.
- MVP theme: light UI, near-white canvas (`#F4F6FA`), white cards with soft
  shadow, near-black headlines (`#101828`), mid-gray meta (`#667085`), primary
  blue (`#155EEF`), and restrained saffron (`#FFB000`) freshness signals.
- Product name is TazaKhabar; follow `.codex/rules/branding.mdc`.
- Develop primarily with `pnpm --filter @tazakhabar/app web` for MVP pilots.
- Keep screens native-safe. Do not reintroduce a separate Vite app for the
  reader.

## Git And PR Conventions

- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
  `test:`, `ci:`.
- No direct commits to `main`. Use feature branches and PR review.
- Squash merge to keep `main` history linear and readable.
- Do not leave completed work stranded on a feature branch. At the end of each
  finished task, run the relevant checks, commit all intentional changes, push
  the branch, and move the work toward `main` through the approved PR/squash
  merge path unless the user explicitly asks for local-only work.
- Every PR must include what changed, why it changed, how it was tested, and
  which `docs/architecture/` pages changed or N/A with a one-line reason.
- Contract/OpenAPI changes must update `packages/shared-types` and web
  consumers in the same PR.

For architecture-relevant PRs, ensure atlas pages are updated or explicitly N/A,
Mermaid remains accurate, "Last verified" is bumped on edited pages, and the hub
index is updated when a page is added.

## Deployment Hygiene

- The canonical reader frontend is the Cloudflare Pages project
  `newsfeed-web`, served at `https://newsfeed-web.pages.dev`.
- Do not create or keep parallel reader frontend projects. The marketing site
  `tazakhabar-site` and admin app `newsfeed-admin` are separate surfaces, not
  duplicate reader frontends.
- If deploying the reader manually with Wrangler, deploy `apps/app/dist` to
  `newsfeed-web` with `--branch main` when the change should be live on the
  canonical frontend. Feature-branch preview deployments are temporary and
  should be pruned once production is verified.
- If asked to consolidate deployments, keep the latest intended production
  deployment behind `newsfeed-web.pages.dev` and delete stale preview/old
  deployment URLs from the `newsfeed-web` project.

## Security

- Never commit secrets. `.env` files are gitignored; only `*.example` templates
  are checked in.
- Use platform secrets for staging and production.
- No connection strings, API keys, or tokens in source, Dockerfiles, or workflow
  files.
- Rate-limit all public endpoints.
- CORS must allowlist known frontend origins only. Never use `AllowAnyOrigin` in
  staging or production.
- Do not expose admin or debug endpoints without additional protection.
- RSS/scraped content is untrusted input. Sanitize and validate before storage
  and before render.
- Never execute or blindly embed raw HTML from sources into the PWA.

New endpoint checklist:

1. Input validation + ProblemDetails errors.
2. Rate limiting applied.
3. No secrets in logs.
4. OpenAPI documented.
5. CORS still allowlist-only.

## Testing

- Backend tests live in `apps/api.Tests`.
- Use xUnit unit tests for services/business logic.
- Use integration tests for API endpoints against a test database.
- Prefer WebApplicationFactory + real HTTP calls for endpoint behavior.
- Frontend tests use Jest + React Native Testing Library for screens/hooks with
  logic.
- Use Playwright against the Expo web export for critical E2E flows.
- Keep E2E fast and stable.
- No PR merges without passing CI: lint, unit/integration tests, and builds.
- Do not write tests that only assert mocks were called. Assert behavior and
  outputs.
