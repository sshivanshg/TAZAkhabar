using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Ingest;
using NewsFeed.Api.Options;

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
    public async Task Inserts_CityEdition_And_Skips_DuplicateUrl()
    {
        await using var db = CreateDb();
        var client = new FakeRssFeedClient
        {
            Responses =
            {
                [CityFeedUrl] = CityEditionXml(CityItemUrl, "Jhansi municipal budget", "Nagar nigam session"),
            },
        };
        var service = CreateService(db, client, CityEditionFeed(CityFeedUrl));

        var first = await service.RunAsync(CancellationToken.None);
        Assert.Equal(1, first.Inserted);
        Assert.Equal(0, first.FeedsFailed);

        var second = await service.RunAsync(CancellationToken.None);
        Assert.Equal(0, second.Inserted);
        Assert.True(second.Skipped >= 1);

        var stored = Assert.Single(await db.Articles.Where(a => a.CityId == 2).ToListAsync());
        Assert.Equal("Jhansi municipal budget", stored.Headline);
        Assert.Equal("Nagar nigam session", stored.Summary);
        Assert.Equal(CityItemUrl, stored.SourceUrl);
        Assert.Equal("Local", stored.Category);
        Assert.Equal("Amar Ujala", stored.SourceName);
    }

    [Fact]
    public async Task WiderFeed_KeepsOrchha_DropsLucknowOnly()
    {
        await using var db = CreateDb();
        var client = new FakeRssFeedClient
        {
            Responses =
            {
                [WiderFeedUrl] = WiderFeedXml(),
            },
        };
        var service = CreateService(db, client, new RssFeedConfig
        {
            SourceName = "Amar Ujala",
            Url = WiderFeedUrl,
            Language = "hi",
            Kind = RssFeedKind.Wider,
            CitySlug = "jhansi",
        });

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
    public async Task FailedFeed_DoesNotBlock_HealthyFeed()
    {
        await using var db = CreateDb();
        var client = new FakeRssFeedClient
        {
            Responses =
            {
                [DeadFeedUrl] = null,
                [HealthyFeedUrl] = CityEditionXml(CityItemUrl, "Jhansi municipal budget", "Nagar nigam session"),
            },
        };
        var service = CreateService(
            db,
            client,
            CityEditionFeed(DeadFeedUrl),
            CityEditionFeed(HealthyFeedUrl));

        var result = await service.RunAsync(CancellationToken.None);

        Assert.Equal(2, result.FeedsAttempted);
        Assert.Equal(1, result.FeedsFailed);
        Assert.Equal(1, result.Inserted);
        Assert.Equal(CityItemUrl, Assert.Single(await db.Articles.ToListAsync()).SourceUrl);
    }

    [Fact]
    public async Task CancelledRun_DoesNotCountAsFeedsFailed()
    {
        await using var db = CreateDb();
        var client = new FakeRssFeedClient
        {
            Responses =
            {
                [CityFeedUrl] = CityEditionXml(CityItemUrl, "Jhansi municipal budget", "Nagar nigam session"),
            },
        };
        var service = CreateService(db, client, CityEditionFeed(CityFeedUrl));
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAsync<OperationCanceledException>(() => service.RunAsync(cts.Token));

        Assert.Empty(await db.Articles.ToListAsync());
    }

    [Fact]
    public async Task InvalidArticleUrl_IsNotStored()
    {
        await using var db = CreateDb();
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
        var service = CreateService(db, client, CityEditionFeed(CityFeedUrl));

        var result = await service.RunAsync(CancellationToken.None);

        Assert.Equal(0, result.Inserted);
        Assert.Equal(0, result.FeedsFailed);
        Assert.Empty(await db.Articles.ToListAsync());
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

    private static RssIngestService CreateService(
        AppDbContext db,
        FakeRssFeedClient client,
        params RssFeedConfig[] feeds)
    {
        var options = Microsoft.Extensions.Options.Options.Create(new RssIngestOptions
        {
            Secret = "test-ingest-key",
            Feeds = [.. feeds],
        });
        return new RssIngestService(db, options, client, NullLogger<RssIngestService>.Instance);
    }

    private static RssFeedConfig CityEditionFeed(string url) => new()
    {
        SourceName = "Amar Ujala",
        Url = url,
        Language = "hi",
        Kind = RssFeedKind.CityEdition,
        CitySlug = "jhansi",
    };

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
