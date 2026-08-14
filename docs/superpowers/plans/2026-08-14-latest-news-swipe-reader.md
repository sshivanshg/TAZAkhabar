# Latest-news retention, feed polish & immersive swipe reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hard-delete news older than 7 days, keep public APIs latest-only, polish feed infinite scroll, and replace the article screen with an immersive dark vertical swipe pager (Inshorts-style summaries + coach until first swipe).

**Architecture:** Daily Render cron calls a keyed purge endpoint that batch-deletes old articles (views cascade). Public article reads also filter to the retention window. The Expo feed keeps `offset`/`limit` infinite scroll with clearer footers. `article/[id]` becomes a full-screen vertical `FlatList` pager over the same filtered list, with AsyncStorage-backed coach dismiss.

**Tech Stack:** .NET 8 Minimal API, EF Core, xUnit + WebApplicationFactory, Render cron (Python one-liner), Expo Router, React Native `FlatList` `pagingEnabled`, Moti, AsyncStorage, Jest + RNTL, NSwag shared-types when purge DTO is added.

**Spec:** `docs/superpowers/specs/2026-08-14-latest-news-swipe-reader-design.md`

## Global Constraints

- Hard delete only — no soft-archive retention path.
- Retention default **7** days via `ArticleRetention__Days` / `ArticleRetention:Days`.
- Retention age field: `PublishedAt` for `Published`; otherwise `IngestedAt ?? PublishedAt` (entity has no `CreatedAt`).
- Public list/detail/trending must not expose content older than the retention window.
- Purge auth: same `X-Ingest-Key` + `RssIngest__Secret` fixed-time compare as ingest.
- Swipe: **vertical only**; card content = headline + summary (not scraped full body).
- Visual: immersive **dark** full-screen cards on the reader only; feed stays existing light tokens.
- Coach: show until first successful page change; then AsyncStorage flag.
- No numbered feed pagination UI.
- No new native pager dependency — use RN `FlatList` with `pagingEnabled`.
- Conventional Commits; feature branch + PR (no direct `main`).
- Same PR: regenerate `packages/shared-types` if OpenAPI gains purge response; update atlas `02`, `03`, `06`, `08` and bump **Last verified against**.

---

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/Options/ArticleRetentionOptions.cs` | `Days` config (default 7) |
| `apps/api/Services/ArticleRetention.cs` | Cutoff helper + eligibility expression |
| `apps/api/Services/ArticlePurgeService.cs` | Batch hard-delete |
| `apps/api/Ingest/IngestKeyAuth.cs` | Shared fixed-time key compare (extracted from ingest) |
| `apps/api/Endpoints/MaintenanceEndpoints.cs` | `POST /api/maintenance/purge-old-articles` |
| `apps/api/Dtos/PurgeOldArticlesResponse.cs` | `{ deleted: number }` |
| `apps/api/Endpoints/IngestEndpoints.cs` | Use shared `IngestKeyAuth` |
| `apps/api/Endpoints/ArticlesEndpoints.cs` | Apply retention filter on list / by-id / trending / view existence |
| `apps/api/Program.cs` | Configure options; map maintenance endpoints |
| `render.yaml` | Daily purge cron + optional `ArticleRetention__Days` |
| `.env.example`, `.env.production.example` | Document retention days |
| `apps/api.Tests/ArticlePurgeTests.cs` | Purge + auth tests |
| `apps/api.Tests/CitiesAndArticlesEndpointTests.cs` | Retention filter tests on public reads |
| `apps/app/app/(tabs)/index.tsx` | End-of-feed footer + append retry |
| `apps/app/src/storage/swipeCoach.ts` | Coach seen flag |
| `apps/app/src/utils/articleRouteParams.ts` | Pass city/category/date/lang for stack rebuild |
| `apps/app/app/article/[id].tsx` | Immersive vertical pager + coach |
| `apps/app/src/components/SwipeStoryCard.tsx` | Dark story card UI |
| `apps/app/src/theme/readerTokens.ts` | Dark reader palette (isolated from feed) |
| `apps/app/__tests__/feed.test.tsx` | End-of-feed assertions |
| `apps/app/__tests__/article.test.tsx` | Coach + pager smoke |
| `apps/app/__tests__/swipeCoach.test.ts` | Storage helper |
| `packages/shared-types/*` | Regen after OpenAPI change |
| `docs/architecture/02-api.md`, `03-data-model.md`, `06-reader-app.md`, `08-hosting-and-ci.md` | Atlas sync |

---

### Task 1: Retention options, purge service, maintenance endpoint

**Files:**
- Create: `apps/api/Options/ArticleRetentionOptions.cs`
- Create: `apps/api/Services/ArticleRetention.cs`
- Create: `apps/api/Services/ArticlePurgeService.cs`
- Create: `apps/api/Ingest/IngestKeyAuth.cs`
- Create: `apps/api/Dtos/PurgeOldArticlesResponse.cs`
- Create: `apps/api/Endpoints/MaintenanceEndpoints.cs`
- Create: `apps/api.Tests/ArticlePurgeTests.cs`
- Modify: `apps/api/Endpoints/IngestEndpoints.cs` — call `IngestKeyAuth.Matches`
- Modify: `apps/api/Program.cs` — `Configure<ArticleRetentionOptions>`, `AddScoped<ArticlePurgeService>`, `api.MapMaintenanceEndpoints()`

**Interfaces:**
- Consumes: `AppDbContext`, `IOptions<ArticleRetentionOptions>`, `IOptions<RssIngestOptions>`, `X-Ingest-Key`
- Produces: `POST /api/maintenance/purge-old-articles` → `PurgeOldArticlesResponse(int Deleted)`; `ArticleRetention.CutoffUtc(DateTimeOffset now, int days)`; `ArticlePurgeService.PurgeAsync(CancellationToken) → int`

- [ ] **Step 1: Write failing purge tests**

```csharp
// apps/api.Tests/ArticlePurgeTests.cs
public sealed class ArticlePurgeTests : IClassFixture<NewsFeedWebApplicationFactory>
{
    private readonly NewsFeedWebApplicationFactory _factory;
    public ArticlePurgeTests(NewsFeedWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task Purge_MissingKey_Returns401()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.PostAsync("/api/maintenance/purge-old-articles", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Purge_DeletesOnlyOlderThanRetention_AndCascadesViews()
    {
        var client = _factory.CreateSeededClient();
        // Seed via scope: one article PublishedAt = UtcNow.AddDays(-8), one = UtcNow.AddDays(-1),
        // plus an ArticleView on the old id. Use factory Services + AppDbContext like other tests.
        client.DefaultRequestHeaders.Add("X-Ingest-Key", NewsFeedWebApplicationFactory.TestIngestKey);
        var response = await client.PostAsync("/api/maintenance/purge-old-articles", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PurgeOldArticlesResponse>();
        Assert.NotNull(body);
        Assert.True(body.Deleted >= 1);
        // Assert old gone, recent remains, views for old gone.
    }

    [Fact]
    public async Task Purge_Idempotent_SecondCallDeletedZero()
    {
        var client = _factory.CreateSeededClient();
        client.DefaultRequestHeaders.Add("X-Ingest-Key", NewsFeedWebApplicationFactory.TestIngestKey);
        await client.PostAsync("/api/maintenance/purge-old-articles", null);
        var second = await client.PostAsync("/api/maintenance/purge-old-articles", null);
        var body = await second.Content.ReadFromJsonAsync<PurgeOldArticlesResponse>();
        Assert.Equal(0, body!.Deleted);
    }
}
```

Follow existing seed helpers in `CitiesAndArticlesEndpointTests` (`InsertJhansiArticles` / local copies) for inserting articles + views.

- [ ] **Step 2: Run tests — expect fail (404 / missing types)**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~ArticlePurgeTests`

Expected: FAIL (endpoint or types missing).

- [ ] **Step 3: Implement options + retention helper + purge service**

```csharp
// ArticleRetentionOptions.cs
namespace NewsFeed.Api.Options;
public sealed class ArticleRetentionOptions
{
    public const string SectionName = "ArticleRetention";
    public int Days { get; set; } = 7;
}

// ArticleRetention.cs
public static class ArticleRetention
{
    public static DateTimeOffset CutoffUtc(DateTimeOffset utcNow, int days)
    {
        var d = days < 1 ? 7 : days;
        return utcNow.AddDays(-d);
    }

    public static DateTimeOffset AgeTimestamp(Article a) =>
        a.Status == ArticleStatus.Published
            ? a.PublishedAt
            : (a.IngestedAt ?? a.PublishedAt);
}

// ArticlePurgeService — loop:
// cutoff = ArticleRetention.CutoffUtc(UtcNow, options.Days)
// take batch of 500 ids where AgeTimestamp < cutoff (translate to EF:
//   Status==Published && PublishedAt < cutoff
//   || Status!=Published && (IngestedAt ?? PublishedAt) < cutoff
// Prefer two queries or: PublishedAt < cutoff OR (IngestedAt != null && IngestedAt < cutoff && Status != Published)
// Simplest correct approach matching spec intent for MVP:
//   delete where COALESCE(IngestedAt, PublishedAt) is not used for published —
// Spec: Published → PublishedAt; else IngestedAt ?? PublishedAt.
// EF-translatable:
//   (a.Status == Published && a.PublishedAt < cutoff)
//   || (a.Status != Published && ((a.IngestedAt ?? a.PublishedAt) < cutoff))
// RemoveRange by id batch; SaveChanges; accumulate deleted until batch empty.
```

```csharp
// IngestKeyAuth.cs — move body of IngestKeyMatches here as public static Matches(provided, configured)
```

```csharp
// MaintenanceEndpoints.MapMaintenanceEndpoints
// POST purge → key check → purgeService.PurgeAsync → Results.Ok(new PurgeOldArticlesResponse(deleted))
```

Wire in `Program.cs` next to other `Configure<>` and `api.MapMaintenanceEndpoints()` beside ingest.

- [ ] **Step 4: Re-run purge tests — expect pass**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~ArticlePurgeTests`

Expected: PASS. Also run `FullyQualifiedName~IngestEndpointTests` to confirm key refactor did not break ingest.

- [ ] **Step 5: Commit**

```bash
git add apps/api/Options/ArticleRetentionOptions.cs apps/api/Services/ArticleRetention.cs \
  apps/api/Services/ArticlePurgeService.cs apps/api/Ingest/IngestKeyAuth.cs \
  apps/api/Dtos/PurgeOldArticlesResponse.cs apps/api/Endpoints/MaintenanceEndpoints.cs \
  apps/api/Endpoints/IngestEndpoints.cs apps/api/Program.cs apps/api.Tests/ArticlePurgeTests.cs
git commit -m "$(cat <<'EOF'
feat: add keyed purge for articles past retention

EOF
)"
```

---

### Task 2: Public API 7-day filter

**Files:**
- Modify: `apps/api/Endpoints/ArticlesEndpoints.cs` — inject `IOptions<ArticleRetentionOptions>`; filter list, dates window (cap already exists — also clamp to retention), trending `publishedSince`, get-by-id, view `exists` check
- Modify: `apps/api.Tests/CitiesAndArticlesEndpointTests.cs` (or new `ArticleRetentionFilterTests.cs`)
- Note: `TrendingDefaults.PublishCeiling` is already 7 days — drive it from `ArticleRetentionOptions.Days` so one knob controls both

**Interfaces:**
- Consumes: `ArticleRetention.CutoffUtc`
- Produces: public reads exclude `PublishedAt < cutoff`

- [ ] **Step 1: Write failing filter tests**

```csharp
[Fact]
public async Task GetArticles_ExcludesOlderThanRetention()
{
    var client = _factory.CreateSeededClient();
    InsertJhansiArticles(
        Published("Old", "https://example.com/old", DateTimeOffset.UtcNow.AddDays(-8)),
        Published("Fresh", "https://example.com/fresh", DateTimeOffset.UtcNow.AddDays(-1)));
    var payload = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
    Assert.DoesNotContain(payload!.Items, a => a.Headline == "Old");
    Assert.Contains(payload.Items, a => a.Headline == "Fresh");
}

[Fact]
public async Task GetArticleById_Old_Returns404()
{
    var client = _factory.CreateSeededClient();
    var id = InsertOneOldPublished(...); // helper returns id
    var response = await client.GetAsync($"/api/articles/{id}");
    Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
}
```

- [ ] **Step 2: Run — expect fail (old still returned)**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~GetArticles_ExcludesOlderThanRetention|FullyQualifiedName~GetArticleById_Old`

- [ ] **Step 3: Apply cutoff in endpoints**

In `GetArticles` query add `&& a.PublishedAt >= cutoff` where `cutoff = ArticleRetention.CutoffUtc(DateTimeOffset.UtcNow, retention.Days)`.

Same for `GetArticleById` and view existence. For trending, replace `TrendingDefaults.PublishCeiling` usage with `TimeSpan.FromDays(retention.Days)` (min 1).

- [ ] **Step 4: Run filter + existing article tests**

Run: `dotnet test apps/api.Tests/NewsFeed.Api.Tests.csproj --filter FullyQualifiedName~ArticlesEndpointTests|FullyQualifiedName~TrendingEndpointTests|FullyQualifiedName~GetArticleById_Old`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/Endpoints/ArticlesEndpoints.cs apps/api.Tests/*.cs
git commit -m "$(cat <<'EOF'
feat: hide articles older than retention on public API

EOF
)"
```

---

### Task 3: Render cron, env examples, OpenAPI/shared-types

**Files:**
- Modify: `render.yaml` — daily cron `newsfeed-purge-old-articles`
- Modify: `.env.example`, `.env.production.example` — `ArticleRetention__Days=7`
- Regenerate: `packages/shared-types` via project scripts after API exposes purge in OpenAPI

**Interfaces:**
- Consumes: `INGEST_URL`, `RssIngest__Secret` (same as other crons)
- Produces: cron schedule `0 3 * * *` (03:00 UTC daily — pick any stable daily slot)

- [ ] **Step 1: Add cron sibling in `render.yaml`**

```yaml
  - type: cron
    name: newsfeed-purge-old-articles
    runtime: python
    plan: starter
    schedule: "0 3 * * *"
    buildCommand: "pip install requests"
    startCommand: "python -c \"import os,requests; r=requests.post(os.environ['INGEST_URL'].rstrip('/')+'/api/maintenance/purge-old-articles', headers={'X-Ingest-Key': os.environ['RssIngest__Secret']}, timeout=300); r.raise_for_status()\""
    envVars:
      - key: INGEST_URL
        sync: false
      - key: RssIngest__Secret
        sync: false
```

Optionally on web service:

```yaml
      - key: ArticleRetention__Days
        value: "7"
```

- [ ] **Step 2: Document env in `.env.example` and `.env.production.example`**

```
ArticleRetention__Days=7
```

- [ ] **Step 3: Regenerate shared-types**

Start API locally (or use existing generate path), then:

```bash
pnpm --filter @newsfeed/shared-types fetch-openapi
pnpm --filter @newsfeed/shared-types generate
```

Confirm `PurgeOldArticlesResponse` / operation name appears. If local API unavailable, export OpenAPI from a test host or check-in updated `openapi.json` per repo convention used in prior PRs.

- [ ] **Step 4: Commit**

```bash
git add render.yaml .env.example .env.production.example packages/shared-types
git commit -m "$(cat <<'EOF'
chore: schedule daily article purge cron

EOF
)"
```

---

### Task 4: Feed infinite-scroll polish

**Files:**
- Modify: `apps/app/app/(tabs)/index.tsx` — end footer, append error retry
- Modify: `apps/app/__tests__/feed.test.tsx`

**Interfaces:**
- Consumes: existing `hasMore = articles.length < total`, `loadingMore`
- Produces: visible “You’re caught up” when `!hasMore && articles.length > 0`; retry control when last append failed

- [ ] **Step 1: Extend feed test for end state**

In `feed.test.tsx`, mock `getArticles` so first page fills `total` and assert footer text `You’re caught up` (or `You're caught up`) appears after load when `items.length === total`.

- [ ] **Step 2: Run — expect fail**

Run: `pnpm --filter app test -- __tests__/feed.test.tsx`

- [ ] **Step 3: Update `ListFooterComponent`**

```tsx
ListFooterComponent={
  loadingMore ? (
    <Box>...</Box> // existing skeleton
  ) : appendError ? (
    <Pressable onPress={() => void loadPage('append')} accessibilityRole="button">
      <Text>Couldn’t load more · Tap to retry</Text>
    </Pressable>
  ) : !hasMore && articles.length > 0 ? (
    <Text accessibilityRole="text">You’re caught up</Text>
  ) : null
}
```

Track `appendError` boolean: set true in `loadPage('append')` catch; clear on success/replace/refresh.

Also stop append when `items.length === 0` on append (defensive even if `total` drifts).

- [ ] **Step 4: Re-run feed tests — expect pass**

- [ ] **Step 5: Commit**

```bash
git add apps/app/app/\(tabs\)/index.tsx apps/app/__tests__/feed.test.tsx
git commit -m "$(cat <<'EOF'
fix: clarify feed infinite-scroll end and retry

EOF
)"
```

---

### Task 5: Swipe coach storage

**Files:**
- Create: `apps/app/src/storage/swipeCoach.ts`
- Create: `apps/app/__tests__/swipeCoach.test.ts`

**Interfaces:**
- Produces: `hasCompletedSwipeCoach(): Promise<boolean>`; `markSwipeCoachCompleted(): Promise<void>`; storage key `newsfeed.swipeCoach.v1`

- [ ] **Step 1: Failing unit tests** with mocked AsyncStorage (`getItem`/`setItem`).

- [ ] **Step 2: Implement helper** mirroring `viewSession.ts` / `cityPreference.ts` patterns.

- [ ] **Step 3: Tests pass → commit**

```bash
git add apps/app/src/storage/swipeCoach.ts apps/app/__tests__/swipeCoach.test.ts
git commit -m "$(cat <<'EOF'
feat: persist swipe-coach completion flag

EOF
)"
```

---

### Task 6: Immersive vertical swipe reader

**Files:**
- Create: `apps/app/src/theme/readerTokens.ts`
- Create: `apps/app/src/components/SwipeStoryCard.tsx`
- Modify: `apps/app/src/utils/articleRouteParams.ts` — add optional `city`, `category`, `date`, `lang`
- Modify: `apps/app/app/(tabs)/index.tsx`, `search.tsx`, `bookmarks.tsx` — pass filter params when navigating
- Modify: `apps/app/app/article/[id].tsx` — vertical pager + coach overlay
- Modify: `apps/app/__tests__/article.test.tsx`

**Interfaces:**
- Consumes: `apiClient.getArticles`, `apiClient.getArticle`, `hasCompletedSwipeCoach` / `markSwipeCoachCompleted`, `getViewSessionId` / `recordArticleView`
- Produces: full-screen dark vertical pager; coach until first `onMomentumScrollEnd` index change

- [ ] **Step 1: Update `articleRouteParams` + call sites**

```ts
export type ArticleRouteParams = {
  id: string
  headline: string
  summary: string
  sourceName: string
  sourceUrl: string
  imageUrl: string
  publishedAt: string
  category: string
  city?: string
  feedCategory?: string // avoid clash with article.category
  date?: string
  lang?: string
}
```

When opening from feed, pass `city: citySlug`, `feedCategory` if not All, `date` if not today, `lang: preferredLanguage`.

- [ ] **Step 2: Add `readerTokens.ts`**

```ts
export const readerColors = {
  canvas: '#0F1115',
  card: '#1A1B1E',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  accent: '#7B93FF',
  overlay: 'rgba(0,0,0,0.55)',
  sheet: '#1F222A',
  sheetBorder: '#2E3340',
} as const
```

- [ ] **Step 3: Build `SwipeStoryCard`**

Props: `article: ArticleResponse`, `index`, `total`, `cityLabel?`, `onBack`, `onShare`, `onToggleBookmark`, `bookmarked`.

Layout: full window height; hero image (~52%) with bottom gradient + headline; summary; source · relative time; Share / Save; faint “↑ Next story”. Large tap targets. Use RN `Image` / existing patterns; no raw HTML.

- [ ] **Step 4: Rewrite article screen as pager**

- State: `stack: ArticleResponse[]`, `index`, `total`, `offset`, `showCoach`, `loadError`.
- On mount: if route params have enough fields, seed stack with that article; fetch `getArticles` with city/filters (`limit: PAGE_SIZE`) and replace/merge so order matches feed; locate starting id index.
- If city missing, fall back to stored city preference; if still missing or id 404 → not-found UI with Back.
- `FlatList` vertical, `pagingEnabled`, `showsVerticalScrollIndicator={false}`, `getItemLayout` using `windowHeight`, `initialScrollIndex` when known, `onViewableItemsChanged` / `onMomentumScrollEnd` to update index, record view, dismiss coach via `markSwipeCoachCompleted` on first index change from initial.
- Near end (`index >= stack.length - 3` && `stack.length < total`): append next `getArticles` page.
- Last page: append a synthetic end sentinel **or** disable further scroll and show end copy on last card footer — prefer a non-article footer card “You’re caught up” as final list item when `!hasMore`.
- Coach overlay absolute fill when `showCoach` (from `!await hasCompletedSwipeCoach()`).

- [ ] **Step 5: Update `article.test.tsx`**

- Mock `getArticles` returning a 2-item page including id 7.
- Mock swipeCoach helpers.
- Assert coach copy visible initially; after calling the dismiss path (export a testID `coach-dismissed` by simulating `onMomentumScrollEnd` with next index, or press is N/A — fire FlatList callback if exposed via testID on list `testID="story-pager"`).
- Keep back button / share smoke if previously covered.

- [ ] **Step 6: Run app tests**

Run: `pnpm --filter app test -- __tests__/article.test.tsx __tests__/swipeCoach.test.ts __tests__/feed.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/app/src/theme/readerTokens.ts apps/app/src/components/SwipeStoryCard.tsx \
  apps/app/src/utils/articleRouteParams.ts apps/app/app/article/\[id\].tsx \
  apps/app/app/\(tabs\)/index.tsx apps/app/app/\(tabs\)/search.tsx \
  apps/app/app/\(tabs\)/bookmarks.tsx apps/app/__tests__/article.test.tsx
git commit -m "$(cat <<'EOF'
feat: immersive vertical swipe story reader

EOF
)"
```

---

### Task 7: Architecture atlas updates

**Files:**
- Modify: `docs/architecture/02-api.md` — maintenance purge endpoint; retention filter note
- Modify: `docs/architecture/03-data-model.md` — retention / hard-delete policy
- Modify: `docs/architecture/06-reader-app.md` — swipe reader, coach, reader tokens
- Modify: `docs/architecture/08-hosting-and-ci.md` — purge cron
- Bump **Last verified against** to implementation date on each edited page

- [ ] **Step 1: Edit the four atlas pages** to match shipped behavior (Mermaid only if topology changed — add purge cron on hosting diagram).

- [ ] **Step 2: Commit**

```bash
git add docs/architecture/02-api.md docs/architecture/03-data-model.md \
  docs/architecture/06-reader-app.md docs/architecture/08-hosting-and-ci.md
git commit -m "$(cat <<'EOF'
docs: atlas for retention purge and swipe reader

EOF
)"
```

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Hard delete >7 days | 1 |
| Ingest-key purge + batches | 1 |
| Public filter / old id 404 | 2 |
| Config `ArticleRetention__Days` | 1, 3 |
| Daily Render cron | 3 |
| Infinite scroll polish | 4 |
| Immersive dark vertical pager | 6 |
| Coach until first swipe | 5, 6 |
| Prefetch with feed filters | 6 |
| End “caught up” (feed + reader) | 4, 6 |
| Tests API + app | 1, 2, 4, 5, 6 |
| Atlas 02/03/06/08 | 7 |
| Shared-types if OpenAPI changes | 3 |

## Placeholder / consistency notes

- Entity uses `IngestedAt` not `CreatedAt` for non-published age — documented in Global Constraints.
- Trending already had a 7-day publish ceiling; Task 2 unifies it with retention options.
- Full-article `body` reader is out of scope (separate spec).
