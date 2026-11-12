---
name: khabro-design-principles
description: Design rules for keeping Khabro a small modular monolith: dependency direction, where code belongs (endpoint, service, policy, adapter), reuse. Read before adding an endpoint, service, ingest adapter, API client method or screen.
---

# Khabro Design Principles

Canonical source: [docs/architecture/11-design-principles.md](../../../docs/architecture/11-design-principles.md) and [.codex/rules/backend-conventions.mdc](../../../.codex/rules/backend-conventions.mdc).

- One deployable API; single project `apps/api` + `apps/api.Tests`. No Clean Architecture layers until pain is real.
- Endpoints (`apps/api/Endpoints/*Endpoints.cs`) stay thin: validate, call a service, map to DTO (`apps/api/Dtos`). Decisions live in `apps/api/Services` or `apps/api/Ingest`.
- External I/O behind interfaces (`IRssFeedClient`, `IScrapeHttpClient`, `IArticleIntelligence`, `IArticleRewriter`, `IArticleImageHtmlClient`) so tests use the fakes in `apps/api.Tests`.
- Outbound HTTP through `SafeHttp`; slow work through queues/workers (`PdfProcessingQueue`, `ImageEnrichmentQueue`, `NotificationDispatchQueue`), not the request path.
- Reuse before adding: `ArticleResponseMapper`, `ArticleVisibility`, `FeedCityScope`, `AdminValidation`, `IngestErrorClassifier`.
- Reader: no inline `fetch` in screens; HTTP via `apps/app/src/api/`. Admin: HTTP via `apps/admin/src/api.ts`.
- Bounded queries (paging, retention window `ArticleRetention`), async all the way, no `.Result`/`.Wait()`.
