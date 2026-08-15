# Ingestion

> **Living doc** — update when pipelines, article status on insert, cron, SSE, or intelligence providers change.  
> **Last verified against:** 2026-08-15 (durable manual ingest jobs and silence monitor)

## Purpose

Bring external news into Postgres: RSS, HTML scrape, PDF/image upload, optional Claude intelligence, background image enrichment, and live run events for admin.

## Boundaries

- **In scope:** `apps/api/Ingest/*`, ingest HTTP triggers, Render crons, event bus + SSE, queues/workers.
- **Out of scope:** Admin UI chrome ([05-admin](./05-admin.md)); hosting blueprint details beyond cron ([08-hosting-and-ci](./08-hosting-and-ci.md)).

## Context diagram

```mermaid
flowchart TB
  Cron[Render cron 45m] -->|X-Ingest-Key| RssEP[POST /api/ingest/rss]
  Cron -->|X-Ingest-Key| ScrapeEP[POST /api/ingest/scrape]
  DailyCron[Render cron daily 00:00 IST] -->|X-Ingest-Key| DailyEP[POST /api/ingest/daily]
  Admin[Admin JWT] -->|trigger / uploads| API[Ingest services]
  API --> Job[IngestionJobWorker]
  RssEP --> RssSvc[RssIngestService]
  ScrapeEP --> ScrapeSvc[ScrapeIngestService]
  DailyEP --> RssSvc
  DailyEP --> ScrapeSvc
  API --> PdfSvc[PdfIngestService + queue]
  RssSvc --> Bus[IngestionEventBus]
  ScrapeSvc --> Bus
  PdfSvc --> Bus
  Bus --> SSE[SSE /ingestion-runs/id/events]
  RssSvc --> Claude[ClaudeArticleIntelligence]
  PdfSvc --> Claude
  ScrapeSvc --> HTML[SafeHttp + HtmlArticleExtractor]
  RssSvc --> HTML
  RssSvc --> Feeds[RSS URLs]
  ImgQ[ImageEnrichmentWorker] --> OG[OG image extract]
  Silence[IngestSilenceMonitor] -->|warn/webhook| Alert[Ops alert]
```

## Components / key types

| Pipeline | Service | Trigger | Insert status (current) |
|----------|---------|---------|-------------------------|
| RSS | `RssIngestService.cs` | Cron or admin source trigger | `PendingReview` |
| Scrape | `ScrapeIngestService.cs` + `HtmlArticleExtractor`, `ScrapeHttpClient` | Cron or admin trigger | `PendingReview` |
| PDF / image | `PdfIngestService.cs`, `PdfTextExtractor` (PdfPig), `PdfProcessingQueue` + `PdfProcessingWorker` | Admin uploads | `PendingReview` |
| Image OG | `ArticleImageEnrichmentService`, `OgImageExtractor`, `ImageEnrichmentQueue` + worker | After ingest | Updates `ImageUrl` |

| Piece | Path / type |
|-------|-------------|
| Intelligence | `IArticleIntelligence` → `ClaudeArticleIntelligence` |
| Safety | `SafeHttp.cs` (blocks private/localhost targets; scrape re-validates each redirect `Location`) |
| Events | `IngestionEventBus`, `IngestionEvents.Emit`, `IngestionEventDto` |
| Run row | `IngestionRun` entity |
| Durable manual job | `IngestionJob` entity + `IngestionJobWorker` |
| Result DTO | `IngestRunResponse` |
| Silence alert | `IngestSilenceMonitor` (`IngestHealth__MaxSilenceMinutes`, optional webhook) |

Categories allowed for intelligence: Local, State, National, Business, Health, Sports.

## Data & control flows

### Run lifecycle

```mermaid
stateDiagram-v2
  [*] --> Started: create IngestionRun + event started
  Started --> Fetching: event fetch
  Fetching --> Progress: event progress
  Progress --> Progress: more items
  Progress --> Completed: event completed
  Progress --> Error: event error
  Fetching --> Error: event error
  Completed --> [*]
  Error --> [*]
```

SSE: `GET /api/admin/ingestion-runs/{id}/events` streams `event: ingest` + JSON. Bus keeps ~500 events / 30 min in memory.

Manual admin source triggers create both an `IngestionRun` and a queued `IngestionJob`. `IngestionJobWorker` claims queued jobs, runs the matching RSS/scrape service, and marks the job completed/failed. Jobs left `Running` during process shutdown are requeued on startup rather than silently disappearing.

### Cron (Render)

Every 45 minutes (`render.yaml`):

- `newsfeed-rss-ingest` → `POST {INGEST_URL}/api/ingest/rss`
- `newsfeed-scrape-ingest` → `POST {INGEST_URL}/api/ingest/scrape`

Daily at midnight IST (`30 18 * * *` UTC):

- `newsfeed-daily-ingest-no-ai` → `POST {INGEST_URL}/api/ingest/daily`
- Runs all active RSS sources with Claude summarization disabled, then all active scrape sources.

All ingest crons send header `X-Ingest-Key: RssIngest__Secret`.

### Intelligence calls

Claude via `ArticleIntelligence__ApiKey`, `BaseUrl` (default `https://api.anthropic.com`), `Model` (default `claude-sonnet-4-5`):

| Pipeline | Claude | Stored `summary` | Stored `body` |
|----------|--------|------------------|---------------|
| **Scrape** | None | Extracted snippet (plain text) | `HtmlArticleExtractor.ExtractBody` (~50k chars, never raw HTML) |
| **RSS** | `SummarizeArticleAsync` (fallback to feed snippet on failure); disabled for `/api/ingest/daily` | Claude digest, or feed snippet in daily no-AI cron | Fetched HTML body when the link is reachable |
| **PDF** | `ExtractStoriesAsync` / image extract | Claude story summary | PdfPig plain text (shared across stories from that file) |

Translate still runs on read for headline/summary when `?lang=` differs from detected language. Body is not translated.

Existing rows without body: `POST /api/ingest/backfill-bodies?take=&afterId=` (ingest key).

## Key files

- `apps/api/Ingest/*`
- `apps/api/Endpoints/` ingest + admin ingestion/upload maps
- `render.yaml` (cron services)

## Public contracts

| Contract | Detail |
|----------|--------|
| `POST /api/ingest/rss` | `IngestRss` + ingest key |
| `POST /api/ingest/scrape` | `IngestScrape` + ingest key |
| `POST /api/ingest/daily` | `IngestDaily` + ingest key; RSS + scrape, no RSS summarization |
| `POST /api/ingest/backfill-bodies` | `IngestBackfillBodies` + ingest key |
| Admin trigger | `POST /api/admin/sources/{id}/trigger` → 202 + durable `IngestionJob` |
| SSE | `GET /api/admin/ingestion-runs/{id}/events` |
| Uploads | `POST /api/admin/uploads` multipart |
| Env | `RssIngest__Secret`, `INGEST_URL` (cron), `ArticleIntelligence__*`, `Upload__RootPath`, `IngestHealth__*` |

Event types: `started`, `fetch`, `progress`, `completed`, `error` (terminal: `completed` \| `error`).

## Failure modes & invariants

- Source site downtime must not break the public feed — log/fail the run, leave published content intact.
- Outbound fetch must not target private IPs (`SafeHttp`).
- RSS/scraped HTML is untrusted — store **plain text only**, never raw HTML; sanitize/validate before store and render (security rule).
- All article-producing ingest paths insert `PendingReview`; only admin publish moves articles into the public feed.
- `ErrorSummary` stores sanitized categories; full exception details stay in structured logs keyed by `IngestionRunId`.
- Ingest silence monitor logs or posts a webhook when active RSS/scrape sources have no successful run within the configured window.
- Ingest key ≠ admin JWT; do not conflate.

## Related docs

- [02-api](./02-api.md), [03-data-model](./03-data-model.md), [05-admin](./05-admin.md)
- Specs: `docs/superpowers/specs/2026-08-13-jhansi-rss-ingest-design.md`, `2026-08-13-pdf-and-city-scrape-ingest-design.md`, `2026-08-14-og-image-hotlink-enrichment-design.md`

## Change checklist

| When you change… | Update… |
|------------------|---------|
| Pipeline / insert status / intelligence provider | This page |
| Cron schedule or ingest paths | This page + [08-hosting-and-ci](./08-hosting-and-ci.md) |
| SSE / event schema | This page + [05-admin](./05-admin.md) + shared-types if DTOs change |
