---
name: khabro-security
description: Security review and hardening for Khabro: admin JWT, ingest key, rate limiting, CORS allowlist, secrets, untrusted scraped content, uploads.
---

# Khabro Security

Rules: [.codex/rules/security.mdc](../../../.codex/rules/security.mdc). Generic method: [security-and-hardening](../security-and-hardening/SKILL.md).

- Secrets only in platform settings (Render `sync: false`, GitHub/Cloudflare secrets); only `*.example` env files are committed.
- Admin: password >=12 chars and JWT key >=32 chars in prod, non-default. Admin and maintenance endpoints never exposed without auth.
- Ingest endpoints require `RssIngest__Secret` via `IngestKeyAuth`.
- Rate-limit public endpoints; CORS allowlist only (`Cors__AllowedOrigins__*`), never `AllowAnyOrigin`.
- RSS/scraped/PDF content is untrusted: sanitize before storage and render; never embed raw HTML. SSRF: outbound via `SafeHttp`.
- Uploads (`AdminUploadsEndpoints`, `Upload__*`): size/type limits, no path traversal.
- New endpoint checklist: validation + ProblemDetails, rate limit, no secrets in logs, OpenAPI documented, CORS unchanged.
