# Design: Admin editorial workflow — Phase 1 (schema, APIs, ingest)

- Status: Approved
- Date: 2026-08-13
- Related: `docs/PRD.md` (FR-2 manual review, content pipeline), `docs/adr/002-no-auth-mvp.md`, `docs/adr/003-expo-universal-client.md`, `docs/adr/004-render-cloudflare-neon-hosting.md`, `docs/superpowers/specs/2026-08-13-jhansi-rss-ingest-design.md`

## Goal

Give editors a real review pipeline on top of the live Jhansi RSS ingest: ingested stories land as `PendingReview` instead of going straight to readers; editors authenticate with a shared credential and a display name; they can edit, publish, reject, and create articles by hand; sources live in the database (not `appsettings.json`); every ingest attempt (cron or manual) writes an `IngestionRun`.

This slice is **backend only**. No `apps/admin` UI.

## Non-goals

- `apps/admin` frontend (Phase 2)
- Per-editor accounts, email/password users, or role permissions
- Category CRUD (fixed list stays)
- AI / rewritten summaries (RSS snippet and editor-written summary only)
- Reader UI/UX changes in `apps/app`
- HTML scraping
- Changing `X-Ingest-Key` on `POST /api/ingest/rss`

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Editor identity | Single shared admin password; free-text `displayName` at login; stored in JWT; copied to `ReviewedBy` |
| Token | HS256 JWT, 8 hours; `sub=admin`, `name=displayName` |
| Admin URL prefix | `/api/admin/*` (not site-root `/admin`) |
| Ingest machine auth | Unchanged `X-Ingest-Key` on `POST /api/ingest/rss`; not valid on admin routes |
| Schedule | Render Cron Job every 45 minutes hitting `/api/ingest/rss` (not Railway; not in-process timer) |
| `PublishedAt` | Existing column stays the **source/RSS date**. Manual create sets it to now. Publish does not overwrite it |
| Editorial stamps | `ReviewedBy` + `ReviewedAt` only; no `PublishedBy` column |
| Public feed | `Status=Published AND IsMock=false` on list **and** by-id |
| Mocks | Backfill `IsMock` from `[MOCK]` prefix, then strip the prefix. Readers never see mocks |
| `SourceId` on `Article` | Nullable FK. Ingest stamps it. Manual create leaves it null (free-text name/url) |
| Source extras | Keep `Kind` (`CityEdition` \| `Wider`) and `Language` so Wider Jhansi matching still works |
| New ingest status | `PendingReview` + `IngestedAt=now` |
| Existing rows | `Status=Published`. Live ingested rows: `SourceId=null`, `IngestedAt=null` (cannot recover) |
| Dashboard API | None. Phase 2 uses `GET sources` + `GET articles?status=PendingReview` (`total`) |

## Architecture

Public readers stay unauthenticated. Editors use a shared password in env (`Admin:Password`) and a signing key (`Admin:JwtSigningKey`), same secret-handling pattern as `RssIngest:Secret`. Successful login returns an HS256 JWT valid for 8 hours. Login is rate-limited at 5 requests / IP / minute. Other `/api/admin/*` routes use the existing public limiter.

`RssIngest:Feeds` leaves config. Active `Source` rows with `Type=Rss` are the allowlist. `RssIngest:Secret` stays in env.

A new ADR will record **admin-only** auth. ADR-002 still applies to readers. ADR-003 (no second Vite app) is unchanged until Phase 2. Hosting stays Render + Cloudflare + Neon (ADR-004).

## Schema

Additive EF Core migration. Enums stored as strings. Do not drop or rename existing `City` / `Article` columns.

### `Article` additions

| Column | Type | Notes |
|--------|------|--------|
| `Status` | enum string | `Draft`, `PendingReview`, `Published`, `Rejected`, `Archived` |
| `IngestedAt` | `timestamptz` nullable | Null for manual articles |
| `ReviewedBy` | string nullable, max 80 | JWT display name |
| `ReviewedAt` | `timestamptz` nullable | |
| `IsMock` | bool, default false | |
| `SourceId` | int nullable FK → `sources` | |

`PublishedAt` remains required `timestamptz` (source/RSS date).

**Backfill**

- All existing rows: `Status=Published`.
- Headlines starting with `[MOCK]`: `IsMock=true`, then strip the prefix from `Headline`. Update `HasData` seed the same way.
- Non-mock existing rows: `IsMock=false`, `SourceId=null`, `IngestedAt=null`.

**App defaults for new ingest inserts:** `PendingReview`, `IngestedAt=utc now`, `SourceId` set, `IsMock=false`.

Keep unique index on `articles.source_url`. Add indexes: `(status, city_id)`, `(source_id)`.

### `Source`

| Column | Type |
|--------|------|
| `Id` | int PK |
| `Name` | string, max 120 |
| `FeedUrl` | string, max 500, nullable (required when `Type=Rss`) |
| `CityId` | FK → `cities` |
| `Type` | `Rss` \| `Manual` |
| `Kind` | `CityEdition` \| `Wider` |
| `Language` | string, max 8 |
| `IsActive` | bool |
| `LastFetchedAt` | `timestamptz` nullable |
| `LastFetchStatus` | `Success` \| `Error` nullable |
| `LastErrorMessage` | string nullable, max 1000 |

Unique `FeedUrl` among rows where `Type=Rss` and `FeedUrl` is not null.

Migration inserts the four current Jhansi feeds from `appsettings.json` as active RSS sources (Amar Ujala Jhansi, Amar Ujala Lalitpur, Google News Jhansi, Amar Ujala UP / Wider). Then remove `RssIngest:Feeds` from config.

### `IngestionRun`

| Column | Type |
|--------|------|
| `Id` | int PK |
| `SourceId` | FK → `sources` |
| `StartedAt` | `timestamptz` |
| `CompletedAt` | `timestamptz` nullable |
| `ArticlesFound` | int |
| `ArticlesAdded` | int |
| `ArticlesSkipped` | int |
| `ArticlesFailed` | int |
| `ErrorSummary` | string nullable, max 1000 |

Index `(source_id, started_at)`. **One row per source per attempt.** A cron pass over four feeds writes four runs. Write a run on success and on failure.

### Category

Still a string on `Article`. Admin writes must be one of: `Local`, `State`, `National`, `Business`, `Health`, `Sports`. Ingest still defaults to `Local`. No category table.

## Auth and endpoints

Empty `Admin:Password` / `Admin:JwtSigningKey` in committed `appsettings.json`. Dev placeholders in `appsettings.Development.json` (same idea as `RssIngest:Secret`). Production values are Render env (sync: false). Compare passwords with the existing ingest-key fixed-time equals helper. Do not log passwords or tokens.

### `POST /api/admin/login`

Request: `{ "password": string, "displayName": string }`  
Response: `{ "token": string, "expiresAt": datetime }`

- `displayName` required after trim; max 80 characters → 400 if missing/blank/too long.
- Wrong or missing password → 401.
- JWT valid 8 hours from issue.
- Rate limit: 5 / IP / minute → 429.
- No Bearer required.

### Admin routes (Bearer required; 401 if missing/expired/invalid)

`X-Ingest-Key` is not accepted here.

**Articles**

| Method | Behavior |
|--------|----------|
| `GET /api/admin/articles` | Query: `status`, `city` (slug), `source` (source id), `page` (1-based, default 1, size 20). Omitted filters mean all values. Newest `PublishedAt` first. Returns paginated admin article DTOs: current public fields plus `status`, `isMock`, `ingestedAt`, `reviewedBy`, `reviewedAt`, `sourceId`. |
| `PATCH /api/admin/articles/{id}` | Partial update: optional `headline`, `summary`, `category`, `city` (slug). Omitted fields stay. Does not change status. Invalid category or unknown city → 400. Unknown id → 404. Enforce existing max lengths. |
| `POST /api/admin/articles/{id}/publish` | Allowed from `Draft`, `PendingReview`, `Rejected`. Sets `Status=Published`, `ReviewedBy` from JWT `name`, `ReviewedAt=now`. Does not change `PublishedAt`. `Archived` → 409. |
| `POST /api/admin/articles/{id}/reject` | Same from-states → `Rejected` + review stamps. `Archived` → 409. |
| `POST /api/admin/articles` | Manual create. Body: `headline`, `summary`, `city` (slug), `category`, `sourceName`, `sourceUrl`, `publishNow` (bool). `IngestedAt=null`, `IsMock=false`, `SourceId=null`, `PublishedAt=now`. Status `Draft`, or `Published` when `publishNow` (also review stamps). Duplicate `sourceUrl` → 409. |

**Sources and logs**

| Method | Behavior |
|--------|----------|
| `GET /api/admin/sources` | All sources, including inactive, ordered by name. |
| `POST /api/admin/sources` | Create: `name`, `feedUrl`, `city` (slug), `type`, `kind`, `language`, `isActive`. RSS requires `feedUrl`; unique among RSS feeds. |
| `PATCH /api/admin/sources/{id}` | Partial update of the same fields. |
| `POST /api/admin/sources/{id}/trigger` | Run ingest for that source. JWT only. Returns the `IngestionRun`. Inactive or `Type=Manual` → 400. |
| `GET /api/admin/ingestion-runs` | Query: `sourceId`, `page` (size 20). Newest first. |

### Consumer (must not leak)

`GET /api/articles` and `GET /api/articles/{id}` return only rows with `Status=Published` and `IsMock=false`. By-id of anything else is 404.

Remove the Jhansi `[MOCK]`-prefix special case in `ArticlesEndpoints`.

Consequence: Agra, Kanpur, and Lucknow public feeds become empty after this migration until those cities have real published articles. That is intentional — unlabeled mocks must not appear as news. Jhansi keeps currently live ingested rows (they backfill as `Published` and `IsMock=false`).

### CORS

Add `http://localhost:5173` to development allowed origins for the future Vite admin app. Production admin origin is added when Phase 2 deploys.

### OpenAPI

Every new route is in the OpenAPI document. Regenerate `packages/shared-types` in the same PR. No `any` or hand-patched types.

## Ingest pipeline

`RssIngestService.RunAsync()` loads `Type=Rss AND IsActive` from the database. Config feed lists are gone.

For each source:

1. Insert `IngestionRun` with `StartedAt`.
2. Fetch and parse as today (city-edition vs Wider / `PlaceNameMatcher` unchanged).
3. Insert new articles as `PendingReview`, `IngestedAt=utc now`, `SourceId=source.Id`, `IsMock=false`, `PublishedAt` from RSS or now if missing, category `Local`.
4. Dedupe on `source_url` (skipped, not failed).
5. Set `CompletedAt`, counts, `ErrorSummary` if needed. Update `Source.LastFetchedAt`, `LastFetchStatus`, `LastErrorMessage`.
6. On fetch/parse exception: counts failed, `LastFetchStatus=Error`, `ErrorSummary` set, other sources still run. `ChangeTracker.Clear()` as today.

`POST /api/ingest/rss` still requires `X-Ingest-Key` and still returns aggregate `{ feedsAttempted, feedsFailed, inserted, skipped }`. Internally it loops DB sources and writes per-source runs.

`POST /api/admin/sources/{id}/trigger` calls the same per-source path and returns that run.

`render.yaml`: add a Cron Job, every 45 minutes, `POST` `/api/ingest/rss` with `X-Ingest-Key` from env. Document the key as a Render secret (`sync: false`).

## Errors

| Case | Result |
|------|--------|
| Validation (blank displayName, bad category, missing RSS feed URL, overlong fields) | 400 ProblemDetails |
| Bad/missing admin password or JWT | 401 |
| Ingest without key | 401 |
| Ingest key on `/api/admin/*` | 401 |
| Unknown article/source id | 404 |
| Duplicate `sourceUrl` / RSS `feedUrl` | 409 |
| Publish/reject `Archived` | 409 |
| Login over limit | 429 |
| One feed fails in a multi-source run | That source's run records the error; others continue; public feed still 200 |

RSS and admin-entered text are untrusted: length-cap and do not persist raw HTML.

## Tests

xUnit + `WebApplicationFactory` + in-memory DB. Assert status codes and payloads.

**Public feed**

- Seed mocks (`IsMock=true`, `Published`) are absent from `GET /api/articles?city=jhansi` and by-id is 404.
- `PendingReview` ingested rows are absent from the list; by-id is 404.
- `Draft` manual rows are absent; after publish they appear for that city, newest-first, headline has no `[MOCK]`.
- Rewrite existing tests that expect `[MOCK]` headlines or the Jhansi prefix-hiding rule.

**Auth**

- Good password + displayName → 200 token.
- Wrong password → 401.
- Missing/blank displayName → 400.
- Admin GET without Bearer → 401.
- `X-Ingest-Key` on admin routes → 401.

**Ingest**

- Only active DB RSS sources are fetched; config feed lists are ignored.
- Inserts are `PendingReview` with `IngestedAt` and `SourceId`.
- Each source writes an `IngestionRun`. Fetch failure writes a run with `ErrorSummary` and `LastFetchStatus=Error`.
- Duplicate `source_url` increments skipped, no second article.
- `POST /api/ingest/rss` without key → 401; with key → 200 aggregate counts.
- `POST /api/admin/sources/{id}/trigger` with JWT returns that run.

**Admin writes**

- PATCH invalid category or city → 400.
- Duplicate manual `sourceUrl` → 409.
- Publish/reject `Archived` → 409.
- Publish sets `ReviewedBy` from the JWT name and leaves `PublishedAt` unchanged.

Do not test a live Render cron. Assert the cron service exists in `render.yaml`. In-memory tests use updated `HasData` (mocks already `IsMock=true`, prefix stripped). Migration SQL is reviewed in the migration file.

## Follow-up (Phase 2, not this slice)

Vite (or similar) app at `apps/admin`: login, dashboard, review queue, article editor, sources, ingestion logs. Separate deploy origin. Reuse `packages/shared-types`. That slice needs an ADR exception to ADR-003 (second client is internal-only, not a reader app). Production CORS gets the admin origin then.
