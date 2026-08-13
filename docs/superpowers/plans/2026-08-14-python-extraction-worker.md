# Python Extraction Worker Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox syntax.

**Goal:** Ship Python multi-tier extraction worker + .NET `POST /api/ingest/articles` handoff with admin Run now wired to the worker.

**Architecture:** Python extracts; .NET validates, dedupes, Claude-summarizes, persists `Article` + `ArticleContent`. Admin scrape trigger awaits worker `POST /run`.

**Tech Stack:** .NET 8, EF Core, aiohttp/FastAPI or stdlib HTTP, newspaper4k, BeautifulSoup, trafilatura, Playwright, xUnit, pytest

## Global Constraints

- API sole DB owner; Python never gets connection string
- `X-Ingest-Key` for worker↔API
- Max 20 articles per ingest batch
- Hard cutover: no .NET HTML scrape; `/ingest/scrape` → 410
- v1: seeded scrape sources only; no cron
- Migrations only under `infra/migrations/`

### Task 1: ArticleContent + migration + ingest DTOs/service

### Task 2: Ingest endpoints (sources GET, articles POST, scrape 410) + admin trigger → worker

### Task 3: API tests

### Task 4: Python package (utils, extractors, pipeline, api_client, server, CLI)

### Task 5: Python unit tests + README + .env.example

### Task 6: Verify build/tests; commit + PR
