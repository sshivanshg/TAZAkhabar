---
name: khabro-ingestion
description: Work on Khabro news ingestion: RSS, HTML scrape, PDF/image upload, Claude intelligence, OpenAI rewrite, image enrichment, scheduled/nightly ingest, purge, SSE run events and source catalogs.
---

# Khabro Ingestion

Source: [docs/architecture/04-ingestion.md](../../../docs/architecture/04-ingestion.md).

## Pieces (`apps/api/Ingest/`)
- RSS: `RssFeedClient`, `RssFeedParser`, `RssIngestService`. Scrape: `ScrapeHttpClient`, `HtmlArticleExtractor`, `ScrapeIngestService`. PDF: `PdfIngestService`, `PdfProcessingQueue/Worker`, `PdfTextExtractor`.
- Enrichment: `ClaudeArticleIntelligence` (`ArticleIntelligence__*`), `OpenAiArticleRewriter` (`OpenAiRewrite__*`), `ArticleImageEnrichmentService` + `ImageEnrichmentQueue/Worker`, `ArticleLanguageDetector`, `PlaceNameMatcher`.
- Scheduling: `ScheduledIngestHostedService` (`IngestSchedule__*`), GitHub Actions `scheduled-ingest.yml` (15 min, wakes free Render), `nightly-ingest.yml`, `purge-old-articles.yml`. Health: `IngestSilenceMonitor` (`IngestHealth__*`).
- Events: `IngestionEventBus` -> SSE for the admin live view.
- Source catalogs: `Data/LocalPublisherSourceCatalog.cs`, `Data/NationalPublisherSourceCatalog.cs`, seed migrations.

## Rules
- Scraped/RSS content is untrusted: sanitize (`HtmlText`), never store raw HTML, never render raw HTML in the reader.
- Public output stays headline + short summary + attribution + link to source.
- All outbound fetches via `SafeHttp` with timeouts; classify failures with `IngestErrorClassifier`.
- Ingest endpoints are protected by `IngestKeyAuth`; never log the key.
- Test with fakes (`FakeRssFeedClient`, `FakeScrapeHttpClient`, `FakeArticleIntelligence`, `FakeArticleRewriter`) and fixtures in `apps/api.Tests/Fixtures`.
- Update `04-ingestion.md` in the same change.
