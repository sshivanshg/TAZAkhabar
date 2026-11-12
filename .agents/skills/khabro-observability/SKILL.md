---
name: khabro-observability
description: Logging, health and alerting for Khabro: Serilog, /healthz, ingest silence monitor and webhook, GitHub Actions ingest runs, Render logs.
---

# Khabro Observability

- API logs: Serilog structured logging (no `Console.WriteLine`), visible in Render logs for `tazakhabar-api`. Log ids, routes, source ids, exception types; never secrets or article bodies.
- Health: `GET /healthz` (Render health check).
- Ingest health: `IngestSilenceMonitor` alerts via `IngestHealth__AlertWebhookUrl` when no ingest within `IngestHealth__MaxSilenceMinutes` (180).
- Scheduler evidence: `gh run list --workflow scheduled-ingest.yml` / `nightly-ingest.yml` / `purge-old-articles.yml`.
- Admin live view shows ingest run events (SSE).
- No Sentry or APM is wired today; do not claim error tracking exists.
