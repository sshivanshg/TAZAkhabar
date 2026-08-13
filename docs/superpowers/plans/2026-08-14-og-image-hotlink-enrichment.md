# OG Image Hotlink Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After ingest inserts an article without `ImageUrl`, a background worker fetches `SourceUrl`, extracts `og:image` / `twitter:image`, and hotlinks that URL into `Article.ImageUrl`.

**Architecture:** Mirror `PdfProcessingQueue` / `PdfProcessingWorker`. Ingest paths enqueue eligible article IDs. `ArticleImageEnrichmentService` fetches HTML via `SafeHttp` + dedicated HttpClient, parses meta tags, updates the row once. `ImageEnrichmentAttemptedAt` prevents retries. Migration seeds existing rows so history is not backfilled.

**Tech Stack:** .NET 8, EF Core + Npgsql, `IHttpClientFactory`, `System.Threading.Channels`, xUnit, AngleSharp or lightweight string/`XDocument` HTML meta parse (prefer no new package if regex/`HtmlAgilityPack` absent — use simple meta regex or existing HTML helpers).

**Spec:** `docs/superpowers/specs/2026-08-14-og-image-hotlink-enrichment-design.md`

## Global Constraints

- Hotlink only — never download or store image bytes.
- One attempt per article; set `ImageEnrichmentAttemptedAt` on success or failure.
- Do not overwrite non-null `ImageUrl`.
- No OpenAPI / shared-types / reader UI changes.
- No admin enrich endpoint.
- No historical backfill: migration sets `ImageEnrichmentAttemptedAt` on all existing rows.
- SSRF: `SafeHttp.TryValidatePublicAbsoluteUri` before fetch.
- Serial worker; startup sweep capped at 50, newest first, non-mock only.
- PDF `pdf://` URLs are ineligible (not http/https) — expected.
- Conventional Commits; no commit to `main` without branch.

---

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/Data/Entities/Article.cs` | Add `ImageEnrichmentAttemptedAt` |
| `apps/api/Data/AppDbContext.cs` | Map column |
| `apps/api/Data/SeedData.cs` | Set attempted_at on mock seeds |
| `infra/migrations/*ImageEnrichmentAttemptedAt*` | Column + UPDATE existing rows |
| `apps/api/Ingest/OgImageExtractor.cs` | Parse og/twitter image from HTML |
| `apps/api/Ingest/ImageEnrichmentQueue.cs` | `Channel<int>` |
| `apps/api/Ingest/ImageEnrichmentWorker.cs` | BackgroundService |
| `apps/api/Ingest/ArticleImageEnrichmentService.cs` | Fetch + update + startup sweep |
| `apps/api/Ingest/IArticleImageHtmlClient.cs` + impl | Bounded HTML GET |
| `apps/api/Program.cs` | DI + HttpClient registration |
| `apps/api/Ingest/RssIngestService.cs` | Enqueue after insert if eligible |
| `apps/api/Ingest/ScrapeIngestService.cs` | Same |
| `apps/api/Ingest/PdfIngestService.cs` | Same (usually no-op for `pdf://`) |
| `apps/api.Tests/OgImageExtractorTests.cs` | Parser unit tests |
| `apps/api.Tests/ArticleImageEnrichmentServiceTests.cs` | Success / fail / no-overwrite |

---

### Task 1: OG / Twitter image meta extractor

**Files:**
- Create: `apps/api/Ingest/OgImageExtractor.cs`
- Test: `apps/api.Tests/OgImageExtractorTests.cs`

**Interfaces:**
- Produces: `OgImageExtractor.TryExtract(string html, Uri pageUrl) -> string?`

- [ ] **Step 1: Write failing tests**

```csharp
public sealed class OgImageExtractorTests
{
    [Fact]
    public void Prefers_og_image_over_twitter()
    {
        var html = """
            <html><head>
            <meta property="og:image" content="https://cdn.example/a.jpg" />
            <meta name="twitter:image" content="https://cdn.example/b.jpg" />
            </head></html>
            """;
        Assert.Equal(
            "https://cdn.example/a.jpg",
            OgImageExtractor.TryExtract(html, new Uri("https://news.example/story")));
    }

    [Fact]
    public void Falls_back_to_twitter_image()
    {
        var html = """
            <html><head>
            <meta name="twitter:image" content="https://cdn.example/b.jpg" />
            </head></html>
            """;
        Assert.Equal(
            "https://cdn.example/b.jpg",
            OgImageExtractor.TryExtract(html, new Uri("https://news.example/story")));
    }

    [Fact]
    public void Resolves_relative_og_image()
    {
        var html = """<meta property="og:image" content="/img/x.jpg" />""";
        Assert.Equal(
            "https://news.example/img/x.jpg",
            OgImageExtractor.TryExtract(html, new Uri("https://news.example/story/1")));
    }

    [Fact]
    public void Returns_null_when_missing()
    {
        Assert.Null(OgImageExtractor.TryExtract("<html></html>", new Uri("https://news.example/")));
    }
}
```

- [ ] **Step 2: Run tests — expect fail (type missing)**

```bash
dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter OgImageExtractorTests
```

- [ ] **Step 3: Implement extractor**

Use case-insensitive regex for `property`/`name` + `content` (both attribute orders). Prefer first `og:image`, else first `twitter:image`. Resolve relative with `new Uri(pageUrl, content)`. Reject non-http(s) after resolve. Truncate to 500.

- [ ] **Step 4: Run tests — expect pass**

- [ ] **Step 5: Commit** `feat: parse og and twitter image meta tags`

---

### Task 2: Schema — `ImageEnrichmentAttemptedAt`

**Files:**
- Modify: `apps/api/Data/Entities/Article.cs`
- Modify: `apps/api/Data/AppDbContext.cs`
- Modify: `apps/api/Data/SeedData.cs` (set `ImageEnrichmentAttemptedAt` on all mock seeds)
- Create: migration via `dotnet ef`

- [ ] **Step 1: Add property**

```csharp
public DateTimeOffset? ImageEnrichmentAttemptedAt { get; set; }
```

Map: `.HasColumnName("image_enrichment_attempted_at")`

In `SeedData.Add`, set `ImageEnrichmentAttemptedAt = baseTime` (or `UtcNow` fixed) so mocks are never eligible.

- [ ] **Step 2: Add migration**

```bash
dotnet ef migrations add AddImageEnrichmentAttemptedAt \
  --project apps/api/NewsFeed.Api.csproj \
  --output-dir ../../infra/migrations \
  --context AppDbContext
```

- [ ] **Step 3: Edit migration `Up`** to after `AddColumn`:

```csharp
migrationBuilder.Sql(
    """
    UPDATE articles
    SET image_enrichment_attempted_at = TIMESTAMPTZ '2026-08-14 00:00:00+00'
    WHERE image_enrichment_attempted_at IS NULL;
    """);
```

Down: drop column only (or clear then drop).

- [ ] **Step 4: Commit** `feat: add image enrichment attempted_at column`

---

### Task 3: Queue, HTTP client, enrichment service, worker

**Files:**
- Create: `apps/api/Ingest/ImageEnrichmentQueue.cs`
- Create: `apps/api/Ingest/IArticleImageHtmlClient.cs`
- Create: `apps/api/Ingest/ArticleImageHtmlClient.cs`
- Create: `apps/api/Ingest/ArticleImageEnrichmentService.cs`
- Create: `apps/api/Ingest/ImageEnrichmentWorker.cs`
- Modify: `apps/api/Program.cs`
- Test: `apps/api.Tests/ArticleImageEnrichmentServiceTests.cs`
- Test helper: fake `IArticleImageHtmlClient`

**Interfaces:**
- `ImageEnrichmentQueue.EnqueueAsync(int articleId, CancellationToken ct)`
- `IArticleImageHtmlClient.GetHtmlAsync(Uri uri, CancellationToken ct) -> Task<string?>` (null on failure)
- `ArticleImageEnrichmentService.EnrichAsync(int articleId, CancellationToken ct)`
- `ArticleImageEnrichmentService.EnqueueEligibleStartupAsync(CancellationToken ct)` — max 50

Eligibility helper (shared static or service method):

```csharp
public static bool IsEligible(Article a) =>
    a.ImageUrl is null
    && a.ImageEnrichmentAttemptedAt is null
    && !a.IsMock
    && SafeHttp.TryValidatePublicAbsoluteUri(a.SourceUrl, out _, out _);
```

HTML client: HttpClient name `"image-enrichment"`, 15s timeout, User-Agent `NewsFeedIngest/0.1`, `AllowAutoRedirect = false` (or follow limited — match scrape), max 2MB: if `ContentLength > 2MB` or read exceeds, return null. Use `SafeHttp` before GET.

Enrichment:

1. Load article by id; if missing return
2. If not eligible (already has image or attempted) — if has image and attempted null, set attempted; return
3. Fetch HTML; parse; normalize URL (http/https, max 500)
4. Set `ImageUrl` if parsed; always set `ImageEnrichmentAttemptedAt = UtcNow`; SaveChanges

Startup: query eligible ordered by `IngestedAt desc nulls last`, then `Id desc`, `Take(50)`, enqueue each.

Wire in `Program.cs` like PDF queue/worker + scoped service + HttpClient.

- [ ] **Step 1: Write service tests with fake HTML client + InMemory EF** (pattern from `RssIngestServiceTests` / `PdfIngestServiceTests`)

Cases: success sets ImageUrl + timestamp; missing meta sets timestamp only; existing ImageUrl not overwritten; SSRF/invalid skipped with timestamp.

- [ ] **Step 2: Implement queue/client/service/worker + DI**

- [ ] **Step 3: Call `EnqueueEligibleStartupAsync` from worker `ExecuteAsync` before reading channel (once at start)**

- [ ] **Step 4: Tests pass; commit** `feat: background OG image enrichment worker`

---

### Task 4: Enqueue from ingest paths

**Files:**
- Modify: `apps/api/Ingest/RssIngestService.cs` — inject `ImageEnrichmentQueue`; after successful insert, if eligible enqueue `article.Id`
- Modify: `apps/api/Ingest/ScrapeIngestService.cs` — same
- Modify: `apps/api/Ingest/PdfIngestService.cs` — same (pdf:// typically skips)

After `SaveChangesAsync` succeeds and `article.Id` is assigned:

```csharp
if (ArticleImageEnrichmentService.IsEligible(article))
{
    await enrichmentQueue.EnqueueAsync(article.Id, cancellationToken);
}
```

Keep `IsEligible` on the service as `public static` or shared helper to avoid duplication.

- [ ] **Step 1: Wire enqueue in all three insert helpers**
- [ ] **Step 2: Run full API test suite**

```bash
dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj
```

- [ ] **Step 3: Commit** `feat: enqueue image enrichment after article ingest`

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| Hotlink og/twitter into ImageUrl | 1, 3 |
| Separate background pass | 3 |
| Auto after insert RSS/scrape/PDF | 4 |
| No historical backfill + migration seed | 2 |
| One attempt / never retry | 2, 3 |
| SafeHttp + serial worker + size cap | 3 |
| Startup sweep capped 50 | 3 |
| No OpenAPI/UI | — |

## Execution

User requested build immediately → **inline execution** (executing-plans) on branch `feat/og-image-hotlink-enrichment`.
