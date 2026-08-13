# Jhansi live RSS ingest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Manual `POST /api/ingest/rss` pulls allowlisted Jhansi RSS into live articles (Hindi + English snippets), hides Jhansi `[MOCK]` rows once real items exist, and leaves other cities on mock.

**Architecture:** Keep ingest inside `NewsFeed.Api`. Pure helpers parse/sanitize RSS; `RssIngestService` fetches allowlisted feeds via `IRssFeedClient`, upserts by unique `source_url`, and maps everything to city slug `jhansi`. A secret header protects the new endpoint. Public `GET /api/articles` gains a mock-hiding filter only for Jhansi after the first ingested row. No timer, no HTML scrape, no Expo UI change.

**Tech Stack:** .NET 8, EF Core + Npgsql, xUnit + WebApplicationFactory, `XDocument` RSS 2.0 parser (no extra feed package), `IHttpClientFactory`, existing `Article` columns.

**Spec:** `docs/superpowers/specs/2026-08-13-jhansi-rss-ingest-design.md`

## Global Constraints

- RSS allowlist only — never fetch HTML article bodies or invent a scrape fallback.
- Ingest is live (no review queue). Snippet = stripped RSS description, capped at 400 chars (column max remains 1000).
- Place names for **Wider** feeds: Jhansi, झांसी, Orchha, ओरछा, Lalitpur, ललितपुर, Datia, दतिया, Babina, बबीना (case-insensitive Latin; exact Hindi substring).
- City-edition feeds store every well-formed item as Jhansi.
- Header `X-Ingest-Key` must equal `RssIngest:Secret`. Empty/missing secret ⇒ 401. Not a reader-app button.
- RSS is untrusted: strip tags, decode entities, enforce headline ≤ 300 and summary ≤ 1000.
- One dead feed must not fail the run or the public feed.
- Duplicate `source_url` is skipped (DB unique index + pre-check).
- Jhansi `[MOCK]` seed rows stay until ≥1 ingested Jhansi article exists; then they are omitted. Lucknow/Kanpur/Agra mocks unchanged.
- Category defaults to `Local`.
- No auth for readers. Do not commit secrets. OpenAPI + `packages/shared-types` update in the same PR as the new endpoint.
- Commits: Conventional Commits, only when the executor is allowed to commit.

---

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/Ingest/HtmlText.cs` | Strip tags / decode entities / collapse whitespace / truncate |
| `apps/api/Ingest/PlaceNameMatcher.cs` | Wider-feed keep/drop using locked place names |
| `apps/api/Ingest/ParsedRssItem.cs` | Normalized item from RSS XML |
| `apps/api/Ingest/RssFeedParser.cs` | RSS 2.0 (`channel/item`) → `ParsedRssItem` list |
| `apps/api/Ingest/RssFeedKind.cs` | `CityEdition` \| `Wider` |
| `apps/api/Options/RssIngestOptions.cs` | Secret + feed allowlist |
| `apps/api/Ingest/IRssFeedClient.cs` | Fetch feed body by URL |
| `apps/api/Ingest/RssFeedClient.cs` | `HttpClient` implementation |
| `apps/api/Ingest/RssIngestService.cs` | Orchestrate fetch → parse → filter → insert |
| `apps/api/Ingest/IngestRunResult.cs` | Counts for the POST response |
| `apps/api/Dtos/IngestRunResponse.cs` | OpenAPI DTO |
| `apps/api/Endpoints/IngestEndpoints.cs` | `POST /api/ingest/rss` |
| `apps/api/Data/AppDbContext.cs` | Unique index on `source_url` |
| `apps/api/Endpoints/ArticlesEndpoints.cs` | Hide Jhansi mocks after first real item |
| `apps/api/Program.cs` | Options, HttpClient, service, map ingest |
| `apps/api/appsettings.json` | Allowlisted Jhansi feeds |
| `apps/api/appsettings.Development.json` | Dev ingest secret placeholder |
| `infra/migrations/*UniqueArticleSourceUrl*` | Unique `source_url` |
| `.env.example`, `.env.production.example`, `render.yaml` | `RssIngest__Secret` |
| `apps/api.Tests/HtmlTextTests.cs` | Strip / truncate |
| `apps/api.Tests/PlaceNameMatcherTests.cs` | Orchha keep / Lucknow drop |
| `apps/api.Tests/RssFeedParserTests.cs` | Fixture XML |
| `apps/api.Tests/RssIngestServiceTests.cs` | Dedupe, partial feed failure |
| `apps/api.Tests/IngestEndpointTests.cs` | 401 / 200 |
| `apps/api.Tests/CitiesAndArticlesEndpointTests.cs` | Mock hiding |
| `apps/api.Tests/FakeRssFeedClient.cs` | In-memory feed map |
| `packages/shared-types/openapi/openapi.json` + generated TS | New POST |

**Verified allowlist (probed 2026-08-13, HTTP 200 RSS):**

| SourceName | Url | Language | Kind | CitySlug |
|------------|-----|----------|------|----------|
| Amar Ujala | `https://www.amarujala.com/rss/jhansi.xml` | hi | CityEdition | jhansi |
| Amar Ujala | `https://www.amarujala.com/rss/lalitpur.xml` | hi | CityEdition | jhansi |
| Google News | `https://news.google.com/rss/search?q=Jhansi&hl=en-IN&gl=IN&ceid=IN:en` | en | CityEdition | jhansi |
| Amar Ujala | `https://www.amarujala.com/rss/uttar-pradesh.xml` | hi | Wider | jhansi |

Lalitpur city RSS is mapped to the Jhansi edition because the spec includes Lalitpur as nearby coverage. Drop any URL that stops returning RSS 2.0; do not scrape.

---

### Task 1: HTML / text sanitizer

**Files:**
- Create: `apps/api/Ingest/HtmlText.cs`
- Test: `apps/api.Tests/HtmlTextTests.cs`

**Interfaces:**
- Consumes: none
- Produces:
  - `public static class HtmlText`
  - `public static string ToPlainText(string? html)`
  - `public static string Truncate(string text, int maxChars)`

- [ ] **Step 1: Write the failing test**

```csharp
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class HtmlTextTests
{
    [Fact]
    public void ToPlainText_StripsTagsAndDecodesEntities()
    {
        var input = "<p>झांसी &amp; <b>Orchha</b></p><script>alert(1)</script>";
        var text = HtmlText.ToPlainText(input);
        Assert.Equal("झांसी & Orchha", text);
        Assert.DoesNotContain("<", text);
        Assert.DoesNotContain("alert", text);
    }

    [Fact]
    public void Truncate_CapsLengthWithoutBreakingRequiredNonEmpty()
    {
        var text = new string('अ', 50);
        Assert.Equal(40, HtmlText.Truncate(text, 40).Length);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~HtmlTextTests`

Expected: FAIL (type `HtmlText` not found)

- [ ] **Step 3: Write minimal implementation**

`ToPlainText`: null/whitespace → `""`; remove `<script>…</script>` and `<style>…</style>` (IgnoreCase); replace tags with space via `Regex("<[^>]+>")`; `WebUtility.HtmlDecode`; collapse whitespace (`[\s]+` → single space); trim.

`Truncate`: if `text.Length <= maxChars` return text; else `text[..maxChars].TrimEnd()`.

- [ ] **Step 4: Run tests and make sure they pass**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~HtmlTextTests`

Expected: PASS

- [ ] **Step 5: Commit** (only if committing is in scope)

```bash
git add apps/api/Ingest/HtmlText.cs apps/api.Tests/HtmlTextTests.cs
git commit -m "feat: sanitize RSS HTML into plain text snippets"
```

---

### Task 2: Wider-feed place-name matcher

**Files:**
- Create: `apps/api/Ingest/PlaceNameMatcher.cs`
- Test: `apps/api.Tests/PlaceNameMatcherTests.cs`

**Interfaces:**
- Consumes: none
- Produces:
  - `public static class PlaceNameMatcher`
  - `public static bool MatchesJhansiEdition(string? title, string? snippet)`
  - Names (ordinal ignore-case for Latin, ordinal for Hindi): Jhansi, झांसी, Orchha, ओरछा, Lalitpur, ललितपुर, Datia, दतिया, Babina, बबीना

- [ ] **Step 1: Write the failing test**

```csharp
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class PlaceNameMatcherTests
{
    [Fact]
    public void Matches_Orchha_InTitle()
    {
        Assert.True(PlaceNameMatcher.MatchesJhansiEdition("PWD pause near Orchha junction", "state road works"));
    }

    [Fact]
    public void Rejects_LucknowOnly()
    {
        Assert.False(PlaceNameMatcher.MatchesJhansiEdition("Gomti walkway lighting in Lucknow", "capital news"));
    }

    [Fact]
    public void Matches_HindiJhansi()
    {
        Assert.True(PlaceNameMatcher.MatchesJhansiEdition("झांसी में जल केंद्र", ""));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~PlaceNameMatcherTests`

Expected: FAIL (`PlaceNameMatcher` not found)

- [ ] **Step 3: Write minimal implementation**

Concatenate title + space + snippet. Return true if any locked name is a substring (`StringComparison.OrdinalIgnoreCase` is fine for both Latin and these Hindi strings).

- [ ] **Step 4: Run tests and make sure they pass**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~PlaceNameMatcherTests`

Expected: PASS

- [ ] **Step 5: Commit** (only if committing is in scope)

```bash
git add apps/api/Ingest/PlaceNameMatcher.cs apps/api.Tests/PlaceNameMatcherTests.cs
git commit -m "feat: match Jhansi-edition place names in RSS items"
```

---

### Task 3: RSS 2.0 parser

**Files:**
- Create: `apps/api/Ingest/ParsedRssItem.cs`
- Create: `apps/api/Ingest/RssFeedParser.cs`
- Test: `apps/api.Tests/RssFeedParserTests.cs`

**Interfaces:**
- Consumes: `HtmlText`
- Produces:
  - `public sealed record ParsedRssItem(string Title, string Snippet, string SourceUrl, DateTimeOffset? PublishedAt, string? ImageUrl, string? SourceName)`
  - `public static class RssFeedParser`
  - `public static IReadOnlyList<ParsedRssItem> Parse(string xml)`
  - On malformed XML: return empty list (do not throw)

Parse `rss/channel/item`: `title`, `description`, `link` (fallback `guid` if link empty), `pubDate`, optional `enclosure[@url]` when type starts with `image/`, optional `source` inner text as `SourceName`. Skip items with empty title or empty URL after trim. Apply `HtmlText.ToPlainText` then `Truncate(title, 300)` and `Truncate(snippet, 400)`.

- [ ] **Step 1: Write the failing test**

```csharp
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class RssFeedParserTests
{
    private const string Feed = """
        <?xml version="1.0"?><rss version="2.0"><channel>
          <item>
            <title>  &lt;b&gt;झांसी बजट&lt;/b&gt; </title>
            <link>https://www.amarujala.com/jhansi/story-1</link>
            <description>&lt;p&gt;नगर निगम&lt;/p&gt;</description>
            <pubDate>Thu, 13 Aug 2026 04:17:33 +0530</pubDate>
            <source url="https://www.amarujala.com">Amar Ujala</source>
          </item>
          <item>
            <title></title>
            <link>https://example.com/empty-title</link>
          </item>
        </channel></rss>
        """;

    [Fact]
    public void Parse_StripsHtml_SkipsEmptyTitle()
    {
        var items = RssFeedParser.Parse(Feed);
        var item = Assert.Single(items);
        Assert.Equal("झांसी बजट", item.Title);
        Assert.Equal("नगर निगम", item.Snippet);
        Assert.Equal("https://www.amarujala.com/jhansi/story-1", item.SourceUrl);
        Assert.Equal("Amar Ujala", item.SourceName);
        Assert.NotNull(item.PublishedAt);
    }

    [Fact]
    public void Parse_MalformedXml_ReturnsEmpty()
    {
        Assert.Empty(RssFeedParser.Parse("<not-rss"));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~RssFeedParserTests`

Expected: FAIL (`RssFeedParser` not found)

- [ ] **Step 3: Write minimal implementation**

Use `XDocument.Parse` in try/catch. Items via `doc.Descendants("item")` so a missing `rss` wrapper still works. `DateTimeOffset.TryParse` for `pubDate`.

- [ ] **Step 4: Run tests and make sure they pass**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~RssFeedParserTests`

Expected: PASS

- [ ] **Step 5: Commit** (only if committing is in scope)

```bash
git add apps/api/Ingest/ParsedRssItem.cs apps/api/Ingest/RssFeedParser.cs apps/api.Tests/RssFeedParserTests.cs
git commit -m "feat: parse RSS 2.0 items into sanitized headlines"
```

---

### Task 4: Unique `source_url` index

**Files:**
- Modify: `apps/api/Data/AppDbContext.cs` (`Article` entity)
- Create: `infra/migrations/<timestamp>_UniqueArticleSourceUrl.cs` (+ Designer + snapshot update)

**Interfaces:**
- Consumes: existing `Article.SourceUrl`
- Produces: unique index `IX_articles_source_url` on `source_url`

- [ ] **Step 1: Add unique index in the model**

On the `Article` entity in `OnModelCreating`:

```csharp
entity.HasIndex(a => a.SourceUrl).IsUnique();
```

Seed URLs are already unique (`https://example.com/mock/{id}`).

- [ ] **Step 2: Generate migration from repo root**

```bash
dotnet ef migrations add UniqueArticleSourceUrl \
  --project apps/api/NewsFeed.Api.csproj \
  --output-dir ../../infra/migrations \
  --namespace NewsFeed.Api.Migrations
```

Confirm files landed in `infra/migrations/` (not under `apps/api`). Do not edit older applied migrations.

- [ ] **Step 3: Run existing API tests**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj`

Expected: PASS (in-memory provider accepts unique indexes)

- [ ] **Step 4: Commit** (only if committing is in scope)

```bash
git add apps/api/Data/AppDbContext.cs infra/migrations
git commit -m "feat: unique index articles.source_url for ingest dedupe"
```

---

### Task 5: Ingest service (dedupe, matching, partial failure)

**Files:**
- Create: `apps/api/Ingest/RssFeedKind.cs`
- Create: `apps/api/Options/RssIngestOptions.cs`
- Create: `apps/api/Ingest/IRssFeedClient.cs`
- Create: `apps/api/Ingest/IngestRunResult.cs`
- Create: `apps/api/Ingest/RssIngestService.cs`
- Create: `apps/api.Tests/FakeRssFeedClient.cs`
- Test: `apps/api.Tests/RssIngestServiceTests.cs`

**Interfaces:**
- Consumes: `AppDbContext`, `RssIngestOptions`, `IRssFeedClient`, `RssFeedParser`, `PlaceNameMatcher`, `HtmlText`, `City.Slug`
- Produces:
  - `public enum RssFeedKind { CityEdition, Wider }`
  - `public sealed class RssFeedConfig { string SourceName; string Url; string Language; RssFeedKind Kind; string CitySlug; }`
  - `public sealed class RssIngestOptions { public const string SectionName = "RssIngest"; string Secret; List<RssFeedConfig> Feeds; }`
  - `public interface IRssFeedClient { Task<string?> FetchXmlAsync(string url, CancellationToken cancellationToken); }` — return `null` on HTTP/network failure (do not throw)
  - `public sealed record IngestRunResult(int FeedsAttempted, int FeedsFailed, int Inserted, int Skipped);`
  - `public sealed class RssIngestService` with `Task<IngestRunResult> RunAsync(CancellationToken cancellationToken)`

**Insert mapping:** `CityId` from `Cities.Slug == feed.CitySlug`; headline = parsed title; summary = snippet if non-empty else `Tap to read the full story on {source}`; `SourceName` = parsed `SourceName` if present else feed `SourceName`; `SourceUrl` = parsed link (trim, max 500); `PublishedAt` = parsed or `DateTimeOffset.UtcNow`; `Category` = `"Local"`; `ImageUrl` only if starts with `http://` or `https://` (max 500). Skip if city slug missing in DB.

**Dedupe:** skip when `Articles.Any(a => a.SourceUrl == url)` already (also catch unique-constraint on SaveChanges and count as skipped).

- [ ] **Step 1: Write the failing tests**

`FakeRssFeedClient` holds `Dictionary<string, string?>` URL → XML or `null` (failure).

```csharp
public sealed class RssIngestServiceTests
{
    [Fact]
    public async Task Inserts_CityEdition_And_Skips_DuplicateUrl()
    {
        // two feeds: good city XML with one item; second fetch same URL xml again
        // first RunAsync Inserted=1; second RunAsync Inserted=0, Skipped>=1
    }

    [Fact]
    public async Task WiderFeed_KeepsOrchha_DropsLucknowOnly()
    {
        // Wider feed XML with two items; only Orchha row in DB for jhansi
    }

    [Fact]
    public async Task FailedFeed_DoesNotBlock_HealthyFeed()
    {
        // FeedsAttempted=2, FeedsFailed=1, Inserted=1
    }
}
```

Build the test host with `UseInMemoryDatabase`, seed `SeedData.Cities` (and Emptyville if needed), bind `RssIngestOptions` in code (do not hit the network).

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~RssIngestServiceTests`

Expected: FAIL (`RssIngestService` not found)

- [ ] **Step 3: Write `RssIngestService.RunAsync`**

For each feed independently: try fetch → if null, `FeedsFailed++` and continue; parse; if Wider, keep `PlaceNameMatcher.MatchesJhansiEdition(title, snippet)`; insert remaining. Never throw out of `RunAsync` for a single feed (catch + log + `FeedsFailed++`).

- [ ] **Step 4: Run tests and make sure they pass**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~RssIngestServiceTests`

Expected: PASS

- [ ] **Step 5: Commit** (only if committing is in scope)

```bash
git add apps/api/Ingest apps/api/Options/RssIngestOptions.cs apps/api.Tests/FakeRssFeedClient.cs apps/api.Tests/RssIngestServiceTests.cs
git commit -m "feat: ingest allowlisted RSS into Jhansi articles"
```

---

### Task 6: Protected `POST /api/ingest/rss`

**Files:**
- Create: `apps/api/Dtos/IngestRunResponse.cs`
- Create: `apps/api/Endpoints/IngestEndpoints.cs`
- Create: `apps/api/Ingest/RssFeedClient.cs`
- Modify: `apps/api/Program.cs`
- Modify: `apps/api.Tests/NewsFeedWebApplicationFactory.cs` (set `RssIngest:Secret` = `test-ingest-key`; replace `IRssFeedClient` with `FakeRssFeedClient` when tests need it — prefer per-test `WithWebHostBuilder` rather than changing all tests)
- Test: `apps/api.Tests/IngestEndpointTests.cs`

**Interfaces:**
- Consumes: `RssIngestService`, `IOptions<RssIngestOptions>`
- Produces:
  - `public sealed record IngestRunResponse(int FeedsAttempted, int FeedsFailed, int Inserted, int Skipped);`
  - `POST /api/ingest/rss` named `IngestRss`, `WithOpenApi()`, produces 200 `IngestRunResponse`, 401 ProblemDetails, 429
  - Header: `X-Ingest-Key`
  - `RssFeedClient` uses named HttpClient `"rss"` with 15s timeout and a descriptive User-Agent `NewsFeedIngest/0.1`

Constant for tests: `NewsFeedWebApplicationFactory.TestIngestKey = "test-ingest-key"`.

- [ ] **Step 1: Write the failing tests**

```csharp
[Fact]
public async Task IngestRss_MissingKey_Returns401()
{
    var client = _factory.CreateSeededClient();
    var response = await client.PostAsync("/api/ingest/rss", null);
    Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
}

[Fact]
public async Task IngestRss_WrongKey_Returns401()
{
    var client = _factory.CreateSeededClient();
    client.DefaultRequestHeaders.Add("X-Ingest-Key", "nope");
    var response = await client.PostAsync("/api/ingest/rss", null);
    Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
}

[Fact]
public async Task IngestRss_ValidKey_ReturnsCounts()
{
    // factory with FakeRssFeedClient returning one city-edition item
    var response = await client.PostAsync("/api/ingest/rss", null);
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    var body = await response.Content.ReadFromJsonAsync<IngestRunResponse>();
    Assert.True(body!.Inserted >= 1);
}
```

Configure the factory default `RssIngest:Secret` = `test-ingest-key` via `builder.UseSetting("RssIngest:Secret", TestIngestKey)` so existing tests are unaffected (they do not POST ingest). For the 200 test, `WithWebHostBuilder` to inject `FakeRssFeedClient` and a one-feed options list.

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~IngestEndpointTests`

Expected: FAIL (404 — route missing)

- [ ] **Step 3: Implement endpoint + wiring**

`Program.cs`: `Configure<RssIngestOptions>`, `AddHttpClient("rss")`, `AddSingleton/AddHttpClient` `IRssFeedClient` → `RssFeedClient`, `AddScoped<RssIngestService>`, `api.MapIngestEndpoints()`.

Endpoint: compare header to options.Secret with `CryptographicOperations.FixedTimeEquals` on UTF-8 bytes (if configured secret is empty, 401). Then `RunAsync` → `Results.Ok(new IngestRunResponse(...))`.

Keep ingest on the existing `/api` group (rate limited).

- [ ] **Step 4: Run tests and make sure they pass**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~IngestEndpointTests`

Expected: PASS

- [ ] **Step 5: Commit** (only if committing is in scope)

```bash
git add apps/api/Program.cs apps/api/Endpoints/IngestEndpoints.cs apps/api/Dtos/IngestRunResponse.cs apps/api/Ingest/RssFeedClient.cs apps/api.Tests/IngestEndpointTests.cs apps/api.Tests/NewsFeedWebApplicationFactory.cs
git commit -m "feat: protect RSS ingest with X-Ingest-Key"
```

---

### Task 7: Hide Jhansi mocks after first real article

**Files:**
- Modify: `apps/api/Endpoints/ArticlesEndpoints.cs`
- Modify: `apps/api.Tests/CitiesAndArticlesEndpointTests.cs` (add tests; keep `GetArticles_ForJhansi_ReturnsNewestFirst` — it still expects mocks when no ingest has run)

**Interfaces:**
- Consumes: `Article.Headline`, `Article.CityId`
- Produces: same `GET /api/articles` contract; when the requested city is `jhansi` and any row exists whose headline does **not** start with `[MOCK]`, exclude headlines that start with `[MOCK]`

- [ ] **Step 1: Write the failing tests**

```csharp
[Fact]
public async Task GetArticles_Jhansi_KeepsMocks_WhenNoIngestedRows()
{
    var client = _factory.CreateSeededClient();
    var payload = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
    Assert.All(payload!.Items, a => Assert.StartsWith("[MOCK]", a.Headline));
}

[Fact]
public async Task GetArticles_Jhansi_HidesMocks_WhenRealRowExists()
{
    var client = _factory.CreateSeededClient();
    using (var scope = _factory.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Articles.Add(new Article { /* CityId = 2, Headline without [MOCK], unique SourceUrl */ });
        db.SaveChanges();
    }
    var payload = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
    Assert.DoesNotContain(payload!.Items, a => a.Headline.StartsWith("[MOCK]", StringComparison.Ordinal));
    Assert.Contains(payload.Items, a => a.Headline == "Ward sabha tonight");
}

[Fact]
public async Task GetArticles_Lucknow_StillMock_AfterJhansiRealRow()
{
    // insert one Jhansi real article; Lucknow payload items all contain [MOCK]
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~GetArticles_Jhansi_HidesMocks`

Expected: FAIL (mocks still listed)

- [ ] **Step 3: Filter in `MapGet("/articles")` after city is resolved**

If `cityEntity.Slug == "jhansi"`:

```csharp
var hasIngested = await query.AnyAsync(a => !a.Headline.StartsWith("[MOCK]"), cancellationToken);
if (hasIngested)
{
    query = query.Where(a => !a.Headline.StartsWith("[MOCK]"));
}
```

Apply before count/skip/take. Do not change other cities.

- [ ] **Step 4: Run articles + ingest tests**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~ArticlesEndpointTests|FullyQualifiedName~Ingest`

Expected: PASS

- [ ] **Step 5: Commit** (only if committing is in scope)

```bash
git add apps/api/Endpoints/ArticlesEndpoints.cs apps/api.Tests/CitiesAndArticlesEndpointTests.cs
git commit -m "feat: drop Jhansi mock stories after first ingested article"
```

---

### Task 8: Allowlist config, env, Render secret slot

**Files:**
- Modify: `apps/api/appsettings.json`
- Modify: `apps/api/appsettings.Development.json`
- Modify: `.env.example`
- Modify: `.env.production.example`
- Modify: `render.yaml`
- Modify: `apps/api/NewsFeed.Api.http` (sample POST with header)

**Interfaces:**
- Consumes: `RssIngestOptions`
- Produces: the four verified feeds from the file map; `RssIngest__Secret` documented, never committed with a real production value

- [ ] **Step 1: Add feeds to `appsettings.json`** under `"RssIngest": { "Secret": "", "Feeds": [ ... ] }` using the verified table (enum as `"CityEdition"` / `"Wider"`).

- [ ] **Step 2: Development secret** in `appsettings.Development.json`: `"RssIngest": { "Secret": "dev-ingest-key" }` (local only). Production example and `render.yaml`:

```yaml
      - key: RssIngest__Secret
        sync: false
```

`.env.example`: `RssIngest__Secret=dev-ingest-key`  
`.env.production.example`: `RssIngest__Secret=` (comment: set in Render dashboard)

`NewsFeed.Api.http`:

```http
POST {{host}}/api/ingest/rss
X-Ingest-Key: dev-ingest-key
```

- [ ] **Step 3: Run full API test suite**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj`

Expected: PASS

- [ ] **Step 4: Manual check (local API)**

With API running: `curl -i -X POST http://localhost:8080/api/ingest/rss -H "X-Ingest-Key: dev-ingest-key"` then `curl "http://localhost:8080/api/articles?city=jhansi&limit=5"`. Expect `Inserted > 0` on first run, Jhansi items without `[MOCK]`, Lucknow still mock. Second POST should not duplicate URLs.

- [ ] **Step 5: Commit** (only if committing is in scope)

```bash
git add apps/api/appsettings.json apps/api/appsettings.Development.json .env.example .env.production.example render.yaml apps/api/NewsFeed.Api.http
git commit -m "chore: allowlist Jhansi RSS feeds and ingest secret config"
```

---

### Task 9: OpenAPI + shared-types (same PR)

**Files:**
- Modify: `packages/shared-types/openapi/openapi.json`
- Modify: generated TS under `packages/shared-types/src/` (whatever `nswag.json` writes)

**Interfaces:**
- Consumes: running API `GET /openapi/v1.json`
- Produces: types for `IngestRunResponse` and `IngestRss` operation. Expo app does not need to call ingest.

- [ ] **Step 1: Fetch and generate**

API must be running locally:

```bash
pnpm --filter @newsfeed/shared-types fetch-openapi
pnpm --filter @newsfeed/shared-types generate
```

- [ ] **Step 2: Confirm diff includes POST `/api/ingest/rss` and no unrelated contract breaks**

- [ ] **Step 3: Commit** (only if committing is in scope)

```bash
git add packages/shared-types
git commit -m "chore: regenerate shared-types for RSS ingest endpoint"
```

---

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| Jhansi only, hi+en, live RSS snippets | 5, 8 |
| Manual fetch-now + secret header | 6 |
| Allowlist; no HTML scrape | 5, 8 |
| City-edition vs Wider + nearby names | 2, 5 |
| Strip HTML, cap length, skip bad items | 1, 3, 5 |
| Dedupe by source URL | 4, 5 |
| One dead feed does not fail the run | 5 |
| Missing secret denied | 6 |
| Mocks until first ingest; then hidden | 7 |
| Lucknow still mock | 7 |
| OpenAPI / shared-types | 9 |
| Timer, scrape, summaries, other cities | out of scope |

## Placeholder / type check

No TBD remaining. Names used later match Task 5/6: `RssIngestService.RunAsync`, `IRssFeedClient.FetchXmlAsync`, `IngestRunResponse`, header `X-Ingest-Key`, section `RssIngest`.
