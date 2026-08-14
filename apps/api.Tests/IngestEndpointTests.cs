using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NewsFeed.Api.Data;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class IngestEndpointTests : IClassFixture<NewsFeedWebApplicationFactory>
{
    private const string FeedUrl = "https://feeds.example.com/jhansi-city.xml";

    private readonly NewsFeedWebApplicationFactory _factory;

    public IngestEndpointTests(NewsFeedWebApplicationFactory factory)
    {
        _factory = factory;
    }

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
    public async Task IngestRss_EmptySecret_Returns401()
    {
        using var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("RssIngest:Secret", "");
        });

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Ingest-Key", NewsFeedWebApplicationFactory.TestIngestKey);
        var response = await client.PostAsync("/api/ingest/rss", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task IngestScrape_MissingKey_Returns401()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.PostAsync("/api/ingest/scrape", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task IngestRss_ValidKey_ReturnsCounts()
    {
        var fake = new FakeRssFeedClient
        {
            Responses =
            {
                [FeedUrl] = """
                    <?xml version="1.0"?><rss version="2.0"><channel>
                      <item>
                        <title>Jhansi municipal budget</title>
                        <link>https://www.amarujala.com/jhansi/story-ingest-endpoint</link>
                        <description>Nagar nigam session</description>
                        <pubDate>Thu, 13 Aug 2026 04:17:33 +0530</pubDate>
                        <source url="https://www.amarujala.com">Amar Ujala</source>
                      </item>
                    </channel></rss>
                    """,
            },
        };

        using var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                foreach (var descriptor in services.Where(d => d.ServiceType == typeof(IRssFeedClient)).ToList())
                {
                    services.Remove(descriptor);
                }

                services.AddSingleton<IRssFeedClient>(fake);
            });
        });

        var client = factory.CreateClient();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureDeleted();
            db.Database.EnsureCreated();
            // Replace seed sources with a single test feed URL the fake client serves.
            db.Sources.RemoveRange(db.Sources);
            db.Sources.Add(new NewsFeed.Api.Data.Entities.Source
            {
                Name = "Amar Ujala",
                FeedUrl = FeedUrl,
                CityId = 2,
                Type = SourceType.Rss,
                Kind = SourceKind.CityEdition,
                Language = "hi",
                IsActive = true,
            });
            db.SaveChanges();
        }

        client.DefaultRequestHeaders.Add("X-Ingest-Key", NewsFeedWebApplicationFactory.TestIngestKey);
        var response = await client.PostAsync("/api/ingest/rss", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<IngestRunResponse>();
        Assert.True(body!.Inserted >= 1);
    }

    [Fact]
    public async Task IngestScrape_ValidKey_ReturnsCounts()
    {
        const string listUrl = "https://www.amarujala.com/uttar-pradesh/jhansi-ingest";
        const string storyUrl = "https://www.amarujala.com/city/story-ingest-scrape";
        var fake = new FakeScrapeHttpClient
        {
            Responses =
            {
                [listUrl] = """
                    <html><body><ul>
                      <li><a href="/city/story-ingest-scrape">Triggered scrape story</a></li>
                    </ul></body></html>
                    """,
                [storyUrl] = File.ReadAllText(
                    Path.Combine(AppContext.BaseDirectory, "Fixtures", "scrape-article.html")),
            },
        };

        using var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                foreach (var descriptor in services.Where(d => d.ServiceType == typeof(IScrapeHttpClient)).ToList())
                {
                    services.Remove(descriptor);
                }

                services.AddSingleton<IScrapeHttpClient>(fake);
            });
        });

        var client = factory.CreateClient();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureDeleted();
            db.Database.EnsureCreated();
            db.Sources.RemoveRange(db.Sources);
            db.Sources.Add(new NewsFeed.Api.Data.Entities.Source
            {
                Name = "Amar Ujala",
                FeedUrl = listUrl,
                CityId = 2,
                Type = SourceType.Scrape,
                Kind = SourceKind.CityEdition,
                Language = "hi",
                IsActive = true,
            });
            db.SaveChanges();
        }

        client.DefaultRequestHeaders.Add("X-Ingest-Key", NewsFeedWebApplicationFactory.TestIngestKey);
        var response = await client.PostAsync("/api/ingest/scrape", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<IngestRunResponse>();
        Assert.True(body!.FeedsAttempted >= 1);
        Assert.True(body.Inserted >= 1);
    }

    [Fact]
    public async Task OpenApi_IncludesBackfillBodiesAndArticleBody()
    {
        var client = _factory.CreateClient();
        var json = await client.GetStringAsync("/openapi/v1.json");
        Assert.Contains("/api/ingest/backfill-bodies", json, StringComparison.Ordinal);
        Assert.Contains("ArticleBodyBackfillResponse", json, StringComparison.Ordinal);
        Assert.Contains("IngestBackfillBodies", json, StringComparison.Ordinal);
        Assert.Contains("\"body\"", json, StringComparison.Ordinal);
    }
}
