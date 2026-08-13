# Design: PDF drop + AI organize, and city-wise scrape ingest

- Status: Draft (awaiting user review)
- Date: 2026-08-13
- Related: `docs/PRD.md` (FR-1, FR-2, FR-9, content sourcing), `docs/adr/006-internal-admin-spa.md`, `docs/superpowers/specs/2026-08-13-admin-editorial-phase1-design.md`, `docs/superpowers/specs/2026-08-13-jhansi-rss-ingest-design.md`

## Goal

Give editors two new ways to fill the NewsFeed pipeline from the admin SPA:

1. **PDF / scan drop** — upload e-paper PDFs or clippings → OCR/extract → AI splits stories, city-tags, and writes short original summaries → **PendingReview**.
2. **City-wise web scrape** — allowlisted section/list pages for **Jhansi, Kanpur, Lucknow** → extract articles → AI short summary → **Published** immediately (with audit + archive escape hatch).

Both pipelines reuse the existing `Source` / `IngestionRun` / article / review spine. RSS remains unchanged.

## Non-goals (v1)

- Separate ingest worker microservice
- Agra scrape (Agra remains a seeded city; PDF city hint may still use any seeded city including Agra; scrape seeds are three cities only)
- Neighborhood / ward-level tagging
- Auto-publish from PDF
- Headless browser / heavy JS site automation
- Paywalled content
- Unlimited “scrape the whole web”
- Virus scanning of uploads (defer)
- Object storage migration (local/disk or simple blob path is fine for v1; S3-compatible later)

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Approach | Shared ingest hub inside `apps/api` (Approach 1) |
| Cities (scrape v1) | Jhansi, Kanpur, Lucknow |
| Languages | Hindi and English |
| PDF inputs | Mix: full e-papers + occasional clippings/images |
| Scrape sources | Seed Amar Ujala / Dainik Jagran–style city sections + Google News–style city search; admin can add more later |
| AI stack | Pragmatic: extract embedded PDF text when present; vision/OCR LLM when pages are image-only; one `IArticleIntelligence` interface |
| PDF publish gate | Always `PendingReview` |
| Scrape publish gate | Auto-`Published`; admin can Archive a bad item |
| Architecture | No new deployable; background jobs hosted in API |
| Public content | Short original summary + attribution + link (scrape) or edition attribution (PDF) — never full verbatim dump in reader feed |

## Architecture

```
Admin SPA
  ├─ Drop PDF ──────────────► Upload API ──► PdfIngestJob
  │                                            ├─ extract text / OCR
  │                                            ├─ AI: split + city + summary
  │                                            └─ Article Status = PendingReview
  │
  └─ Scrape sources (CRUD) ─► ScrapeIngestJob (cron / Run now)
                               ├─ fetch city list + article pages
                               ├─ AI: short original summary
                               └─ Article Status = Published

Shared: City · Source · IngestionRun · Review queue · Dedup
```

- API remains the only process talking to Postgres.
- AI provider keys live in env/secrets only.
- Files stored on disk (or configured blob path) in v1; `DocumentUpload` row holds metadata and status.

## Data model

### Extend `SourceType`

Add `PdfUpload`, `Scrape` (keep `Rss`, `Manual`).

### `Source`

- **Scrape:** `FeedUrl` = list/section URL; optional `ScrapeConfig` JSON (selectors, language hints, max items). `CityId` required for v1 city-edition scrapes.
- **PDF:** one logical inbox source (global or per-city) used for attribution on generated articles; uploads are not required to map 1:1 to a publisher feed URL.

### New `DocumentUpload`

| Field | Notes |
|-------|--------|
| Id, OriginalFileName, StoredPath, ContentType, ByteSize | File metadata |
| CityHintId? | Optional editor hint (Jhansi / Kanpur / Lucknow / null = detect) |
| Status | `Queued`, `Processing`, `Ready`, `Failed` |
| ErrorSummary? | Human-readable failure |
| IngestionRunId? | Audit link |
| CreatedAt, ProcessedAt? | Timestamps |

### `Article`

Existing fields. Add optional `DocumentUploadId` for PDF-origin rows.

- PDF-origin → `PendingReview`
- Scrape-origin → `Published`, `IsMock = false`
- Dedup: scrape by unique `source_url`; PDF by stable hash of (upload id + normalized headline + city) when no URL exists — store that hash in `SourceUrl` as a synthetic `pdf://…` or dedicated unique column if preferred during implementation (pick one; do not allow null-URL duplicates)

### `IngestionRun`

Reuse for RSS, PDF, and scrape (counts + error summary).

### Place matching

Generalize `PlaceNameMatcher` beyond Jhansi-only: per-city place lists for Jhansi, Kanpur, Lucknow (EN + HI). Used when city must be detected (PDF without hint; future wider scrapes).

## Components

| Component | Responsibility |
|-----------|----------------|
| `PdfIngestService` | Accept upload, persist file, create `DocumentUpload` + run, enqueue work |
| `PdfExtractionService` | Text-layer extract; else page images → OCR/vision |
| `ScrapeIngestService` | List fetch → article URLs → extract title/date/snippet body (capped) |
| `IArticleIntelligence` | Split multi-story text; city-tag; write short original HI/EN summary; category guess; drop obvious ads |
| Admin **Uploads** page | Drag-drop, city hint, job status, jump to review |
| Admin **Sources** | Add/edit scrape sources, seed three cities, Run now |
| Review queue / Logs | Existing roles; no redesign required |

## PDF + AI flow

1. Editor opens Uploads, drops PDF or image pages, optional city hint (any seeded city, or detect).
2. API stores file → `DocumentUpload` (`Queued`) + `IngestionRun`.
3. Background processing (in-API; HTTP returns quickly):
   - Prefer embedded text.
   - Image-only pages → OCR/vision.
   - Hindi + English.
4. Intelligence layer splits stories; per story: headline, 2–4 line original summary, category, suggested city, language, confidence; drop junk when obvious.
5. Insert as `PendingReview`, linked to upload.
6. Upload → `Ready` or `Failed` (surface error on Uploads + logs).
7. Editor reviews via existing queue: edit → Approve / Reject.

**Limits (v1):** ~25MB/file, ~40 pages, one active PDF job per API instance (serialize or small queue).

## Scrape flow (Jhansi, Kanpur, Lucknow)

1. Seed active `Scrape` sources: city section pages (Amar Ujala / Jagran-style) + Google News–style city search where useful.
2. Admin may add sources later: name, city, list URL, language, optional selectors.
3. Trigger: Render/cron (~45 min, same pattern as RSS) + admin Run now.
4. Per source run:
   - Fetch list → collect up to N article links (e.g. 20).
   - Skip known `source_url`.
   - Fetch article → sanitize/extract title, date, lead text (length-capped).
   - AI writes short original summary; keep `CityId` from source for city-edition sources.
   - Insert `Published` with `SourceName` + live `SourceUrl`.
5. Resilience: timeouts, polite delay, clear User-Agent; one URL failure does not abort the run; zero links found → failed run with clear message.
6. Safety: admin can Archive bad auto-publishes (remove from public feed); rate-limit; never put raw HTML in reader.

## Errors

- PDF corrupt / oversize / OCR fail → `DocumentUpload.Failed` + reason; no silent partial success without log.
- AI timeout / malformed response → one retry, then fail upload (or skip that story mid-batch and continue — prefer continue-with-skip when some stories already parsed).
- Scrape per-URL failures increment failed count; other URLs proceed.
- Layout change → zero links = failed run, not empty success.

## Security

- New admin endpoints: existing admin JWT.
- Upload allowlist: PDF + common images; size/page caps.
- Scrape HTTP client: SSRF guard (block localhost/private/link-local), timeouts, rate limits.
- AI keys only in secrets; never log prompts that include full newspaper dumps at debug in production if avoidable — prefer truncated logs.
- CORS allowlist-only; sanitize all extracted HTML before persist/use.
- Legal posture (PRD): short original summaries + attribution + link; no full-text republication in the public feed.

## Ship order

1. **Phase A** — PDF upload + AI organize → PendingReview + Uploads UI  
2. **Phase B** — Scrape seed + Run now for three cities + auto-publish  
3. **Phase C** — Cron for scrape + admin “add scrape source” polish  

## Testing

- Unit: extractors, per-city place matcher, AI JSON parsing, SSRF URL rejection.
- Integration: upload fixture PDF/text → PendingReview articles; scrape fixture HTML → Published + dedup on second run.
- Admin smoke: drop appears in Uploads + Review; Run now creates city-tagged articles.
- CI must not hit live publisher sites (HTML/PDF fixtures only).

## Open implementation choices (non-blocking)

Resolve during Phase A plan without changing product behavior:

- Concrete LLM provider behind `IArticleIntelligence` (Gemini vs OpenAI vs Azure) — pick by Hindi OCR quality + cost.
- Whether PDF dedup uses synthetic `SourceUrl` or a new unique column.
- Exact disk vs ephemeral volume path on Render for uploads.
