# Admin Editorial Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Editorial review pipeline on the API (Phase 1) plus a separate Vite admin app (Phase 2) so editors can log in, review ingest, publish/reject, create articles, manage sources, and view ingestion logs.

**Architecture:** Additive EF schema (`Article` status/mock/source FK, `Source`, `IngestionRun`). Shared-password JWT on `/api/admin/*`. Ingest reads DB sources, writes `PendingReview` + per-source `IngestionRun`. Public feed is `Published && !IsMock`. Render Cron Job hits existing `POST /api/ingest/rss`. `apps/admin` is a Vite React SPA using `@newsfeed/shared-types`.

**Tech Stack:** .NET 8, EF Core + Npgsql, JWT Bearer, xUnit + WebApplicationFactory, Vite + React + TypeScript, NSwag shared-types.

**Spec:** `docs/superpowers/specs/2026-08-13-admin-editorial-phase1-design.md` plus original Phase 2 UI requirements (login, dashboard, review queue, article editor, sources, logs; DataTable + StatusBadge; left nav).

## Global Constraints

- Readers stay unauthenticated. Admin auth is a single shared password + displayName JWT (8 hours, HS256, claims `sub=admin` and `name=displayName`).
- Admin routes live under `/api/admin/*`. `X-Ingest-Key` is not accepted there. `POST /api/ingest/rss` keeps `X-Ingest-Key`.
- `PublishedAt` is the source/RSS date; publish must not overwrite it. Manual create sets `PublishedAt=now`.
- `ReviewedBy`/`ReviewedAt` only — no `PublishedBy` column.
- Public `GET /api/articles` and `GET /api/articles/{id}` return only `Status=Published AND IsMock=false`.
- New ingest inserts: `PendingReview`, `IngestedAt=utc now`, `SourceId` set, `IsMock=false`.
- `Source` keeps `Kind` (`CityEdition`|`Wider`) and `Language`. Wider matching unchanged (`PlaceNameMatcher`).
- Category writes: `Local`, `State`, `National`, `Business`, `Health`, `Sports`. Ingest defaults to `Local`.
- One `IngestionRun` per source per attempt, success and failure.
- Enums stored as strings. Additive migration only. Never edit applied migrations.
- RSS and admin text are untrusted: length-cap, no raw HTML. Do not commit secrets.
- OpenAPI + `packages/shared-types` in the same PR as the new endpoints. No `any` / hand-patched types.
- `apps/admin` is a separate package, not routes inside `apps/app`.
- Commits: Conventional Commits. TDD: failing test first, then implementation.
- Test via `dotnet test NewsFeed.sln` for API; `pnpm --filter @newsfeed/admin` for admin when it exists.
- Follow existing endpoint style: minimal APIs, ProblemDetails, rate limiting, `WithOpenApi()`.

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/Data/Entities/Article.cs` | Status, ingest/review stamps, IsMock, SourceId |
| `apps/api/Data/Entities/Source.cs` | Feed allowlist in DB |
| `apps/api/Data/Entities/IngestionRun.cs` | Per-source run log |
| `apps/api/Data/ArticleStatus.cs` etc. | Enums |
| `apps/api/Data/AppDbContext.cs` | Mapping, indexes, HasData |
| `apps/api/Data/SeedData.cs` | Strip `[MOCK]`, set IsMock, seed sources |
| `infra/migrations/*EditorialWorkflow*` | Additive migration + SQL backfill |
| `apps/api/Endpoints/ArticlesEndpoints.cs` | Public Published && !IsMock |
| `apps/api/Ingest/RssIngestService.cs` | DB sources, PendingReview, IngestionRun |
| `apps/api/Options/AdminOptions.cs` | Password + JWT key |
| `apps/api/Endpoints/AdminAuthEndpoints.cs` | Login |
| `apps/api/Endpoints/AdminArticlesEndpoints.cs` | Review queue writes |
| `apps/api/Endpoints/AdminSourcesEndpoints.cs` | Sources + trigger + runs |
| `docs/adr/005-admin-shared-credential.md` | Admin-only auth |
| `docs/adr/006-internal-admin-spa.md` | Exception to ADR-003 |
| `apps/admin` | Vite React admin SPA |
| `packages/shared-types` | Regenerated from OpenAPI |

---

### Task 1: Schema, seed, public feed filter

**Files:**
- Create: `apps/api/Data/ArticleStatus.cs`, `apps/api/Data/SourceType.cs`, `apps/api/Data/SourceKind.cs`, `apps/api/Data/FetchStatus.cs`, `apps/api/Data/Entities/Source.cs`, `apps/api/Data/Entities/IngestionRun.cs`
- Modify: `apps/api/Data/Entities/Article.cs`, `apps/api/Data/AppDbContext.cs`, `apps/api/Data/SeedData.cs`, `apps/api/Endpoints/ArticlesEndpoints.cs`, `apps/api.Tests/CitiesAndArticlesEndpointTests.cs`, `apps/api.Tests/RssIngestServiceTests.cs` (compile only if Article ctor needs new fields)
- Create: `infra/migrations/<timestamp>_EditorialWorkflow.cs` via `dotnet ef`
- Test: `apps/api.Tests/CitiesAndArticlesEndpointTests.cs`

**Interfaces:**
- Produces: `Article.Status` (`ArticleStatus` enum), `IsMock`, `IngestedAt`, `ReviewedBy`, `ReviewedAt`, `SourceId`; `Source` and `IngestionRun` entities mapped; public list/by-id filter.

- [ ] **Step 1: Write failing tests** for public feed hiding mocks and unpublished rows.

Replace `GetArticles_ForJhansi_ReturnsNewestFirst` so it no longer expects `[MOCK]` in headlines (public list for seed-only Jhansi is empty). Replace the three Jhansi mock-hiding tests:

```csharp
[Fact]
public async Task GetArticles_HidesMockSeedRows()
{
    var client = _factory.CreateSeededClient();
    var jhansi = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
    var lucknow = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=lucknow");
    Assert.NotNull(jhansi);
    Assert.NotNull(lucknow);
    Assert.Equal(0, jhansi.Total);
    Assert.Empty(jhansi.Items);
    Assert.Equal(0, lucknow.Total);
}

[Fact]
public async Task GetArticles_ReturnsOnlyPublishedNonMock()
{
    var client = _factory.CreateSeededClient();
    using (var scope = _factory.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Articles.AddRange(
            new Article { CityId = 2, Headline = "Live published", Summary = "s", SourceName = "A", SourceUrl = "https://example.com/live-pub", PublishedAt = DateTimeOffset.UtcNow, Category = "Local", Status = ArticleStatus.Published, IsMock = false },
            new Article { CityId = 2, Headline = "Pending", Summary = "s", SourceName = "A", SourceUrl = "https://example.com/pending", PublishedAt = DateTimeOffset.UtcNow, Category = "Local", Status = ArticleStatus.PendingReview, IsMock = false },
            new Article { CityId = 2, Headline = "Draft", Summary = "s", SourceName = "A", SourceUrl = "https://example.com/draft", PublishedAt = DateTimeOffset.UtcNow, Category = "Local", Status = ArticleStatus.Draft, IsMock = false });
        db.SaveChanges();
    }
    var payload = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
    Assert.Equal(1, payload!.Total);
    Assert.Equal("Live published", Assert.Single(payload.Items).Headline);
}

[Fact]
public async Task GetArticleById_UnpublishedOrMock_Returns404()
{
    var client = _factory.CreateSeededClient();
    int mockId, pendingId;
    using (var scope = _factory.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var mock = db.Articles.First(a => a.IsMock);
        mockId = mock.Id;
        var pending = new Article { CityId = 2, Headline = "P", Summary = "s", SourceName = "A", SourceUrl = "https://example.com/p-byid", PublishedAt = DateTimeOffset.UtcNow, Category = "Local", Status = ArticleStatus.PendingReview, IsMock = false };
        db.Articles.Add(pending);
        db.SaveChanges();
        pendingId = pending.Id;
    }
    Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/articles/{mockId}")).StatusCode);
    Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/articles/{pendingId}")).StatusCode);
}
```

Rewrite `GetArticles_QueryFilter_MatchesHeadlineSubstring` / category / by-id / newest-first to insert a published non-mock Jhansi article first (or assert empty + insert). Keep invalid-city tests.

- [ ] **Step 2: Run tests — expect FAIL** (types/filter missing). `dotnet test apps/api.Tests --filter GetArticles_HidesMockSeedRows`

- [ ] **Step 3: Implement schema + filter**

Enums as C# enums stored via `HasConversion<string>()`:

- `ArticleStatus`: Draft, PendingReview, Published, Rejected, Archived
- `SourceType`: Rss, Manual
- `SourceKind`: CityEdition, Wider (can reuse `RssFeedKind` if you map it; prefer a Data-layer `SourceKind` matching those names)
- `FetchStatus`: Success, Error

`Article` new properties with defaults so existing test helpers compile: `Status = ArticleStatus.Published`, `IsMock = false`.

`Source`: Id, Name (120), FeedUrl (500, nullable), CityId, Type, Kind, Language (8), IsActive, LastFetchedAt, LastFetchStatus, LastErrorMessage (1000). FK City. Unique filtered index on FeedUrl where Type=Rss and FeedUrl not null (Npgsql: `HasFilter`).

`IngestionRun`: Id, SourceId, StartedAt, CompletedAt, ArticlesFound/Added/Skipped/Failed, ErrorSummary (1000). Index (SourceId, StartedAt).

AppDbContext: snake_case columns like existing articles. Indexes `(status, city_id)`, `(source_id)`.

SeedData: strip `[MOCK] ` / `[MOCK]` prefix from every headline; set `IsMock=true`, `Status=Published` on all seed articles. Add `Sources` HasData for the four Jhansi feeds (Ids 1–4, CityId=2):

1. Amar Ujala, `https://www.amarujala.com/rss/jhansi.xml`, hi, CityEdition, active
2. Amar Ujala, `https://www.amarujala.com/rss/lalitpur.xml`, hi, CityEdition, active
3. Google News, `https://news.google.com/rss/search?q=Jhansi&hl=en-IN&gl=IN&ceid=IN:en`, en, CityEdition, active
4. Amar Ujala, `https://www.amarujala.com/rss/uttar-pradesh.xml`, hi, Wider, active

Public query: `.Where(a => a.Status == ArticleStatus.Published && !a.IsMock)`. Remove Jhansi `[MOCK]` special case.

Generate migration into `infra/migrations` (project already compiles those files). After `dotnet ef migrations add EditorialWorkflow --project apps/api --output-dir ../../infra/migrations`, edit `Up` to backfill existing rows: `status='Published'`; `is_mock = headline LIKE '[MOCK]%'`; then `UPDATE articles SET headline = regexp_replace(headline, '^\[MOCK\]\s*', '') WHERE is_mock`. Do not edit prior migration files.

- [ ] **Step 4: `dotnet test NewsFeed.sln` — all pass**

- [ ] **Step 5: Commit** `feat: add editorial article status and hide unpublished from public feed`

---

### Task 2: Ingest from Source table + IngestionRun

**Files:**
- Modify: `apps/api/Ingest/RssIngestService.cs`, `apps/api/Options/RssIngestOptions.cs`, `apps/api/appsettings.json`, `apps/api.Tests/RssIngestServiceTests.cs`, `apps/api.Tests/IngestEndpointTests.cs`, `apps/api.Tests/FakeRssFeedClient.cs` if needed
- Produce: `RunSourceAsync(int sourceId, CancellationToken)` returning `IngestionRun`

**Interfaces:**
- Consumes: `Source` rows from Task 1
- Produces: inserts `PendingReview` + `IngestedAt` + `SourceId`; one `IngestionRun` per source; updates `LastFetchedAt`/`LastFetchStatus`/`LastErrorMessage`
- `RunAsync()` loops active RSS sources in DB, ignores `RssIngest:Feeds`

- [ ] **Step 1: Write failing tests** in `RssIngestServiceTests`:

Assert inserted article `Status == PendingReview`, `IngestedAt` not null, `SourceId` set. Assert `IngestionRuns` count == feeds attempted. Failed fetch: `LastFetchStatus == Error`, run has `ErrorSummary`, healthy feed still inserts. Remove `RssFeedConfig[]` from `CreateService`; insert `Source` entities instead. Config `Feeds` list must not be read even if populated.

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement.** Drop `Feeds` from `RssIngestOptions` and `appsettings.json`. Map `Source.Kind` to existing `PlaceNameMatcher` Wider behavior. Keep `IngestRunResult` aggregate for HTTP. Per-source try/catch + `ChangeTracker.Clear()` as today. Cancellation still throws.

- [ ] **Step 4: `dotnet test NewsFeed.sln`**

- [ ] **Step 5: Commit** `feat: ingest from database sources as pending review`

---

### Task 3: Admin login JWT

**Files:**
- Create: `apps/api/Options/AdminOptions.cs`, `apps/api/Endpoints/AdminAuthEndpoints.cs`, `docs/adr/005-admin-shared-credential.md`, `apps/api.Tests/AdminAuthTests.cs`
- Modify: `apps/api/Program.cs`, `apps/api/NewsFeed.Api.csproj` (JwtBearer), `apps/api/appsettings.json`, `apps/api/appsettings.Development.json`, `apps/api.Tests/NewsFeedWebApplicationFactory.cs`, `.env.example`

**Interfaces:**
- `POST /api/admin/login` `{ password, displayName }` → `{ token, expiresAt }`
- Policy `admin-login`: 5 / IP / minute
- JwtBearer default for `/api/admin` group except login

- [ ] **Step 1: Failing tests** — good login 200 with token; wrong password 401; blank displayName 400; displayName > 80 → 400.

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement.** Package `Microsoft.AspNetCore.Authentication.JwtBearer` 8.0.11. `Admin:Password` / `Admin:JwtSigningKey` empty in `appsettings.json`; dev values `dev-admin-password` and a 32+ char dummy key in Development + test factory. Fixed-time password compare (reuse ingest pattern). JWT 8 hours, HS256, `ClaimTypes.Name` = displayName, `sub=admin`. Map login on a group with `RequireRateLimiting("admin-login")`. Do not require auth on login. ADR-005: admin-only shared credential; readers remain no-auth (ADR-002). Factory: `UseSetting("Admin:Password", "test-admin-password")` and a test signing key.

- [ ] **Step 4: `dotnet test NewsFeed.sln`**

- [ ] **Step 5: Commit** `feat: add shared-credential admin JWT login`

---

### Task 4: Admin article endpoints

**Files:**
- Create: `apps/api/Endpoints/AdminArticlesEndpoints.cs`, DTOs under `apps/api/Dtos/`, `apps/api.Tests/AdminArticlesTests.cs`
- Modify: `Program.cs` to map `/api/admin` group with `RequireAuthorization()` + public rate limit, except login already mapped

**Interfaces:**
- `GET /api/admin/articles?status=&city=&source=&page=` page size 20, default page 1, newest PublishedAt
- `PATCH /api/admin/articles/{id}` partial headline/summary/category/city slug
- `POST .../publish` and `.../reject` as spec
- `POST /api/admin/articles` manual create

- [ ] **Step 1: Failing tests** covering spec Tests/Admin writes + auth 401 without bearer + ingest key rejected + publish stamps ReviewedBy from JWT name and does not change PublishedAt + duplicate sourceUrl 409 + archived 409 + invalid category 400 + draft not on public feed + publishNow appears on public feed.

Helper: login then `Authorization: Bearer`.

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Implement.** Sanitize/length-cap like ingest. Allowed categories array. City by slug. `publishNow` sets Published + review stamps. Draft otherwise.

- [ ] **Step 4: `dotnet test NewsFeed.sln`**

- [ ] **Step 5: Commit** `feat: add admin article review and manual create APIs`

---

### Task 5: Admin sources, trigger, runs, cron, CORS

**Files:**
- Create: `apps/api/Endpoints/AdminSourcesEndpoints.cs`, DTOs, `apps/api.Tests/AdminSourcesTests.cs`
- Modify: `render.yaml`, `appsettings.json` Cors, `appsettings.Development.json` Cors if needed, `.env.example`, `Program.cs`

- [ ] **Step 1: Failing tests** — list sources ordered by name; create RSS; duplicate feedUrl 409; trigger with JWT writes IngestionRun and returns it; trigger Manual or inactive 400; GET ingestion-runs filter sourceId; ingest-key on trigger 401.

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Implement endpoints. `RssIngestService.RunSourceAsync`. Render cron:

```yaml
  - type: cron
    name: newsfeed-rss-ingest
    runtime: docker
    dockerfilePath: ./infra/docker/Dockerfile.api
    dockerContext: .
    plan: starter
    schedule: "*/45 * * * *"
    dockerCommand: "curl -fsS -X POST \"$INGEST_URL/api/ingest/rss\" -H \"X-Ingest-Key: $RssIngest__Secret\""
```

If Render cron dockerCommand is awkward, use `runtime: native` with a curl image **or** document a cron that runs `curl` — prefer a Render cron service hitting the **already-deployed web service URL** via env `INGEST_URL` (sync: false) rather than booting the API image. Use:

```yaml
  - type: cron
    name: newsfeed-rss-ingest
    runtime: python
    schedule: "*/45 * * * *"
    buildCommand: "pip install requests"
    startCommand: "python -c \"import os,requests; r=requests.post(os.environ['INGEST_URL']+'/api/ingest/rss', headers={'X-Ingest-Key': os.environ['RssIngest__Secret']}); r.raise_for_status()\""
    envVars:
      - key: INGEST_URL
        sync: false
      - key: RssIngest__Secret
        sync: false
```

CORS: add `http://localhost:5173` to `appsettings.json` AllowedOrigins and `.env.example`.

- [ ] **Step 4: `dotnet test NewsFeed.sln`**

- [ ] **Step 5: Commit** `feat: add admin source management, ingest trigger, and Render cron`

---

### Task 6: OpenAPI + shared-types

**Files:** `packages/shared-types/openapi/openapi.json`, generated TS, `apps/api` swagger JWT if needed so admin routes appear.

- [ ] **Step 1: Fetch OpenAPI from a running API or `MapSwagger` export.** Follow `packages/shared-types` scripts: start API if needed, `pnpm --filter @newsfeed/shared-types fetch-openapi && pnpm --filter @newsfeed/shared-types generate`. Confirm operations for login, admin articles, sources, runs. No `any`.

- [ ] **Step 2: Commit** `chore: regenerate shared-types for admin editorial APIs`

---

### Task 7: Admin SPA scaffold + login

**Files:**
- Create: `docs/adr/006-internal-admin-spa.md` (internal Vite app; ADR-003 still owns the reader client)
- Create: `apps/admin` Vite React TS, `pnpm-workspace.yaml` add `apps/admin`, package `@newsfeed/admin`
- Login page, token in sessionStorage, API client using shared-types + `import.meta.env.VITE_API_BASE_URL` default `http://localhost:8080`

- [ ] Scaffold with `pnpm create vite` (react-ts) in `apps/admin` if empty. Dense internal tool, not the reader card UI. Copy color values from `apps/app/src/theme/tokens.ts` (accent `#4F6BFF`, text `#1A1B1E`, surface `#FFFFFF`, background `#F5F6FA`) into `apps/admin/src/theme.ts` — values only, own CSS.

- [ ] Login: password + display name. On success store token + expiresAt. Unauthenticated routes redirect to login.

- [ ] No mock API. Real `POST /api/admin/login`.

- [ ] Commit `feat: scaffold admin SPA with shared-credential login`

---

### Task 8: Shell, DataTable, StatusBadge

**Files:** `apps/admin/src/components/DataTable.tsx`, `StatusBadge.tsx`, `Layout.tsx`

- [ ] Left nav: Dashboard, Review Queue, Sources, Logs. Simple dense layout, no floating chrome.
- [ ] `StatusBadge`: PendingReview amber, Published green, Rejected red, Draft gray, Archived muted.
- [ ] `DataTable`: sort, filter, paginate — reusable props (`columns`, `rows`, `page`, `total`, `onPageChange`).
- [ ] Commit `feat: add admin layout, data table, and status badges`

---

### Task 9: Dashboard + review queue

**Files:** `apps/admin/src/pages/Dashboard.tsx`, `ReviewQueue.tsx`

- [ ] Dashboard: pending review count (from `GET /api/admin/articles?status=PendingReview&page=1` total); per-source last run/status/articles added (sources list + optional latest runs); primary **Add article / Push to feed** button → editor.
- [ ] Review queue table: headline, source, city, category, ingested time, status. Filters city/source/status. Inline Approve / Reject / Edit. No full-page nav for approve/reject.
- [ ] Commit `feat: add admin dashboard and review queue`

---

### Task 10: Article editor (review + manual create)

**Files:** `apps/admin/src/pages/ArticleEditor.tsx`

- [ ] Fields: headline, summary, category dropdown (fixed list), city dropdown (`GET /api/cities`), source name, source URL, status. Actions: Publish, Save as draft, Reject. Empty form for create (`POST /api/admin/articles`). Existing: PATCH then publish/reject.
- [ ] Commit `feat: add admin article editor and manual publish`

---

### Task 11: Sources + ingestion logs

**Files:** `apps/admin/src/pages/Sources.tsx`, `IngestionLogs.tsx`

- [ ] Sources table: name, city, feed URL, active toggle (PATCH), last fetch status/time, Run now (trigger), Add source form.
- [ ] Logs table: filter by source, found/added/skipped/failed, error text.
- [ ] Commit `feat: add admin source management and ingestion logs`

---

### Task 12: Admin app wiring and README note

- [ ] Root `package.json` script `dev:admin`. Admin builds with `tsc && vite build`. Types from `@newsfeed/shared-types` only.
- [ ] `.env.example` `VITE_API_BASE_URL` in apps/admin. README one paragraph on `pnpm --filter @newsfeed/admin dev` — only if README already documents apps; otherwise skip new markdown except ADR already added.
- [ ] `pnpm --filter @newsfeed/admin build` succeeds.
- [ ] Commit `chore: wire admin workspace scripts`
