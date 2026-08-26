using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Ingest;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Tests;

public sealed class ScrapeIngestServiceTests
{
    private const string ListUrl = "https://www.amarujala.com/uttar-pradesh/jhansi";
    private const string Story1Url = "https://www.amarujala.com/city/story-1";
    private const string Story2Url = "https://www.amarujala.com/city/story-2";
    private const string Story3Url = "https://www.amarujala.com/city/story-3";

    [Fact]
    public async Task Inserts_Published_Article_And_Skips_DuplicateUrl()
    {
        await using var db = CreateDb();
        var source = await AddScrapeSourceAsync(db, "Amar Ujala Jhansi", ListUrl);
        var http = new FakeScrapeHttpClient
        {
            Responses =
            {
                [ListUrl] = """
                    <html><body><ul>
                      <li><a href="/city/story-1">Story one</a></li>
                    </ul></body></html>
                    """,
                [Story1Url] = File.ReadAllText(FixturePath("scrape-article.html")),
            },
        };
        var service = CreateService(db, http);

        var first = await service.RunSourceAsync(source.Id, CancellationToken.None);
        Assert.Equal(1, first.ArticlesFound);
        Assert.Equal(1, first.ArticlesAdded);
        Assert.Equal(0, first.ArticlesSkipped);
        Assert.Equal(0, first.ArticlesFailed);
        Assert.Null(first.ErrorSummary);
        Assert.NotNull(first.CompletedAt);

        var stored = Assert.Single(await db.Articles.ToListAsync());
        Assert.Equal("Jhansi water supply restored", stored.Headline);
        Assert.Contains("piped water", stored.Summary, StringComparison.Ordinal);
        Assert.Contains("piped water", stored.Body, StringComparison.Ordinal);
        Assert.Contains("restored pressure", stored.Body, StringComparison.Ordinal);
        Assert.Equal(Story1Url, stored.SourceUrl);
        Assert.Equal("Amar Ujala Jhansi", stored.SourceName);
        Assert.Equal(2, stored.CityId);
        Assert.Equal("Local", stored.Category);
        Assert.Equal(ArticleStatus.Published, stored.Status);
        Assert.False(stored.IsMock);
        Assert.Equal(source.Id, stored.SourceId);
        Assert.NotNull(stored.IngestedAt);
        Assert.Equal(new DateTimeOffset(2026, 8, 24, 4, 30, 0, TimeSpan.Zero), stored.PublishedAt);

        await db.Entry(source).ReloadAsync();
        Assert.Equal(FetchStatus.Success, source.LastFetchStatus);
        Assert.NotNull(source.LastFetchedAt);
        Assert.Null(source.LastErrorMessage);

        var second = await service.RunSourceAsync(source.Id, CancellationToken.None);
        Assert.Equal(0, second.ArticlesAdded);
        Assert.True(second.ArticlesSkipped >= 1);
        Assert.Equal(1, await db.Articles.CountAsync());
        Assert.Equal(2, await db.IngestionRuns.CountAsync(r => r.SourceId == source.Id));
    }

    [Fact]
    public async Task RewriteOn_StoresRewriterOutput_AsPublished()
    {
        await using var db = CreateDb();
        var source = await AddScrapeSourceAsync(db, "Amar Ujala Jhansi", ListUrl);
        var http = new FakeScrapeHttpClient
        {
            Responses =
            {
                [ListUrl] = """
                    <html><body><ul>
                      <li><a href="/city/story-1">Story one</a></li>
                    </ul></body></html>
                    """,
                [Story1Url] = File.ReadAllText(FixturePath("scrape-article.html")),
            },
        };
        var rewriter = new FakeArticleRewriter();
        var service = CreateService(db, http, rewriter);

        var run = await service.RunSourceAsync(source.Id, CancellationToken.None, useRewrite: true);

        Assert.Equal(1, run.ArticlesAdded);
        Assert.Equal(1, rewriter.RewriteCallCount);
        var stored = Assert.Single(await db.Articles.ToListAsync());
        Assert.Equal("Rewritten: Jhansi water supply restored", stored.Headline);
        Assert.Equal("Original digest summary for Jhansi water supply restored.", stored.Summary);
        Assert.Contains("Original digest body for Jhansi water supply restored.", stored.Body, StringComparison.Ordinal);
        Assert.Equal(ArticleStatus.Published, stored.Status);
        Assert.Equal(Story1Url, stored.SourceUrl);
    }

    [Fact]
    public async Task RewriteThrows_FallsBackToExtract_AndStaysPublished()
    {
        await using var db = CreateDb();
        var source = await AddScrapeSourceAsync(db, "Amar Ujala Jhansi", ListUrl);
        var http = new FakeScrapeHttpClient
        {
            Responses =
            {
                [ListUrl] = """
                    <html><body><ul>
                      <li><a href="/city/story-1">Story one</a></li>
                    </ul></body></html>
                    """,
                [Story1Url] = File.ReadAllText(FixturePath("scrape-article.html")),
            },
        };
        var rewriter = new FakeArticleRewriter
        {
            ThrowOnRewrite = new InvalidOperationException("OpenAI down"),
        };
        var service = CreateService(db, http, rewriter);

        var run = await service.RunSourceAsync(source.Id, CancellationToken.None, useRewrite: true);

        Assert.Equal(1, run.ArticlesAdded);
        Assert.Equal(1, rewriter.RewriteCallCount);
        var stored = Assert.Single(await db.Articles.ToListAsync());
        Assert.Equal("Jhansi water supply restored", stored.Headline);
        Assert.Contains("piped water", stored.Summary, StringComparison.Ordinal);
        Assert.Contains("piped water", stored.Body, StringComparison.Ordinal);
        Assert.Equal(ArticleStatus.Published, stored.Status);
    }

    [Fact]
    public async Task UseRewriteFalse_NeverCallsRewriter()
    {
        await using var db = CreateDb();
        var source = await AddScrapeSourceAsync(db, "Amar Ujala Jhansi", ListUrl);
        var http = new FakeScrapeHttpClient
        {
            Responses =
            {
                [ListUrl] = """
                    <html><body><ul>
                      <li><a href="/city/story-1">Story one</a></li>
                    </ul></body></html>
                    """,
                [Story1Url] = File.ReadAllText(FixturePath("scrape-article.html")),
            },
        };
        var rewriter = new FakeArticleRewriter();
        var service = CreateService(db, http, rewriter);

        var run = await service.RunSourceAsync(source.Id, CancellationToken.None, useRewrite: false);

        Assert.Equal(1, run.ArticlesAdded);
        Assert.Equal(0, rewriter.RewriteCallCount);
        var stored = Assert.Single(await db.Articles.ToListAsync());
        Assert.Equal("Jhansi water supply restored", stored.Headline);
        Assert.Contains("piped water", stored.Summary, StringComparison.Ordinal);
    }

    [Fact]
    public async Task EnvEnabledFalse_StoresExtract_AndNeverCallsRewriter()
    {
        await using var db = CreateDb();
        var source = await AddScrapeSourceAsync(db, "Amar Ujala Jhansi", ListUrl);
        var http = new FakeScrapeHttpClient
        {
            Responses =
            {
                [ListUrl] = """
                    <html><body><ul>
                      <li><a href="/city/story-1">Story one</a></li>
                    </ul></body></html>
                    """,
                [Story1Url] = File.ReadAllText(FixturePath("scrape-article.html")),
            },
        };
        var rewriter = new FakeArticleRewriter();
        var service = CreateService(
            db,
            http,
            rewriter,
            new OpenAiRewriteOptions { Enabled = false, ApiKey = "present-but-disabled" });

        var run = await service.RunSourceAsync(source.Id, CancellationToken.None, useRewrite: true);

        Assert.Equal(1, run.ArticlesAdded);
        Assert.Equal(0, rewriter.RewriteCallCount);
        var stored = Assert.Single(await db.Articles.ToListAsync());
        Assert.Equal("Jhansi water supply restored", stored.Headline);
        Assert.Contains("piped water", stored.Summary, StringComparison.Ordinal);
        Assert.Contains("piped water", stored.Body, StringComparison.Ordinal);
        Assert.Equal(ArticleStatus.Published, stored.Status);
    }

    [Fact]
    public async Task UnmappedArticle_DoesNotAbort_OtherInserts()
    {
        await using var db = CreateDb();
        var source = await AddScrapeSourceAsync(db, "Amar Ujala Jhansi", ListUrl);
        var http = CreateFixtureClient(mapAllStories: false);
        var service = CreateService(db, http);

        var run = await service.RunSourceAsync(source.Id, CancellationToken.None);

        Assert.Equal(1, run.ArticlesAdded);
        Assert.Equal(2, run.ArticlesFailed);
        Assert.Equal(FetchStatus.Success, (await db.Sources.SingleAsync(s => s.Id == source.Id)).LastFetchStatus);
        Assert.Equal(Story1Url, Assert.Single(await db.Articles.ToListAsync()).SourceUrl);
    }

    [Fact]
    public async Task RunAllActive_IgnoresInactiveAndNonScrape()
    {
        await using var db = CreateDb();
        var inactive = await AddScrapeSourceAsync(db, "Off", ListUrl, isActive: false);
        await AddSourceAsync(db, "RSS", ListUrl, SourceType.Rss);
        var http = CreateFixtureClient(mapAllStories: true);
        var service = CreateService(db, http);

        var result = await service.RunAllActiveAsync(CancellationToken.None);

        Assert.Equal(0, result.FeedsAttempted);
        Assert.Empty(await db.Articles.ToListAsync());
        Assert.Empty(await db.IngestionRuns.Where(r => r.SourceId == inactive.Id).ToListAsync());
    }

    [Fact]
    public async Task InvalidFeedUrl_FailsRun()
    {
        await using var db = CreateDb();
        var source = await AddScrapeSourceAsync(db, "Localhost", "http://127.0.0.1/city");
        var service = CreateService(db, new FakeScrapeHttpClient());

        var run = await service.RunSourceAsync(source.Id, CancellationToken.None);

        Assert.True(run.ArticlesFailed >= 1);
        Assert.Equal(IngestErrorClassifier.InvalidSourceUrl, run.ErrorSummary);
        Assert.DoesNotContain("127.0.0.1", run.ErrorSummary);
        Assert.Empty(await db.Articles.ToListAsync());
        await db.Entry(source).ReloadAsync();
        Assert.Equal(FetchStatus.Error, source.LastFetchStatus);
    }

    [Fact]
    public async Task ZeroLinks_FailsRun()
    {
        await using var db = CreateDb();
        var source = await AddScrapeSourceAsync(db, "Empty", ListUrl);
        var http = new FakeScrapeHttpClient
        {
            Responses =
            {
                [ListUrl] = "<html><body><p>No stories</p></body></html>",
            },
        };
        var service = CreateService(db, http);

        var run = await service.RunSourceAsync(source.Id, CancellationToken.None);

        Assert.Equal(0, run.ArticlesFound);
        Assert.True(run.ArticlesFailed >= 1);
        Assert.Equal(IngestErrorClassifier.NoArticlesFound, run.ErrorSummary);
        Assert.DoesNotContain(ListUrl, run.ErrorSummary);
        Assert.Empty(await db.Articles.ToListAsync());
        await db.Entry(source).ReloadAsync();
        Assert.Equal(FetchStatus.Error, source.LastFetchStatus);
    }

    [Fact]
    public async Task ListFetchException_StoresSanitizedErrorSummary()
    {
        await using var db = CreateDb();
        var source = await AddScrapeSourceAsync(db, "Missing fixture", ListUrl);
        var service = CreateService(db, new FakeScrapeHttpClient());

        var run = await service.RunSourceAsync(source.Id, CancellationToken.None);

        Assert.Equal(IngestErrorClassifier.FetchFailed, run.ErrorSummary);
        Assert.DoesNotContain(ListUrl, run.ErrorSummary);
        Assert.DoesNotContain("fixture", run.ErrorSummary, StringComparison.OrdinalIgnoreCase);
        Assert.Empty(await db.Articles.ToListAsync());
    }

    private static FakeScrapeHttpClient CreateFixtureClient(bool mapAllStories)
    {
        var articleHtml = File.ReadAllText(FixturePath("scrape-article.html"));
        var http = new FakeScrapeHttpClient
        {
            Responses =
            {
                [ListUrl] = File.ReadAllText(FixturePath("scrape-list.html")),
                [Story1Url] = articleHtml,
            },
        };
        if (mapAllStories)
        {
            http.Responses[Story2Url] = articleHtml;
            http.Responses[Story3Url] = articleHtml;
        }

        return http;
    }

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"scrape-ingest-{Guid.NewGuid():N}")
            .Options;
        var db = new AppDbContext(options);
        db.Cities.AddRange(SeedData.Cities.Select(c => new City
        {
            Id = c.Id,
            Name = c.Name,
            State = c.State,
            Slug = c.Slug,
        }));
        db.SaveChanges();
        return db;
    }

    private static Task<Source> AddScrapeSourceAsync(
        AppDbContext db,
        string name,
        string feedUrl,
        bool isActive = true) =>
        AddSourceAsync(db, name, feedUrl, SourceType.Scrape, isActive);

    private static async Task<Source> AddSourceAsync(
        AppDbContext db,
        string name,
        string feedUrl,
        SourceType type,
        bool isActive = true)
    {
        var source = new Source
        {
            Name = name,
            FeedUrl = feedUrl,
            CityId = 2,
            Type = type,
            Kind = SourceKind.CityEdition,
            Language = "hi",
            IsActive = isActive,
        };
        db.Sources.Add(source);
        await db.SaveChangesAsync();
        return source;
    }

    private static ScrapeIngestService CreateService(
        AppDbContext db,
        FakeScrapeHttpClient http,
        IArticleRewriter? rewriter = null,
        OpenAiRewriteOptions? rewriteOptions = null) =>
        new(
            db,
            http,
            rewriter ?? new FakeArticleRewriter { Handler = (_, _, _) => null },
            Microsoft.Extensions.Options.Options.Create(rewriteOptions ?? new OpenAiRewriteOptions()),
            new IngestionEventBus(),
            new ImageEnrichmentQueue(),
            NullLogger<ScrapeIngestService>.Instance,
            TimeSpan.Zero);

    private static string FixturePath(string fileName) =>
        Path.Combine(AppContext.BaseDirectory, "Fixtures", fileName);
}
