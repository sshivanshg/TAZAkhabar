using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class RssIngestServiceTests
{
    private const string CityFeedUrl = "https://feeds.example.com/jhansi-city.xml";
    private const string WiderFeedUrl = "https://feeds.example.com/up-wider.xml";
    private const string HealthyFeedUrl = "https://feeds.example.com/healthy.xml";
    private const string DeadFeedUrl = "https://feeds.example.com/dead.xml";
    private const string CityItemUrl = "https://www.amarujala.com/jhansi/story-1";
    private const string OrchhaItemUrl = "https://example.com/orchha-story";
    private const string LucknowItemUrl = "https://example.com/lucknow-story";

    [Fact]
    public async Task Inserts_CityEdition_AsPendingReview_And_Skips_DuplicateUrl()
    {
        await using var db = CreateDb();
        var source = await AddSourceAsync(db, "Amar Ujala", CityFeedUrl, SourceKind.CityEdition);
        var client = new FakeRssFeedClient
        {
            Responses =
            {
                [CityFeedUrl] = CityEditionXml(CityItemUrl, "Jhansi municipal budget", "Nagar nigam session"),
            },
        };
        var service = CreateService(db, client);

        var first = await service.RunAsync(CancellationToken.None);
        Assert.Equal(1, first.Inserted);
        Assert.Equal(0, first.FeedsFailed);

        var second = await service.RunAsync(CancellationToken.None);
        Assert.Equal(0, second.Inserted);
        Assert.True(second.Skipped >= 1);

        var stored = Assert.Single(await db.Articles.Where(a => a.CityId == 2).ToListAsync());
        Assert.Equal("Jhansi municipal budget", stored.Headline);
        Assert.Equal("Short original summary for Jhansi municipal budget", stored.Summary);
        Assert.Equal(CityItemUrl, stored.SourceUrl);
        Assert.Equal("Local", stored.Category);
        Assert.Equal("Amar Ujala", stored.SourceName);
        Assert.Equal(ArticleStatus.PendingReview, stored.Status);
        Assert.NotNull(stored.IngestedAt);
        Assert.Equal(source.Id, stored.SourceId);
        Assert.False(stored.IsMock);

        Assert.Equal(2, await db.IngestionRuns.CountAsync(r => r.SourceId == source.Id));
    }

    [Fact]
    public async Task AutoPublishRun_InsertsPublishedArticle_WithoutFetchingBody()
    {
        await using var db = CreateDb();
        await AddSourceAsync(db, "Google News", CityFeedUrl, SourceKind.CityEdition);
        var client = new FakeRssFeedClient
        {
            Responses =
            {
                [CityFeedUrl] = CityEditionXml(CityItemUrl, "Jhansi latest update", "Feed supplied summary"),
            },
        };
        var scrape = new FakeScrapeHttpClient
        {
            Responses =
            {
                [CityItemUrl] = "<html><body><p>This body should not be fetched.</p></body></html>",
            },
        };
        var service = new RssIngestService(
            db,
            client,
            scrape,
            new FakeArticleIntelligence(),
            new IngestionEventBus(),
            new ImageEnrichmentQueue(),
            NullLogger<RssIngestService>.Instance);

        var result = await service.RunAsync(
            CancellationToken.None,
            useIntelligence: false,
            autoPublish: true,
            fetchArticleBodies: false);

        Assert.Equal(1, result.Inserted);
        var stored = Assert.Single(await db.Articles.ToListAsync());
        Assert.Equal(ArticleStatus.Published, stored.Status);
        Assert.Equal("Feed supplied summary", stored.Summary);
        Assert.Null(stored.Body);
    }

    [Fact]
    public async Task WiderFeed_KeepsOrchha_DropsLucknowOnly()
    {
        await using var db = CreateDb();
        await AddSourceAsync(db, "Amar Ujala", WiderFeedUrl, SourceKind.Wider);
        var client = new FakeRssFeedClient
        {
            Responses =
            {
                [WiderFeedUrl] = WiderFeedXml(),
            },
        };
        var service = CreateService(db, client);

        var result = await service.RunAsync(CancellationToken.None);
        Assert.Equal(1, result.Inserted);
        Assert.True(result.Skipped >= 1);

        var jhansi = await db.Articles.Where(a => a.CityId == 2).ToListAsync();
        var stored = Assert.Single(jhansi);
        Assert.Equal(OrchhaItemUrl, stored.SourceUrl);
        Assert.Contains("Orchha", stored.Headline, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(jhansi, a => a.SourceUrl == LucknowItemUrl);
        Assert.False(await db.Articles.AnyAsync(a => a.SourceUrl == LucknowItemUrl));
    }

    [Fact]
    public async Task FailedFeed_DoesNotBlock_HealthyFeed_And_WritesErrorRun()
    {
        await using var db = CreateDb();
        var dead = await AddSourceAsync(db, "Dead", DeadFeedUrl, SourceKind.CityEdition);
        var healthy = await AddSourceAsync(db, "Healthy", HealthyFeedUrl, SourceKind.CityEdition);
        var client = new FakeRssFeedClient
        {
            Responses =
            {
                [DeadFeedUrl] = null,
                [HealthyFeedUrl] = CityEditionXml(CityItemUrl, "Jhansi municipal budget", "Nagar nigam session"),
            },
        };
        var service = CreateService(db, client);

        var result = await service.RunAsync(CancellationToken.None);

        Assert.Equal(2, result.FeedsAttempted);
        Assert.Equal(1, result.FeedsFailed);
        Assert.Equal(1, result.Inserted);
        Assert.Equal(CityItemUrl, Assert.Single(await db.Articles.ToListAsync()).SourceUrl);

        var deadRun = Assert.Single(await db.IngestionRuns.Where(r => r.SourceId == dead.Id).ToListAsync());
        Assert.True(deadRun.ArticlesFailed >= 1);
        Assert.Equal(IngestErrorClassifier.FetchFailed, deadRun.ErrorSummary);
        Assert.DoesNotContain(DeadFeedUrl, deadRun.ErrorSummary);
        Assert.NotNull(deadRun.CompletedAt);

        await db.Entry(dead).ReloadAsync();
        Assert.Equal(FetchStatus.Error, dead.LastFetchStatus);

        Assert.Single(await db.IngestionRuns.Where(r => r.SourceId == healthy.Id).ToListAsync());
    }

    [Fact]
    public async Task RunAsync_PrioritizesNeverFetchedSources()
    {
        await using var db = CreateDb();
        var recent = await AddSourceAsync(db, "Recent", HealthyFeedUrl, SourceKind.CityEdition);
        recent.LastFetchedAt = DateTimeOffset.UtcNow;
        var never = await AddSourceAsync(db, "Never", CityFeedUrl, SourceKind.CityEdition);
        await db.SaveChangesAsync();
        var client = new FakeRssFeedClient
        {
            Responses =
            {
                [CityFeedUrl] = CityEditionXml(CityItemUrl, "Jhansi municipal budget", "Nagar nigam session"),
                [HealthyFeedUrl] = CityEditionXml(
                    "https://www.amarujala.com/jhansi/story-recent",
                    "Recent source story",
                    "Recent source summary"),
            },
        };
        var service = CreateService(db, client);

        await service.RunAsync(CancellationToken.None);

        var firstRun = await db.IngestionRuns.OrderBy(r => r.Id).FirstAsync();
        Assert.Equal(never.Id, firstRun.SourceId);
    }

    [Fact]
    public async Task RunAsync_MaxSources_LimitsBatchSize()
    {
        await using var db = CreateDb();
        await AddSourceAsync(db, "One", "https://feeds.example.com/one.xml", SourceKind.CityEdition);
        await AddSourceAsync(db, "Two", "https://feeds.example.com/two.xml", SourceKind.CityEdition);
        await AddSourceAsync(db, "Three", "https://feeds.example.com/three.xml", SourceKind.CityEdition);
        var client = new FakeRssFeedClient
        {
            Responses =
            {
                ["https://feeds.example.com/one.xml"] = CityEditionXml(
                    "https://example.com/one",
                    "One story",
                    "One summary"),
                ["https://feeds.example.com/two.xml"] = CityEditionXml(
                    "https://example.com/two",
                    "Two story",
                    "Two summary"),
                ["https://feeds.example.com/three.xml"] = CityEditionXml(
                    "https://example.com/three",
                    "Three story",
                    "Three summary"),
            },
        };
        var service = CreateService(db, client);

        var result = await service.RunAsync(CancellationToken.None, maxSources: 2);

        Assert.Equal(2, result.FeedsAttempted);
        Assert.Equal(2, await db.IngestionRuns.CountAsync());
    }

    [Fact]
    public async Task CancelledRun_DoesNotCountAsFeedsFailed()
    {
        await using var db = CreateDb();
        await AddSourceAsync(db, "Amar Ujala", CityFeedUrl, SourceKind.CityEdition);
        var client = new FakeRssFeedClient
        {
            Responses =
            {
                [CityFeedUrl] = CityEditionXml(CityItemUrl, "Jhansi municipal budget", "Nagar nigam session"),
            },
        };
        var service = CreateService(db, client);
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAsync<OperationCanceledException>(() => service.RunAsync(cts.Token));

        Assert.Empty(await db.Articles.ToListAsync());
    }

    [Fact]
    public async Task InvalidArticleUrl_IsNotStored()
    {
        await using var db = CreateDb();
        await AddSourceAsync(db, "Amar Ujala", CityFeedUrl, SourceKind.CityEdition);
        var client = new FakeRssFeedClient
        {
            Responses =
            {
                [CityFeedUrl] = """
                    <?xml version="1.0"?><rss version="2.0"><channel>
                      <item>
                        <title>Guid is not a url</title>
                        <guid isPermaLink="false">abc-not-a-url</guid>
                      </item>
                    </channel></rss>
                    """,
            },
        };
        var service = CreateService(db, client);

        var result = await service.RunAsync(CancellationToken.None);

        Assert.Equal(0, result.Inserted);
        Assert.Equal(0, result.FeedsFailed);
        Assert.Empty(await db.Articles.ToListAsync());
    }

    [Fact]
    public async Task IgnoresInactiveSources()
    {
        await using var db = CreateDb();
        var inactive = await AddSourceAsync(db, "Off", CityFeedUrl, SourceKind.CityEdition, isActive: false);
        var client = new FakeRssFeedClient
        {
            Responses =
            {
                [CityFeedUrl] = CityEditionXml(CityItemUrl, "Jhansi municipal budget", "Nagar nigam session"),
            },
        };
        var service = CreateService(db, client);

        var result = await service.RunAsync(CancellationToken.None);
        Assert.Equal(0, result.FeedsAttempted);
        Assert.Empty(await db.Articles.ToListAsync());
        Assert.Empty(await db.IngestionRuns.Where(r => r.SourceId == inactive.Id).ToListAsync());
    }

    [Fact]
    public async Task Skips_EpaperEditionItems()
    {
        await using var db = CreateDb();
        await AddSourceAsync(db, "Amar Ujala", CityFeedUrl, SourceKind.CityEdition);
        const string epaperUrl = "https://epaper.amarujala.com/delhi-city/20260827/01.html?format=img&ed_code=delhi-city";
        var client = new FakeRssFeedClient
        {
            Responses =
            {
                [CityFeedUrl] = $"""
                    <?xml version="1.0"?><rss version="2.0"><channel>
                      <item>
                        <title>Amar Ujala epaper Delhi</title>
                        <link>https://epaper.amarujala.com/delhi-city/20260827/01.html?format=img&amp;ed_code=delhi-city</link>
                        <description>Today's paper</description>
                      </item>
                      <item>
                        <title>Jhansi municipal budget</title>
                        <link>{CityItemUrl}</link>
                        <description>Nagar nigam session</description>
                      </item>
                    </channel></rss>
                    """,
            },
        };
        var service = CreateService(db, client);

        var result = await service.RunAsync(CancellationToken.None);

        Assert.Equal(1, result.Inserted);
        Assert.True(result.Skipped >= 1);
        var stored = Assert.Single(await db.Articles.ToListAsync());
        Assert.Equal(CityItemUrl, stored.SourceUrl);
        Assert.False(await db.Articles.AnyAsync(a => a.SourceUrl == epaperUrl));
    }

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"rss-ingest-{Guid.NewGuid():N}")
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

    private static async Task<Source> AddSourceAsync(
        AppDbContext db,
        string name,
        string feedUrl,
        SourceKind kind,
        bool isActive = true)
    {
        var source = new Source
        {
            Name = name,
            FeedUrl = feedUrl,
            CityId = 2,
            Type = SourceType.Rss,
            Kind = kind,
            Language = "hi",
            IsActive = isActive,
        };
        db.Sources.Add(source);
        await db.SaveChangesAsync();
        return source;
    }

    private static RssIngestService CreateService(AppDbContext db, FakeRssFeedClient client) =>
        new(db, client, new FakeScrapeHttpClient(), new FakeArticleIntelligence(), new IngestionEventBus(), new ImageEnrichmentQueue(), NullLogger<RssIngestService>.Instance);

    private static string CityEditionXml(string itemUrl, string title, string description) => $"""
        <?xml version="1.0"?><rss version="2.0"><channel>
          <item>
            <title>{title}</title>
            <link>{itemUrl}</link>
            <description>{description}</description>
            <pubDate>Thu, 13 Aug 2026 04:17:33 +0530</pubDate>
            <source url="https://www.amarujala.com">Amar Ujala</source>
          </item>
        </channel></rss>
        """;

    private static string WiderFeedXml() => $"""
        <?xml version="1.0"?><rss version="2.0"><channel>
          <item>
            <title>PWD pause near Orchha junction</title>
            <link>{OrchhaItemUrl}</link>
            <description>state road works</description>
          </item>
          <item>
            <title>Gomti walkway lighting in Lucknow</title>
            <link>{LucknowItemUrl}</link>
            <description>capital news</description>
          </item>
        </channel></rss>
        """;
}
