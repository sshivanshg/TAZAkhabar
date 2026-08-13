# Design: OG image hotlink enrichment

- Status: Approved
- Date: 2026-08-14
- Related: `docs/PRD.md` (feed cards), `docs/superpowers/specs/2026-08-13-jhansi-rss-ingest-design.md`, ingest queue pattern in `PdfProcessingQueue` / `PdfProcessingWorker`

## Goal

Fill missing article thumbnails by extracting `og:image` (fallback `twitter:image`) from each article’s `SourceUrl` and storing that remote URL in `Article.ImageUrl`. Zero blob storage — the reader hotlinks the publisher CDN. Enrichment runs as a separate background pass after ingest inserts, not inline.

## Non-goals

- Backfill of existing articles that already have null `ImageUrl`
- Downloading, resizing, or hosting images (R2/S3/CDN proxy)
- Manual admin “enrich images” action
- Retry / multi-attempt policy after a failed attempt
- Reader UI changes (existing cards already use `ImageUrl`)
- OpenAPI / `shared-types` changes (attempt marker stays internal)
- Overwriting an image already set by RSS enclosure or scrape

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Strategy | Hotlink remote URL into `ImageUrl` |
| When | Separate later pass (not during HTML/RSS parse inline) |
| Trigger | Auto-enqueue after each eligible insert (RSS, scrape, PDF) |
| Scope | New articles only; no historical backfill |
| Sources | RSS + scrape + PDF rows with null `ImageUrl` and http(s) `SourceUrl` |
| Failure | One attempt; leave `ImageUrl` null forever for that row |
| Queue | In-process `Channel<int>` + `BackgroundService` (mirror PDF worker) |
| Tried marker | `ImageEnrichmentAttemptedAt` (`DateTimeOffset?`) on `Article` |
| Meta tags | `og:image` wins; else `twitter:image` |
| Restart | Capped startup sweep of eligible rows (newest first, e.g. 50) |

## Accepted risk

Hotlinking publisher images is fragile (URLs expire, sites block hotlinking) and legally murkier than RSS snippet text. Accepted for MVP cost/speed; a later proxy/cache slice can replace this without changing the reader contract (`ImageUrl` stays a URL string).

## Architecture

```
Ingest (RSS / scrape / PDF)
  → insert article
  → if ImageUrl is null AND SourceUrl is http(s)
       AND ImageEnrichmentAttemptedAt is null
       → enqueue article Id

ImageEnrichmentWorker (BackgroundService, serial)
  → dequeue Id
  → GET SourceUrl (SafeHttp + dedicated HttpClient)
  → parse og:image, else twitter:image
  → normalize http(s) URL (same rules as RSS NormalizeImageUrl)
  → success: set ImageUrl + ImageEnrichmentAttemptedAt
  → fail / missing: set ImageEnrichmentAttemptedAt only
```

### Components

| Piece | Role |
|-------|------|
| `ImageEnrichmentQueue` | Unbounded `Channel<int>` of article IDs |
| `ImageEnrichmentWorker` | `BackgroundService`; scoped service per item |
| `ArticleImageEnrichmentService` | Fetch, parse, update row |
| HTML meta extractor | Lightweight `meta` property/name parse; resolve relative URLs against page URL |
| HttpClient `"image-enrichment"` | ~10–15s timeout, ~1–2MB HTML size cap, browser-ish User-Agent |

### Eligibility

An article is eligible when **all** are true:

1. `ImageUrl` is null
2. `ImageEnrichmentAttemptedAt` is null
3. `SourceUrl` starts with `http://` or `https://`
4. `SourceUrl` passes `SafeHttp.TryValidatePublicAbsoluteUri` (SSRF guard)

PDF-derived rows often fail quietly (no HTML page / no OG tags); that is expected.

### Enqueue points

After a **successful insert** in RSS, scrape, and PDF ingest paths, if the new row is eligible, enqueue its Id. No new public/admin HTTP endpoint for MVP.

### Startup sweep

On API start, enqueue up to **N** eligible articles (default **50**, newest `IngestedAt` / `Id` first) so in-memory queue loss across deploys does not strand unfinished rows created **after** this feature shipped. Combined with the migration seed below, this is not a historical backfill.

## Data model

Add nullable column on `articles`:

- `image_enrichment_attempted_at` → `Article.ImageEnrichmentAttemptedAt` (`DateTimeOffset?`)

EF migration under `infra/migrations/`. Field is not exposed on public/admin article DTOs.

**Migration seed (no backfill):** set `ImageEnrichmentAttemptedAt = UtcNow` for every **existing** article row so pre-feature articles are ineligible. New inserts leave the column null until the worker runs.

## Failure modes

| Case | Behavior |
|------|----------|
| Timeout / non-2xx / SSRF-blocked URL | Set attempt timestamp; leave `ImageUrl` null |
| No og/twitter image meta | Same |
| Extracted URL not http(s) / fails normalize | Same |
| Article deleted before worker runs | No-op |
| `ImageUrl` already set when worker runs | Set attempt timestamp if unset; do not overwrite `ImageUrl` |
| Queue item lost on process kill | Startup sweep re-enqueues eligible rows (capped) |

Concurrency: updates are conditional on `ImageUrl == null` so enclosure/scrape images are never clobbered.

## Safety

- Fetch article HTML through existing `SafeHttp` validation
- Do **not** download image bytes — persist URL only
- Process queue **serially** (same cadence style as PDF worker)
- Cap HTML body size; discard oversized responses as failure
- Rate impact limited by serial worker + startup cap

## Testing

- Unit: meta parser — `og:image` preferred; `twitter:image` fallback; relative → absolute; missing → null
- Unit/service: success sets `ImageUrl` + timestamp; failure sets timestamp only; skips overwrite when `ImageUrl` present
- Integration optional: enqueue after insert path smoke (if cheap with existing WebApplicationFactory patterns)

No Playwright / reader E2E required for this slice.

## Success criteria

1. Newly ingested articles without enclosure/scrape images often gain thumbnails within seconds of insert (when the publisher page exposes OG tags).
2. Failed enrichments do not retry forever or hammer publishers.
3. No new object storage or CDN dependency.
4. Reader and OpenAPI contracts unchanged aside from more non-null `ImageUrl` values in practice.

## Implementation next step

After user review of this spec: invoke writing-plans and produce an implementation plan under `docs/superpowers/plans/`.
