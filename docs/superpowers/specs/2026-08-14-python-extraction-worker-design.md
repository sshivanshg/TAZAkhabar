# Design: Python multi-tier extraction worker + .NET article ingest

- Status: Approved for implementation planning
- Date: 2026-08-14
- Related: `docs/PRD.md` (FR-1, FR-2), `docs/superpowers/specs/2026-08-13-pdf-and-city-scrape-ingest-design.md`, `docs/adr/001-monorepo.md`, `.cursor/rules/architecture.mdc`, `.cursor/rules/security.mdc`

## Goal

Replace in-process .NET HTML scraping with a **Python extraction worker** that crawls seeded city list pages, extracts clean article body text and hero images via a three-tier fallback (static → trafilatura → Playwright), and POSTs structured payloads into the existing .NET API. The API remains the sole Postgres owner and continues Claude summarization, dedupe, feed publishing, RSS, and PDF ingest.

Admin **Sources → Run now** for `Scrape` sources must keep working against the live ingestion SSE console.

## Non-goals (v1)

- Cron / platform-scheduled automatic crawls
- Python connecting directly to Postgres or Neon
- Vector database ingestion
- Persisting inline image galleries or raw HTML on `Article`
- Full 8-portal URL registry beyond sources already seeded as `SourceType.Scrape`
- Spawning Playwright from the .NET process without a running extraction worker
- Replacing RSS or PDF pipelines
- Remote process orchestration across hosts beyond a configured worker base URL

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Role split | Python = extraction only; .NET = validate, dedupe, Claude summary, EF persist, feed |
| Persistence | Option B: store `CleanText` (1:1 content table) plus headline, summary, hero image, metadata |
| Source registry | Hybrid: .NET `Sources` owns active list URLs / city / language; Python `config/sources.json` holds domain-level selector overrides and tier hints |
| .NET scrape path | Hard cutover: `ScrapeIngestService` HTML crawl retired for city pages; RSS/PDF unchanged |
| v1 coverage | Pilot cities and scrape rows already in `SeedData` (and admin-added scrape sources with those patterns) |
| Scheduling | Manual only: admin **Run now** + Python CLI; no cron in v1 |
| Architecture approach | Thin Python extractor + fat `POST /api/ingest/articles` (sync Claude per new article; batch cap) |
| Admin integration | Scrape trigger calls extraction worker HTTP API with `{ sourceId, runId }`; worker POSTs articles back; .NET emits SSE on that run |
| Auth worker↔API | Existing `X-Ingest-Key` pattern |
| Inline media | Extracted for quality filtering only; API stores single `ImageUrl` (hero/OG) in v1 |

## Architecture

```
Admin SPA Sources "Run now" (Scrape)
        │
        ▼
POST /api/admin/sources/{id}/trigger
  → create IngestionRun
  → HTTP POST ExtractionWorker { sourceId, runId }
        │
        ▼
┌─────────────────────────────────────┐
│ apps/ingestion_engine (Python)      │
│ GET /api/ingest/sources (or by id)  │
│ list crawl → Tier1→2→3 extract      │
│ sources.json domain overrides       │
│ POST /api/ingest/articles           │
└──────────────────┬──────────────────┘
                   │ X-Ingest-Key
                   ▼
┌─────────────────────────────────────┐
│ apps/api (.NET)                     │
│ URL dedupe → Claude(cleanText)      │
│ Article + ArticleContent.CleanText  │
│ IngestionEvents → admin LiveTerminal│
│ RSS + PDF unchanged                 │
└─────────────────────────────────────┘
```

Hard boundaries:

- Only `apps/api` talks to Postgres.
- Reader / admin never call the Python worker directly (except operators running CLI locally).
- Untrusted scrape HTML is never executed or embedded raw in the Expo reader.

## Package layout (Python)

```
apps/ingestion_engine/
├── pyproject.toml
├── README.md                      # how to install, serve, CLI
├── config/sources.json            # domain overrides
├── extractors/
│   ├── base.py
│   ├── static_extractor.py        # newspaper4k + BeautifulSoup og:image
│   ├── trafilatura_engine.py
│   └── dynamic_browser.py         # Playwright async + scroll for lazy images
├── utils/
│   ├── media_cleaner.py           # absolute URLs; drop logos/pixels/<200px
│   └── deduplicator.py            # SHA-256 + local 24h skip cache
├── api_client.py                  # aiohttp: GET sources, POST articles
├── server.py                      # worker HTTP: POST /run { sourceId, runId }
├── pipeline.py
└── main.py                        # CLI: --source-id, --all, --dry-run, --limit
```

### Multi-tier extraction

1. **Tier 1 — Fast static:** newspaper4k metadata + BeautifulSoup `og:image`; body from newspaper when non-empty.
2. **Tier 2 — Structural:** trafilatura on HTML with `include_images=True` when Tier 1 body is empty/truncated.
3. **Tier 3 — Headless:** Playwright Chromium, `wait_until="networkidle"`, scroll to bottom, extract article container text/images when JS/lazy-load blocks earlier tiers.

Success criteria for an article: non-empty title + non-empty `clean_text`. Hero image preferred from OG / top image after `media_cleaner` filters.

### Local dedupe cache

Python hashes canonical URL (SHA-256) and skips re-fetch within a **24-hour local window**. Postgres `SourceUrl` uniqueness remains the source of truth for insert/skip.

## .NET API contract

### `GET /api/ingest/sources?type=scrape` (header `X-Ingest-Key`)

Returns active scrape sources for the worker:

```json
{
  "sources": [
    {
      "id": 12,
      "name": "Amar Ujala Jhansi (scrape)",
      "feedUrl": "https://www.amarujala.com/uttar-pradesh/jhansi",
      "cityId": 1,
      "citySlug": "jhansi",
      "cityName": "Jhansi",
      "language": "hi",
      "scrapeConfig": null
    }
  ]
}
```

Optional filter: `id={sourceId}` for single-source runs.

### `POST /api/ingest/articles` (header `X-Ingest-Key`)

Batch body (max **20** articles per request):

```json
{
  "runId": 42,
  "articles": [
    {
      "sourceId": 12,
      "canonicalUrl": "https://www.amarujala.com/...",
      "title": "...",
      "publishedAt": "2026-08-14T02:15:00Z",
      "heroImageUrl": "https://...",
      "cleanText": "plain body...",
      "detectedLanguage": "hi",
      "extractionTier": "Tier1_Newspaper4k"
    }
  ]
}
```

Behavior per item:

1. Validate required fields, URL safety (existing `SafeHttp` rules), length caps (`cleanText` e.g. 50k chars).
2. Resolve `sourceId` → city; reject inactive / non-scrape sources.
3. Normalize URL (absolute; strip fragment / tracking query noise consistent with existing scrape dedupe).
4. If duplicate `SourceUrl` → `skippedDuplicate` (no Claude call).
5. Else Claude summarize from `cleanText` (reuse `IArticleIntelligence.SummarizeArticleAsync`); categorize via existing intelligence patterns where applicable.
6. Insert `Article` (Published for scrape, same as current scrape gate) + `ArticleContent.CleanText`; set `ImageUrl` from `heroImageUrl` when valid.
7. Emit `IngestionEvent` lines on `runId` when provided (`article_inserted`, `article_skipped`, `article_failed`).
8. Response aggregates counts + per-item status.

### Admin scrape trigger change

`POST /api/admin/sources/{id}/trigger` for `SourceType.Scrape`:

1. Create `IngestionRun` (unchanged); return **202** to admin immediately (same as today).
2. Background work: HTTP `POST {ExtractionWorker:BaseUrl}/run` with body `{ sourceId, runId }` and header `X-Ingest-Key` (same secret as API ingest).
3. The worker **holds that HTTP request open** until the source run finishes (list crawl + extract + all `POST /api/ingest/articles` batches). .NET awaits with a long timeout (e.g. 10 minutes). Article SSE events appear during the wait as batches land.
4. On worker success response → finalize `IngestionRun` (`CompletedAt`, counts if returned). On unset base URL, connection failure, non-success status, or timeout → emit SSE `error` and mark run failed.
5. Do **not** call `ScrapeIngestService.RunSourceAsync` for HTML crawl.

RSS trigger path unchanged.

### Worker `POST /run`

- Auth: require `X-Ingest-Key` matching the shared ingest secret.
- Body: `{ "sourceId": number, "runId": number }`.
- Loads that source via `GET /api/ingest/sources?id={sourceId}`, runs pipeline, POSTs article batches including `runId`, returns JSON summary `{ inserted, skipped, failed }`.

### `POST /api/ingest/scrape`

Retire bulk in-process scrape: return **410 Gone** with detail pointing operators to the Python worker / admin Run now.

## Data model

Prefer **1:1 `ArticleContent`** so list/feed queries stay lean:

| Entity | Fields |
|--------|--------|
| `Article` | Existing columns; `ImageUrl` = hero; `SourceUrl` = canonical; `DetectedLanguage`; scrape remains auto-`Published` |
| `ArticleContent` | `ArticleId` PK/FK, `CleanText` (required), `ExtractionTier` (optional string) |

Migration under `infra/migrations/` (do not edit applied migrations). OpenAPI + `packages/shared-types` updated in the same change when DTOs are public; internal ingest DTOs still documented in OpenAPI.

## Configuration

| Component | Settings |
|-----------|----------|
| .NET | `ExtractionWorker:BaseUrl`, `ExtractionWorker:Timeout` (default 10m), existing `RssIngest:Secret` (ingest key) |
| Python | `API_BASE_URL`, `INGEST_KEY` (same secret), bind host/port for `/run`, optional Playwright channel |

Secrets via env / platform secrets only; never commit `.env`.

## Error handling

- Tier failures fall through; all tiers fail → item failed, continue batch.
- API 401 / 429 on article POST → worker aborts remaining work and returns HTTP error from `/run`; .NET emits SSE `error` and fails the run.
- Per-source CLI `--all`: one source exception does not abort remaining sources.
- Claude failure on one article → that item `failed`; others proceed (match current scrape tolerance).

## Testing

**API (`apps/api.Tests`)**

- `GET /api/ingest/sources` auth + filter.
- `POST /api/ingest/articles`: insert, duplicate skip, missing key, missing `cleanText`, invalid URL, batch cap.
- Admin scrape trigger: worker URL missing → failed run / clear error; with fake worker handler → 202 and run created.
- Assert `CleanText` persisted; summary non-empty on success path (intelligence mocked where appropriate).

**Python**

- Unit tests: `media_cleaner`, URL normalization, dedupe cache.
- Fixture HTML tests for Tier 1/2 without live network.
- Playwright tests optional / marked, not required in default CI.

**Manual**

- Start API + Python worker; admin Run now on a seeded scrape source; confirm LiveTerminal events and feed article with image + summary.

## Rollout

1. Ship API ingest endpoints + `ArticleContent` + trigger wiring (feature works when worker is up).
2. Ship `apps/ingestion_engine` with overrides for domains present in seed scrape URLs.
3. Disable / 410 old `ScrapeIngestService` crawl path and `/ingest/scrape` bulk runner.
4. Keep seed scrape `FeedUrl` rows as list-page URLs for the worker.

## Success criteria

- Admin can trigger a scrape source and see live events without .NET fetching article HTML itself.
- New articles appear with Claude summary, hero image when available, and stored `CleanText`.
- Duplicate URL re-runs skip without extra Claude spend.
- RSS and PDF flows unchanged.
- Architecture boundary intact: Python has no DB connection string.
