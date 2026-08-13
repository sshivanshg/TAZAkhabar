# PDF drop + city scrape ingest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin can drop PDFs/images for AI split/city-tag/summary into `PendingReview`, and scrape allowlisted city pages for Jhansi/Kanpur/Lucknow into auto-`Published` articles — both on the existing API + admin spine.

**Architecture:** Extend `SourceType` with `PdfUpload` and `Scrape`. PDF uploads become `DocumentUpload` rows processed by an in-API `BackgroundService` via a channel queue: PdfPig text extract (or vision when text-thin) → `IArticleIntelligence` → `PendingReview` articles. Scrape reuses `Source`/`IngestionRun`/`Run now`/cron: list fetch → article extract → AI summary → `Published`. SSRF guards on all outbound scrape URLs. No separate worker service.

**Tech Stack:** .NET 8, EF Core + Npgsql, UglyToad.PdfPig, `IHttpClientFactory`, OpenAI-compatible Chat Completions (vision + JSON) behind `IArticleIntelligence`, xUnit + WebApplicationFactory, Vite admin SPA, NSwag shared-types.

**Spec:** `docs/superpowers/specs/2026-08-13-pdf-and-city-scrape-ingest-design.md`

## Global Constraints

- PDF → always `PendingReview`. Scrape → auto-`Published` (`IsMock=false`); bad items → `Archived` via new admin action.
- Cities for scrape seed: Jhansi, Kanpur, Lucknow only. PDF city hint may be any seeded city or detect.
- Languages: Hindi + English.
- Public card body = short **original** AI summary (≤1000, target 2–4 lines) + attribution + link (scrape) or edition attribution (PDF). Never store/render full scraped/PDF body in the reader feed.
- Dedup: scrape on unique `source_url`; PDF uses synthetic URL `pdf://upload/{uploadId}/{sha256-of-normalized-headline+cityId}` (fits existing unique index).
- Upload caps: 25MB, 40 pages, allowlist `application/pdf`, `image/jpeg`, `image/png`, `image/webp`.
- AI keys only in config/env (`ArticleIntelligence__*`). Fake intelligence in tests.
- Scrape HTTP: SSRF block private/loopback/link-local; 15s timeout; polite delay; rate-limit admin ingest triggers.
- Admin JWT on all new admin endpoints. CORS allowlist-only. No secrets in git.
- OpenAPI + `packages/shared-types` updated in the same PR as API contract changes.
- Commits: Conventional Commits; only when the executor is allowed to commit.
- Ship order: Phase A (Tasks 1–7) must work before Phase B (Tasks 8–12). Each phase is independently demoable.

---

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/Data/SourceType.cs` | Add `PdfUpload`, `Scrape` |
| `apps/api/Data/DocumentUploadStatus.cs` | `Queued` \| `Processing` \| `Ready` \| `Failed` |
| `apps/api/Data/Entities/DocumentUpload.cs` | Upload metadata + status |
| `apps/api/Data/Entities/Article.cs` | Optional `DocumentUploadId` |
| `apps/api/Data/Entities/Source.cs` | Optional `ScrapeConfig` JSON string |
| `apps/api/Data/AppDbContext.cs` | Map new entity/columns; DbSet |
| `apps/api/Data/SeedData.cs` | PDF inbox sources + scrape seeds (3 cities) |
| `infra/migrations/*PdfAndScrapeIngest*` | EF migration |
| `apps/api/Options/ArticleIntelligenceOptions.cs` | BaseUrl, ApiKey, Model |
| `apps/api/Options/UploadOptions.cs` | RootPath, MaxBytes, MaxPages |
| `apps/api/Ingest/PlaceNameMatcher.cs` | Per-city matchers (Jhansi/Kanpur/Lucknow) |
| `apps/api/Ingest/IArticleIntelligence.cs` | Split/summarize/city-tag contract |
| `apps/api/Ingest/OpenAiArticleIntelligence.cs` | HTTP OpenAI-compatible client |
| `apps/api/Ingest/ExtractedStory.cs` | Intelligence output DTO |
| `apps/api/Ingest/PdfTextExtractor.cs` | PdfPig text + page count |
| `apps/api/Ingest/PdfIngestService.cs` | Create upload + enqueue |
| `apps/api/Ingest/PdfProcessingQueue.cs` | Channel\<int\> upload ids |
| `apps/api/Ingest/PdfProcessingWorker.cs` | BackgroundService |
| `apps/api/Ingest/SafeHttp.cs` | SSRF URL validation |
| `apps/api/Ingest/HtmlArticleExtractor.cs` | List links + article fields from HTML fixtures |
| `apps/api/Ingest/ScrapeIngestService.cs` | Scrape orchestration |
| `apps/api/Endpoints/AdminUploadsEndpoints.cs` | Upload + list + get |
| `apps/api/Endpoints/AdminArticlesEndpoints.cs` | `POST …/archive` |
| `apps/api/Endpoints/AdminSourcesEndpoints.cs` | Allow Scrape type; trigger scrape |
| `apps/api/Endpoints/IngestEndpoints.cs` | `POST /api/ingest/scrape` (cron key) |
| `apps/api/Dtos/AdminDtos.cs` | Upload DTOs |
| `apps/api/Program.cs` | DI, options, map endpoints |
| `.env.example` | Intelligence + upload path keys |
| `apps/admin/src/pages/UploadsPage.tsx` | Drag-drop UI |
| `apps/admin/src/pages/SourcesPage.tsx` | Create scrape sources |
| `apps/admin/src/pages/ReviewQueuePage.tsx` | Archive action for Published |
| `apps/admin/src/App.tsx` + `Layout.tsx` | Nav route |
| `apps/admin/src/api.ts` | Client helpers |
| `apps/api.Tests/*` | Unit + integration tests |
| `packages/shared-types` | Regenerated OpenAPI types |

---

# Phase A — PDF drop + AI → PendingReview

### Task 1: Place matcher per city

**Files:**
- Modify: `apps/api/Ingest/PlaceNameMatcher.cs`
- Modify: `apps/api.Tests/PlaceNameMatcherTests.cs`

**Interfaces:**
- Consumes: none
- Produces:
  - `PlaceNameMatcher.MatchesCity(string citySlug, string? title, string? snippet) → bool`
  - Keep `MatchesJhansiEdition` as thin wrapper calling `MatchesCity("jhansi", …)` for existing RSS callers

- [ ] **Step 1: Write the failing tests**

```csharp
[Fact]
public void MatchesCity_Kanpur_Hindi()
{
    Assert.True(PlaceNameMatcher.MatchesCity("kanpur", "कानपुर में बस अड्डा", ""));
}

[Fact]
public void MatchesCity_Lucknow_RejectsKanpurOnly()
{
    Assert.False(PlaceNameMatcher.MatchesCity("lucknow", "Kanpur metro update", ""));
}

[Fact]
public void MatchesJhansiEdition_StillWorks()
{
    Assert.True(PlaceNameMatcher.MatchesJhansiEdition("Orchha fort", ""));
}
```

- [ ] **Step 2: Run tests — expect FAIL** (missing `MatchesCity`)

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~PlaceNameMatcherTests`

- [ ] **Step 3: Implement**

```csharp
public static class PlaceNameMatcher
{
    private static readonly Dictionary<string, string[]> Places = new(StringComparer.OrdinalIgnoreCase)
    {
        ["jhansi"] = ["Jhansi", "झांसी", "Orchha", "ओरछा", "Lalitpur", "ललितपुर", "Datia", "दतिया", "Babina", "बबीना"],
        ["kanpur"] = ["Kanpur", "कानपुर", "Kanpur Nagar", "Kanpur Dehat"],
        ["lucknow"] = ["Lucknow", "लखनऊ", "Gomti Nagar", "गोमती नगर"],
    };

    public static bool MatchesCity(string citySlug, string? title, string? snippet)
    {
        if (!Places.TryGetValue(citySlug, out var names)) return false;
        var text = $"{title} {snippet}";
        return names.Any(n => text.Contains(n, StringComparison.OrdinalIgnoreCase));
    }

    public static bool MatchesJhansiEdition(string? title, string? snippet) =>
        MatchesCity("jhansi", title, snippet);

    public static string? DetectCitySlug(string? title, string? snippet)
    {
        foreach (var slug in new[] { "jhansi", "kanpur", "lucknow" })
        {
            if (MatchesCity(slug, title, snippet)) return slug;
        }
        return null;
    }
}
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/api/Ingest/PlaceNameMatcher.cs apps/api.Tests/PlaceNameMatcherTests.cs
git commit -m "feat: generalize place name matcher for three cities"
```

---

### Task 2: Schema — DocumentUpload, SourceType, Article link

**Files:**
- Modify: `apps/api/Data/SourceType.cs`
- Create: `apps/api/Data/DocumentUploadStatus.cs`
- Create: `apps/api/Data/Entities/DocumentUpload.cs`
- Modify: `apps/api/Data/Entities/Article.cs`
- Modify: `apps/api/Data/Entities/Source.cs` (add `string? ScrapeConfig`)
- Modify: `apps/api/Data/AppDbContext.cs`
- Modify: `apps/api/Data/SeedData.cs` — add inactive-ok PDF inbox `Source` per city Id 2/3/4 named `"PDF uploads"` Type=`PdfUpload`, FeedUrl=null, Kind=`CityEdition`, Language=`hi`
- Create migration under `infra/migrations/`

**Interfaces:**
- Produces entity:

```csharp
public sealed class DocumentUpload
{
    public int Id { get; set; }
    public required string OriginalFileName { get; set; }
    public required string StoredPath { get; set; }
    public required string ContentType { get; set; }
    public long ByteSize { get; set; }
    public int? CityHintId { get; set; }
    public DocumentUploadStatus Status { get; set; }
    public string? ErrorSummary { get; set; }
    public int? IngestionRunId { get; set; }
    public int? SourceId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ProcessedAt { get; set; }
    public City? CityHint { get; set; }
    public IngestionRun? IngestionRun { get; set; }
    public Source? Source { get; set; }
    public ICollection<Article> Articles { get; set; } = new List<Article>();
}
```

- [ ] **Step 1: Add enums, entity, Article.DocumentUploadId, Source.ScrapeConfig, DbSet, Fluent API**

```csharp
// SourceType.cs
public enum SourceType { Rss, Manual, PdfUpload, Scrape }

// DocumentUploadStatus.cs
public enum DocumentUploadStatus { Queued, Processing, Ready, Failed }
```

Map `document_uploads` table; `articles.document_upload_id` FK SetNull; `sources.scrape_config` max 4000. Keep FeedUrl unique filter RSS-only.

- [ ] **Step 2: Seed PDF inbox sources** (Ids 5,6,7 for Jhansi/Kanpur/Lucknow) — do not break existing seed Ids 1–4.

- [ ] **Step 3: Add EF migration**

Run from repo root (same pattern as prior migrations):

```bash
dotnet ef migrations add PdfAndScrapeIngest \
  --project apps/api/NewsFeed.Api.csproj \
  --output-dir ../../infra/migrations
```

- [ ] **Step 4: Build**

Run: `dotnet build NewsFeed.sln`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/Data infra/migrations
git commit -m "feat: add DocumentUpload and PdfUpload/Scrape source types"
```

---

### Task 3: IArticleIntelligence + fake + OpenAI client

**Files:**
- Create: `apps/api/Ingest/ExtractedStory.cs`
- Create: `apps/api/Ingest/IArticleIntelligence.cs`
- Create: `apps/api/Options/ArticleIntelligenceOptions.cs`
- Create: `apps/api/Ingest/OpenAiArticleIntelligence.cs`
- Create: `apps/api.Tests/FakeArticleIntelligence.cs`
- Create: `apps/api.Tests/OpenAiArticleIntelligenceTests.cs` (parse helper / JSON shape with raw fixture — no live network)

**Interfaces:**
- Produces:

```csharp
public sealed record ExtractedStory(
    string Headline,
    string Summary,
    string Category,
    string? CitySlug,
    string Language);

public interface IArticleIntelligence
{
    Task<IReadOnlyList<ExtractedStory>> ExtractStoriesAsync(
        string plainText,
        string? cityHintSlug,
        CancellationToken cancellationToken);

    Task<string> SummarizeArticleAsync(
        string headline,
        string bodyOrSnippet,
        string citySlug,
        CancellationToken cancellationToken);
}
```

- [ ] **Step 1: Failing test — JSON parser / response mapping**

Put parse logic in `OpenAiArticleIntelligence.ParseStoriesJson(string json)` internal/public static for test:

```csharp
[Fact]
public void ParseStoriesJson_ReadsArray()
{
    var json = """{"stories":[{"headline":"H","summary":"S","category":"Local","citySlug":"jhansi","language":"hi"}]}""";
    var stories = OpenAiArticleIntelligence.ParseStoriesJson(json);
    Assert.Single(stories);
    Assert.Equal("jhansi", stories[0].CitySlug);
}
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement options + OpenAI client**

- Options section `ArticleIntelligence`: `BaseUrl` default `https://api.openai.com/v1`, `ApiKey`, `Model` default `gpt-4o-mini`.
- `ExtractStoriesAsync`: POST `{BaseUrl}/chat/completions` with system prompt requiring JSON only: stories array; user content = truncated plainText (max ~24k chars) + city hint; `response_format: { type: "json_object" }` when supported.
- Categories must be one of: Local, State, National, Business, Health, Sports — else coerce to Local.
- Summary truncated via `HtmlText.Truncate(..., 1000)`.
- `SummarizeArticleAsync`: return 2–4 line original summary JSON `{"summary":"..."}`.
- If `ApiKey` empty → throw `InvalidOperationException` with clear message (worker catches → Failed upload).

- [ ] **Step 4: Fake for tests**

```csharp
public sealed class FakeArticleIntelligence : IArticleIntelligence
{
    public Task<IReadOnlyList<ExtractedStory>> ExtractStoriesAsync(string plainText, string? cityHintSlug, CancellationToken cancellationToken)
        => Task.FromResult<IReadOnlyList<ExtractedStory>>([
            new("From PDF", "Summary line for review.", "Local", cityHintSlug ?? "jhansi", "en")
        ]);

    public Task<string> SummarizeArticleAsync(string headline, string bodyOrSnippet, string citySlug, CancellationToken cancellationToken)
        => Task.FromResult("Short original summary for " + headline);
}
```

Register real client in `Program.cs`; replace with Fake in `NewsFeedWebApplicationFactory`.

- [ ] **Step 5: Tests PASS + commit**

```bash
git commit -m "feat: add article intelligence interface and OpenAI client"
```

---

### Task 4: PdfTextExtractor + PdfIngestService + worker queue

**Files:**
- Add NuGet: `UglyToad.PdfPig` to `apps/api/NewsFeed.Api.csproj`
- Create: `apps/api/Options/UploadOptions.cs` (`RootPath`, `MaxBytes=26214400`, `MaxPages=40`)
- Create: `apps/api/Ingest/PdfTextExtractor.cs`
- Create: `apps/api/Ingest/PdfProcessingQueue.cs`
- Create: `apps/api/Ingest/PdfProcessingWorker.cs`
- Create: `apps/api/Ingest/PdfIngestService.cs`
- Test: `apps/api.Tests/PdfTextExtractorTests.cs` (minimal PDF fixture bytes or skip if image-only — prefer a tiny text PDF committed under `apps/api.Tests/Fixtures/hello.pdf`)
- Test: `apps/api.Tests/PdfIngestServiceTests.cs`

**Interfaces:**
- Produces:

```csharp
public sealed class PdfProcessingQueue
{
    public ValueTask EnqueueAsync(int documentUploadId, CancellationToken ct);
    public IAsyncEnumerable<int> ReadAllAsync(CancellationToken ct);
}

public sealed class PdfIngestService
{
    public Task<DocumentUpload> EnqueueAsync(
        Stream file, string fileName, string contentType, int? cityHintId, string uploadedBy, CancellationToken ct);
}
```

Worker flow:
1. Dequeue id → set `Processing`
2. Create/link `IngestionRun` on PDF inbox `Source` for city (hint or Jhansi default source)
3. Extract text (PdfPig). If page count > MaxPages → Failed. If extracted text length < 80 chars and content is PDF → Failed with message asking for clearer scan / image upload (v1: no PDF rasterization); if content is image/* → base64 data-URL path via intelligence multimodal **or** Failed with “image vision not configured” — **v1 decision locked:** images `jpeg/png/webp` call `ExtractStoriesAsync` with a placeholder transcription path: send as “IMAGE_UPLOAD” + note; OpenAI client overload OR fail closed until vision wired. **Implement vision for images in same task:** extend interface:

```csharp
Task<IReadOnlyList<ExtractedStory>> ExtractStoriesFromImageAsync(
    byte[] imageBytes, string contentType, string? cityHintSlug, CancellationToken ct);
```

OpenAI: `image_url` data URL in user message. PDFs with thin text: Failed with clear error (no rasterize in v1) — editors upload page images instead.

4. Resolve city: hint slug else `DetectCitySlug` else fail story skip / default hint required — if no hint and undetectable, use first story city or mark upload Failed if zero stories.
5. Insert articles `PendingReview`, `IsMock=false`, `SourceName="PDF upload"`, synthetic `SourceUrl`, `DocumentUploadId`, `IngestedAt=now`, `PublishedAt=now`
6. Upload `Ready` or `Failed`

- [ ] **Step 1: Failing test — PdfTextExtractor on fixture**

- [ ] **Step 2: Implement extractor + queue + service + worker**

- [ ] **Step 3: PdfIngestServiceTests with Fake intelligence + in-memory DB** — enqueue bytes `"%PDF…"` fixture → after worker drain (call private process method or `ProcessAsync(id)` made internal/public for test), assert 1× `PendingReview` article

Expose `PdfIngestService.ProcessUploadAsync(int id, CancellationToken ct)` for tests/worker to call the same code path.

- [ ] **Step 4: Register in Program.cs** singleton queue, hosted worker, scoped services, `Upload:RootPath` = `Path.Combine(Path.GetTempPath(), "newsfeed-uploads")` in Development

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: process PDF uploads into pending-review articles"
```

---

### Task 5: Admin upload API + Archive endpoint

**Files:**
- Modify: `apps/api/Dtos/AdminDtos.cs`
- Create: `apps/api/Endpoints/AdminUploadsEndpoints.cs`
- Modify: `apps/api/Endpoints/AdminArticlesEndpoints.cs` — `POST /api/admin/articles/{id}/archive`
- Modify: `apps/api/Program.cs` — map uploads
- Test: `apps/api.Tests/AdminUploadsTests.cs`
- Test: extend `apps/api.Tests/AdminArticlesTests.cs` for archive

**DTOs:**

```csharp
public sealed record DocumentUploadResponseDto(
    int Id, string OriginalFileName, string ContentType, long ByteSize,
    int? CityHintId, string Status, string? ErrorSummary,
    int? IngestionRunId, DateTimeOffset CreatedAt, DateTimeOffset? ProcessedAt,
    int ArticlesCreated);

public sealed record PagedDocumentUploadsResponse(
    IReadOnlyList<DocumentUploadResponseDto> Items, int Total, int Page, int PageSize);
```

- [ ] **Step 1: Failing tests**

```csharp
[Fact]
public async Task UploadPdf_ReturnsQueuedAndCreatesPendingReview()
{
    // login admin JWT like AdminArticlesTests
    // multipart hello.pdf
    // assert 202/200 with Status Queued|Processing|Ready
    // call ProcessUploadAsync via service scope OR poll until Ready
    // GET /api/admin/articles?status=PendingReview → contains From PDF
}

[Fact]
public async Task ArchivePublished_HidesFromPublicFeed()
{
    // create Published article, POST archive, GET /api/articles?city= → absent
}
```

- [ ] **Step 2: Implement endpoints**

- `POST /api/admin/uploads` multipart field `file`, optional `cityHintId` → `PdfIngestService.EnqueueAsync` → 201 + DTO
- `GET /api/admin/uploads?page=`
- `GET /api/admin/uploads/{id}`
- Validation: content-type allowlist, size ≤ MaxBytes → 400 ProblemDetails
- Archive: from `Published` → `Archived`; 409 if already Archived; set ReviewedBy/At like reject

- [ ] **Step 3: Tests PASS**

- [ ] **Step 4: Regenerate shared-types**

With API running locally:

```bash
pnpm --filter @newsfeed/shared-types fetch-openapi
pnpm generate:types
```

Commit `packages/shared-types/openapi/openapi.json` + `packages/shared-types/src/generated.ts` with the API change.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add admin PDF upload and article archive APIs"
```

---

### Task 6: Admin Uploads page

**Files:**
- Create: `apps/admin/src/pages/UploadsPage.tsx`
- Modify: `apps/admin/src/api.ts`
- Modify: `apps/admin/src/App.tsx`
- Modify: `apps/admin/src/components/Layout.tsx` — nav item Uploads
- Modify: `apps/admin/src/pages/ReviewQueuePage.tsx` — Archive button when status Published

**Interfaces:**
- `api.uploadDocument(file, cityHintId?)`, `api.listUploads(page)`, `api.archiveArticle(id)`

- [ ] **Step 1: Wire API client methods** matching DTOs

- [ ] **Step 2: UploadsPage** — drag-drop zone, city select (from existing cities list endpoint), table of recent uploads with status + link ` /review?` or filter; poll every 3s while any `Queued`/`Processing`

Keep visual language matching existing admin (simple layout, existing theme tokens) — no marketing redesign.

- [ ] **Step 3: Manual smoke** — `pnpm dev:admin` + API; drop fixture PDF; see PendingReview

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add admin Uploads page for PDF drop"
```

---

### Task 7: Phase A verification gate

- [ ] **Step 1: Run full API tests**

Run: `dotnet test NewsFeed.sln`

Expected: PASS

- [ ] **Step 2: Run admin build**

Run: `pnpm build:admin`

Expected: PASS

- [ ] **Step 3: Update `.env.example`** with:

```
ArticleIntelligence__ApiKey=
ArticleIntelligence__BaseUrl=https://api.openai.com/v1
ArticleIntelligence__Model=gpt-4o-mini
Upload__RootPath=
```

- [ ] **Step 4: Commit docs/env if needed**

```bash
git commit -m "chore: document article intelligence and upload settings"
```

Phase A is demoable here. Do not start Phase B until this gate is green.

---

# Phase B — City scrape → Published

### Task 8: SafeHttp + HTML extractors

**Files:**
- Create: `apps/api/Ingest/SafeHttp.cs`
- Create: `apps/api/Ingest/HtmlArticleExtractor.cs`
- Create: `apps/api.Tests/SafeHttpTests.cs`
- Create: `apps/api.Tests/HtmlArticleExtractorTests.cs`
- Create: `apps/api.Tests/Fixtures/scrape-list.html`, `scrape-article.html`

**Interfaces:**

```csharp
public static class SafeHttp
{
    public static bool TryValidatePublicAbsoluteUri(string? url, out Uri uri, out string error);
}

public static class HtmlArticleExtractor
{
    public static IReadOnlyList<Uri> ExtractArticleLinks(string listHtml, Uri baseUri, int maxLinks);
    public static (string Headline, string Snippet, DateTimeOffset? PublishedAt) ExtractArticle(string articleHtml);
}
```

- [ ] **Step 1: Failing SSRF tests** — reject `http://127.0.0.1/`, `http://10.0.0.1/`, `file://`, non-http(s); accept `https://www.amarujala.com/x`

- [ ] **Step 2: Implement SafeHttp** — DNS resolve optional in v1: block literal IP private ranges + localhost hostnames; require http/https

- [ ] **Step 3: Extractor tests on fixtures** — list with `<a href="/city/story-1">`; article with `<h1>` + `<p>`

Use AngleSharp **or** HtmlAgilityPack if already in repo; else add `AngleSharp` NuGet. Prefer AngleSharp.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add SSRF guard and HTML article extractors"
```

---

### Task 9: ScrapeIngestService

**Files:**
- Create: `apps/api/Ingest/ScrapeIngestService.cs`
- Create: `apps/api.Tests/FakeScrapeHttpClient.cs` (or `IScrapeHttpClient`)
- Create: `apps/api.Tests/ScrapeIngestServiceTests.cs`
- Modify: `apps/api/Program.cs`

**Interfaces:**

```csharp
public interface IScrapeHttpClient
{
    Task<string> GetStringAsync(Uri uri, CancellationToken ct);
}

public sealed class ScrapeIngestService
{
    public Task<IngestionRun> RunSourceAsync(int sourceId, CancellationToken ct);
    public Task<IngestRunResult> RunAllActiveAsync(CancellationToken ct);
}
```

Flow per source (`Type==Scrape`, `IsActive`):
1. Validate `FeedUrl` via SafeHttp
2. GET list HTML → links (max 20)
3. For each new URL: GET article → extract → `SummarizeArticleAsync` → insert `Published`, category Local default, `SourceName` from Source.Name, `CityId` from source, dedupe `source_url`
4. Delay ~300ms between article fetches
5. Write `IngestionRun` counts; update Source last-fetch fields

- [ ] **Step 1: Failing test** — fake HTTP map list+article → 1 Published; second run → skipped

- [ ] **Step 2: Implement + register**

- [ ] **Step 3: Tests PASS + commit**

```bash
git commit -m "feat: scrape city sources into published articles"
```

---

### Task 10: Wire scrape triggers + seed sources

**Files:**
- Modify: `apps/api/Endpoints/AdminSourcesEndpoints.cs` — create/update allow `Scrape`; trigger calls `ScrapeIngestService` when Type=Scrape (RSS path unchanged)
- Modify: `apps/api/Endpoints/IngestEndpoints.cs` — `POST /api/ingest/scrape` with same `X-Ingest-Key`
- Modify: `apps/api/Data/SeedData.cs` — seed scrape sources for Jhansi/Kanpur/Lucknow (Amar Ujala city section URLs + Google News search URLs). Verify URLs return HTML during implementation; if 404, keep placeholder URL + `IsActive=false` until fixed
- Modify: `render.yaml` / cron if present — add scrape cron sibling to RSS
- Test: `apps/api.Tests/AdminSourcesTests.cs`, `IngestEndpointTests.cs`

Locked seed shape (adjust URLs if probe fails):

| Name | City | Example FeedUrl pattern |
|------|------|-------------------------|
| Amar Ujala | jhansi | `https://www.amarujala.com/uttar-pradesh/jhansi` |
| Google News | jhansi | `https://news.google.com/search?q=Jhansi&hl=hi-IN&gl=IN&ceid=IN:hi` |
| (same pair) | kanpur, lucknow | city name substituted |

- [ ] **Step 1: Failing tests for create Scrape source + ingest scrape 401/200**

- [ ] **Step 2: Implement**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: seed and trigger city scrape ingest"
```

---

### Task 11: Admin Sources UI for scrape + Archive in review

**Files:**
- Modify: `apps/admin/src/pages/SourcesPage.tsx` — type dropdown includes Scrape; show scrape URL field; Run now works for Scrape
- Modify: `apps/admin/src/pages/ReviewQueuePage.tsx` — Archive for Published
- Regenerate types if needed

- [ ] **Step 1: UI updates**

- [ ] **Step 2: Smoke Run now on inactive fixture via test still; manual optional**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: admin UI for scrape sources and archive"
```

---

### Task 12: Phase B verification + spec status

- [ ] **Step 1:** `dotnet test NewsFeed.sln` PASS
- [ ] **Step 2:** `pnpm build:admin` PASS
- [ ] **Step 3:** Confirm public feed only shows Published non-mock; archived scrape item disappears
- [ ] **Step 4:** Final commit if env/render docs lagged

```bash
git commit -m "chore: finish city scrape ingest wiring"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| PDF drop + OCR/AI → PendingReview | 3–6 |
| Mix e-paper/clipping; HI+EN | 3–4 |
| City hint / detect Jhansi-Kanpur-Lucknow | 1, 4 |
| Scrape 3 cities + admin add later | 9–11 |
| Seed AU/Jagran-style + Google News | 10 |
| Scrape auto-publish; PDF review | 4, 9 |
| IngestionRun + Source types | 2, 9–10 |
| SSRF, caps, sanitize | 4, 5, 8 |
| Archive escape hatch | 5, 11 |
| Cron + Run now | 10 |
| Tests with fixtures not live sites | 4, 8, 9 |
| shared-types same PR | 5, 10 |

**Intentionally deferred (spec non-goals):** PDF page rasterization for scanned PDFs (upload images instead); separate worker service; Agra scrape seed; virus scan; object storage.
