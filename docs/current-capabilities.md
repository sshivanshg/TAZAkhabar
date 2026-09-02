# Current Capabilities

> Canonical product capability inventory for TazaKhabar.  
> Update this file in the same change whenever a user-facing feature, source rule, update cadence, or shipped surface changes.  
> If a change touches architecture, also update the matching page in `docs/architecture/` and bump its `Last verified against` date.

## App message

TazaKhabar is ready for pilot use. Readers can pick a city, browse fresh local news, open stories in the swipe reader, share to WhatsApp, and opt into breaking-news alerts. News is sourced from official RSS feeds, city pages when RSS is missing, Google News discovery feeds, and manual editorial uploads. Stories are kept short, attributed, and linked back to the original source.

## What is built

### Reader

- City selection with searchable manual pick.
- Optional foreground location on supported devices to match the nearest city on-device.
- Personalized home feed with newest-first article cards and city-aware ranking.
- Article detail view with continuous swipe-style reading.
- WhatsApp sharing and system share support.
- Trending and category browsing.
- Readability-focused layout with large text and simple navigation.
- Optional push notification opt-in.
- Web/PWA install flow for mobile browsers.
- Desktop-friendly reader layout.

### Ingestion

- RSS ingestion for publisher feeds.
- Scrape ingestion for city pages and sources without RSS.
- Google News discovery feeds to widen city coverage.
- PDF and image-based story extraction.
- OpenAI rewrite flow for scraped content when enabled.
- Claude-powered summarization/extraction for RSS and PDF flows.
- Source attribution and original-link preservation.
- Safety checks that avoid storing raw HTML.

### Admin

- Password-protected editorial login.
- Review queue for articles.
- Article create, edit, publish, reject, and archive actions.
- Source management and manual trigger runs.
- Uploads for PDF/image-based ingest.
- Live ingest event stream and run status view.

### Platform

- Public API with no reader auth for MVP.
- OpenAPI-backed shared types.
- Background notification dispatch for web and native.
- Cloudflare Pages delivery for the reader, admin, and public site.

## News sources

Current sources are layered so the feed can stay full even when a local publisher is thin or down:

1. Official RSS feeds from local and city editions.
2. Official city pages scraped into plain text when RSS is unavailable or incomplete.
3. Google News city discovery feeds to broaden coverage.
4. National publisher discovery feeds for broader breaking-news coverage.
5. Manual editorial uploads for PDF or scanned material.

## Update cadence

- Baseline RSS runs are scheduled every 15 minutes.
- Scrape and broader ingest jobs run multiple times per hour, with 45-minute scheduled batches in the current atlas.
- A nightly batch runs at `00:00 IST`.
- Feed reads are cached at the edge for short periods, so the public app may briefly show slightly stale data even while fresh ingest is running.

## News rules

- Always show source attribution and a link back to the original article.
- Keep public summaries short and readable.
- RSS and PDF content are digest-first and may go through editorial review.
- Scraped content is rewritten into an original digest when possible.
- Never store or render raw HTML from sources.
- If a source is unavailable or breaks, the feed should degrade gracefully instead of failing outright.
- Public readers do not need accounts.

## Maintenance contract for agents

When anything changes, update the doc that owns that behavior:

- Reader UI or flow changes -> update this file and `docs/architecture/06-reader-app.md`.
- Ingestion, source strategy, or cadence changes -> update this file and `docs/architecture/04-ingestion.md`.
- Admin workflow changes -> update this file and `docs/architecture/05-admin.md`.
- API or shared contract changes -> update this file and the matching atlas pages plus `docs/architecture/07-shared-types.md` when needed.
- Hosting or deployment changes -> update this file and `docs/architecture/08-hosting-and-ci.md`.

## Short version

If you need a one-line status update for the app:

> TazaKhabar is pilot-ready: city selection, fresh local news, swipe reading, WhatsApp sharing, optional alerts, and editor-controlled ingestion are already built.
