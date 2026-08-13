# Design: Jhansi live RSS ingest (manual fetch-now)

- Status: Approved
- Date: 2026-08-13
- Related: `docs/PRD.md` (FR-1 ingest, content sourcing notes), `docs/adr/002-no-auth-mvp.md`

## Goal

Replace mock Jhansi stories with a live, city-tagged newspaper feed ingested from **allowlisted public RSS** of authentic publishers. Hindi and English items share one Jhansi feed. A person triggers ingest; there is no timer in this slice.

Readers already have city selection, feed, article detail, and WhatsApp share. This slice fills Jhansi with real items behind that UI.

## Non-goals

- HTML scraping of publisher pages
- LLM / original rewritten summaries
- Editorial review queue or admin UI
- Scheduled / cron polling (add after Jhansi is proven)
- Live ingest for Agra, Kanpur, or Lucknow
- Publisher partnerships or full-text syndication
- Auth, push notifications, or a second client

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| First city | Jhansi only |
| Languages | Hindi and English in the same feed |
| Trigger | Manual fetch-now; timer later |
| Public feed | Live immediately (no review queue) |
| Card body | RSS description as snippet (HTML stripped, length-capped) |
| Source policy | Allowlisted RSS only; never scrape HTML as fallback |
| Wider feeds | Keep item if it mentions a Jhansi-edition place name |
| Other cities | Stay on existing `[MOCK]` seed articles |
| Jhansi mocks | Hidden once ingested items are the Jhansi source of truth |

## Reader experience

A user who selects Jhansi sees newest-first cards: headline, source name, published time, snippet, optional image if the feed provided a valid `http(s)` image URL, and “Read full story” to the publisher. No login.

Agra / Kanpur / Lucknow are unchanged (mock). Jhansi does not mix `[MOCK]` rows with real RSS items.

Until at least one ingested Jhansi article exists, the Jhansi feed may still show `[MOCK]` seed rows so the city is not empty on first deploy. As soon as any ingested Jhansi article exists, `[MOCK]` Jhansi rows are omitted. The public feed must not error because the last ingest failed.

## Sources

Ingest only URLs on a small allowlist: publisher display name, feed URL, language, and whether the feed is a **city edition** or a **wider** feed.

During implementation, verify which public RSS URLs actually work (typical candidates: Jagran, Amar Ujala, Hindustan city/Bundelkhand editions, plus 1–2 English feeds that cover Jhansi). Drop feeds that 404, require login, or are not RSS. Do not scrape the website instead.

### Matching

- **City-edition Jhansi feed:** store every well-formed item as Jhansi.
- **Wider UP / national / Bundelkhand feed:** store the item only if title or snippet mentions any of: Jhansi / झांसी, Orchha / ओरछा, Lalitpur / ललितपुर, Datia / दतिया, Babina / बबीना.

Do not keep generic Bundelkhand or UP stories (e.g. Banda, Sagar) just because they are “the region.”

## Fetch-now behavior

Someone with the ingest secret triggers one run via `POST` on a dedicated ingest route, authenticated by a shared secret header (env-configured, not in git). Not a button in the reader app. No-auth MVP still forbids an unprotected admin endpoint. Local/dev is the same route against a running API (e.g. curl).

Each run:

1. Fetch every allowlisted feed independently.
2. Parse RSS/Atom items.
3. Strip HTML and decode entities from title and description; collapse whitespace; cap snippet to fit the existing summary column (max 1000 chars; target a short card, well under that).
4. Skip items with empty title, invalid/missing article URL, or (for wider feeds) no place-name match.
5. Skip items whose canonical source URL is already stored (idempotent; re-running fetch-now must not duplicate).
6. Insert the rest as live Jhansi articles: headline from RSS title; snippet from description (if description is empty after strip, use a one-line fallback: tap to read the full story on {source}); source name from the allowlist; `SourceUrl` = article link; `PublishedAt` from the feed or ingest time if missing; category **Local** unless the feed category obviously maps to an existing app category (State, National, Business, Health, Sports); `ImageUrl` only when the feed gives a valid `http(s)` image.

RSS is untrusted input: never persist or render raw HTML from the feed.

## Failures

- One dead or malformed feed is logged and skipped; other feeds in the same run still ingest.
- Fetch-now without the ingest secret is rejected.
- Overlong or invalid fields are dropped, not stored half-broken.
- Public `GET /api/articles?city=jhansi` remains a read of stored rows (plus the mock-hiding rule). Ingest failure does not 5xx the feed.

## Data / API impact

Reuse the existing `Article` shape (headline, summary, source name/url, published at, category, image, city). No reader-facing contract change required for the Expo app if ingested rows look like current articles.

Ingest secret lives in environment config (not git), same as other secrets.

Seed `[MOCK]` Jhansi rows are omitted from `GET /api/articles?city=jhansi` once any ingested Jhansi article exists. Other cities keep seed data.

## Tests

Behavior to lock in:

- Duplicate source URL is not inserted on a second fetch-now.
- Wider-feed item mentioning only Lucknow is not stored as Jhansi; item mentioning Orchha is.
- Snippet stored for a description containing tags has no HTML.
- Two-feed run: a failing feed does not prevent inserts from the healthy feed.
- Missing ingest secret is denied.
- Before any ingested Jhansi row exists, `GET /api/articles?city=jhansi` still returns `[MOCK]` seed items.
- After ingest, `GET /api/articles?city=jhansi` returns real items newest-first with source URL; `[MOCK]` Jhansi headlines are absent.
- `GET /api/articles?city=lucknow` still returns mock Lucknow items.

## Follow-up (not this slice)

Timer/cron polling; copy the allowlist pattern to Agra, Kanpur, Lucknow; original summaries + review queue; HTML scrape only after a partnership conversation for sources with no RSS.
