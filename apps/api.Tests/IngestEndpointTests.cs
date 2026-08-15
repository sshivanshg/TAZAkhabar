using System.Net;
using System.Net.Http.Headers;
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
    public async Task IngestScrape_StoresPendingReview_And_PublicFeedRequiresAdminPublish()
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

        int articleId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var article = await db.Articles.SingleAsync(a => a.SourceUrl == storyUrl);
            articleId = article.Id;
            Assert.Equal(ArticleStatus.PendingReview, article.Status);
            Assert.Equal(SourceType.Scrape, (await db.Sources.SingleAsync(s => s.Id == article.SourceId)).Type);
        }

        var publicBefore = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        Assert.DoesNotContain(publicBefore!.Items, a => a.Id == articleId);

        var login = await client.PostAsJsonAsync("/api/admin/login", new
        {
            password = NewsFeedWebApplicationFactory.TestAdminPassword,
            displayName = "Editor One",
        });
        login.EnsureSuccessStatusCode();
        var token = (await login.Content.ReadFromJsonAsync<AdminLoginResponse>(TestJson.Options))!.Token;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var publish = await client.PostAsync($"/api/admin/articles/{articleId}/publish", null);
        Assert.Equal(HttpStatusCode.OK, publish.StatusCode);

        var publicAfter = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        Assert.Contains(publicAfter!.Items, a => a.Id == articleId);
    }

    [Fact]
    public async Task IngestDaily_ValidKey_IngestsAllActiveSourcesWithoutSummarizing()
    {
        const string listUrl = "https://www.amarujala.com/uttar-pradesh/jhansi-daily";
        const string storyUrl = "https://www.amarujala.com/city/story-ingest-daily";
        var feed = new FakeRssFeedClient
        {
            Responses =
            {
                [FeedUrl] = """
                    <?xml version="1.0"?><rss version="2.0"><channel>
                      <item>
                        <title>Jhansi daily RSS update</title>
                        <link>https://www.amarujala.com/jhansi/story-ingest-daily-rss</link>
                        <description>Feed supplied summary</description>
                        <pubDate>Thu, 13 Aug 2026 04:17:33 +0530</pubDate>
                      </item>
                    </channel></rss>
                    """,
            },
        };
        var scrape = new FakeScrapeHttpClient
        {
            Responses =
            {
                [listUrl] = """
                    <html><body><ul>
                      <li><a href="/city/story-ingest-daily">Triggered daily scrape story</a></li>
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
                foreach (var descriptor in services.Where(d => d.ServiceType == typeof(IRssFeedClient)).ToList())
                {
                    services.Remove(descriptor);
                }

                foreach (var descriptor in services.Where(d => d.ServiceType == typeof(IScrapeHttpClient)).ToList())
                {
                    services.Remove(descriptor);
                }

                services.AddSingleton<IRssFeedClient>(feed);
                services.AddSingleton<IScrapeHttpClient>(scrape);
            });
        });

        var client = factory.CreateClient();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureDeleted();
            db.Database.EnsureCreated();
            db.Sources.RemoveRange(db.Sources);
            db.Sources.AddRange(
                new NewsFeed.Api.Data.Entities.Source
                {
                    Name = "RSS Source",
                    FeedUrl = FeedUrl,
                    CityId = 2,
                    Type = SourceType.Rss,
                    Kind = SourceKind.CityEdition,
                    Language = "hi",
                    IsActive = true,
                },
                new NewsFeed.Api.Data.Entities.Source
                {
                    Name = "Scrape Source",
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
        var response = await client.PostAsync("/api/ingest/daily", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<IngestRunResponse>();
        Assert.Equal(2, body!.FeedsAttempted);
        Assert.Equal(2, body.Inserted);

        var fake = (FakeArticleIntelligence)factory.Services.GetRequiredService<IArticleIntelligence>();
        Assert.Equal(0, fake.SummarizeCallCount);

        using var verifyScope = factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var rssArticle = await verifyDb.Articles.SingleAsync(a => a.SourceUrl.Contains("daily-rss"));
        Assert.Equal("Feed supplied summary", rssArticle.Summary);
    }

    [Fact]
    public async Task OpenApi_IncludesBackfillBodiesAndArticleBody()
    {
        var client = _factory.CreateClient();
        var json = await client.GetStringAsync("/openapi/v1.json");
        Assert.Contains("/api/ingest/daily", json, StringComparison.Ordinal);
        Assert.Contains("IngestDaily", json, StringComparison.Ordinal);
        Assert.Contains("/api/ingest/backfill-bodies", json, StringComparison.Ordinal);
        Assert.Contains("ArticleBodyBackfillResponse", json, StringComparison.Ordinal);
        Assert.Contains("IngestBackfillBodies", json, StringComparison.Ordinal);
        Assert.Contains("\"body\"", json, StringComparison.Ordinal);
    }
}
