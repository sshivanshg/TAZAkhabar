using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Tests;

public sealed class FeedSectionsEndpointTests : IClassFixture<TazaKhabarWebApplicationFactory>
{
    private readonly TazaKhabarWebApplicationFactory _factory;

    public FeedSectionsEndpointTests(TazaKhabarWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Sections_RequiresKnownCity()
    {
        var client = _factory.CreateSeededClient();

        Assert.Equal(
            HttpStatusCode.BadRequest,
            (await client.GetAsync("/api/articles/sections")).StatusCode);
        Assert.Equal(
            HttpStatusCode.BadRequest,
            (await client.GetAsync("/api/articles/sections?city=nowhere")).StatusCode);
    }

    [Fact]
    public async Task Sections_ColdStart_DeterministicOrder()
    {
        var client = _factory.CreateSeededClient();
        var ids = new List<int>();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var categories = new[]
            {
                "Local", "Health", "Sports", "Local", "Health", "Sports", "Local", "Health", "Sports",
            };
            for (var i = 0; i < categories.Length; i++)
            {
                var article = Published(
                    $"Section story {i}", $"https://example.com/sec-{i}",
                    hoursAgo: i + 1, category: categories[i]);
                db.Articles.Add(article);
                db.SaveChanges();
                ids.Add(article.Id);
            }
        }

        var response = await client.GetAsync("/api/articles/sections?city=jhansi");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("public, max-age=60", response.Headers.CacheControl?.ToString());

        var feed = await response.Content.ReadFromJsonAsync<FeedSectionsResponse>();
        Assert.NotNull(feed);
        Assert.Equal(9, feed.Total);

        // Cold start ranks newest first; category sections follow their best-ranked story.
        Assert.Equal(["top", "sports", "local", "health"], feed.Sections.Select(s => s.Key).ToArray());
        Assert.Equal(ids.Take(5).ToArray(), feed.Sections[0].Items.Select(i => i.Id).ToArray());
        Assert.Equal([ids[5], ids[8]], feed.Sections[1].Items.Select(i => i.Id).ToArray());
        Assert.Equal([ids[6]], feed.Sections[2].Items.Select(i => i.Id).ToArray());
        Assert.Equal([ids[7]], feed.Sections[3].Items.Select(i => i.Id).ToArray());

        // Same request again → identical section ordering.
        var repeat = await client.GetFromJsonAsync<FeedSectionsResponse>("/api/articles/sections?city=jhansi");
        Assert.NotNull(repeat);
        string Flatten(FeedSectionsResponse value) =>
            string.Join("|", value.Sections.Select(s => $"{s.Key}:{string.Join(",", s.Items.Select(i => i.Id))}"));
        Assert.Equal(Flatten(feed), Flatten(repeat));
    }

    [Fact]
    public async Task Sections_SessionWithHealthViews_GetsHealthSectionFirst()
    {
        var client = _factory.CreateSeededClient();
        int[] healthIds = [];
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var stories = new[]
            {
                Published("Fresh local one", "https://example.com/s-l1", hoursAgo: 1, category: "Local"),
                Published("Fresh local two", "https://example.com/s-l2", hoursAgo: 2, category: "Local"),
                Published("Fresh sports one", "https://example.com/s-s1", hoursAgo: 3, category: "Sports"),
                Published("Health read often", "https://example.com/s-h1", hoursAgo: 4, category: "Health"),
                Published("Fresh sports two", "https://example.com/s-s2", hoursAgo: 5, category: "Sports"),
                Published("Fresh local three", "https://example.com/s-l3", hoursAgo: 6, category: "Local"),
                // Older Health stories the session already opened — affinity comes
                // from these views, but seen demotion keeps them out of the top.
                Published("Health seen older", "https://example.com/s-h2", hoursAgo: 30, category: "Health"),
                Published("Health seen oldest", "https://example.com/s-h3", hoursAgo: 40, category: "Health"),
            };
            db.Articles.AddRange(stories);
            db.SaveChanges();
            healthIds = [stories[6].Id, stories[7].Id];

            db.ArticleViews.AddRange(
                new ArticleView { ArticleId = stories[6].Id, SessionKey = "s1", ViewedAt = DateTimeOffset.UtcNow.AddHours(-2) },
                new ArticleView { ArticleId = stories[6].Id, SessionKey = "s1", ViewedAt = DateTimeOffset.UtcNow.AddHours(-3) },
                new ArticleView { ArticleId = stories[7].Id, SessionKey = "s1", ViewedAt = DateTimeOffset.UtcNow.AddHours(-4) });
            db.SaveChanges();
        }

        var response = await client.GetAsync("/api/articles/sections?city=jhansi&sessionId=s1");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cacheControl = response.Headers.CacheControl?.ToString() ?? string.Empty;
        Assert.Contains("private", cacheControl);
        Assert.Contains("no-store", cacheControl);

        var feed = await response.Content.ReadFromJsonAsync<FeedSectionsResponse>();
        Assert.NotNull(feed);
        Assert.Equal("top", feed.Sections[0].Key);
        // Health affinity lifts the Health section ahead of Local even though
        // Local's best story outside the top is fresher.
        Assert.Equal("health", feed.Sections[1].Key);
        Assert.Equal("Health", feed.Sections[1].Title);
        Assert.Equal("Health", feed.Sections[1].Category);
        Assert.Equal(healthIds, feed.Sections[1].Items.Select(i => i.Id).ToArray());
    }

    [Fact]
    public async Task Sections_OmitsBodyFromItems()
    {
        var client = _factory.CreateSeededClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var article = Published("Body check", "https://example.com/s-body", hoursAgo: 1, category: "Local");
            article.Body = "Full article body that must not appear in section payloads.";
            db.Articles.Add(article);
            db.SaveChanges();
        }

        var feed = await client.GetFromJsonAsync<FeedSectionsResponse>("/api/articles/sections?city=jhansi");

        Assert.NotNull(feed);
        Assert.All(
            feed.Sections.SelectMany(s => s.Items),
            item => Assert.Null(item.Body));
    }

    [Fact]
    public async Task Sections_EmptyCity_ReturnsEmptySections()
    {
        var client = _factory.CreateSeededClient();

        var feed = await client.GetFromJsonAsync<FeedSectionsResponse>("/api/articles/sections?city=emptyville");

        Assert.NotNull(feed);
        Assert.Empty(feed.Sections);
        Assert.Equal(0, feed.Total);
    }

    [Fact]
    public async Task Sections_ContentClassification_MovesMiscategorizedStory()
    {
        var client = _factory.CreateSeededClient();
        int miscategorizedId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var stories = new[]
            {
                Published("Local beat one", "https://example.com/m-l1", hoursAgo: 1, category: "Local"),
                Published("Local beat two", "https://example.com/m-l2", hoursAgo: 2, category: "Local"),
                Published("Local beat three", "https://example.com/m-l3", hoursAgo: 3, category: "Local"),
                Published("Local beat four", "https://example.com/m-l4", hoursAgo: 4, category: "Local"),
                Published("Local beat five", "https://example.com/m-l5", hoursAgo: 5, category: "Local"),
                // Filed under the source's default "Local" but plainly a health story.
                Published("New vaccine drive at district hospital", "https://example.com/m-h1", hoursAgo: 6, category: "Local"),
            };
            db.Articles.AddRange(stories);
            db.SaveChanges();
            miscategorizedId = stories[5].Id;
        }

        var feed = await client.GetFromJsonAsync<FeedSectionsResponse>("/api/articles/sections?city=jhansi");

        Assert.NotNull(feed);
        var health = Assert.Single(feed.Sections.Where(s => s.Key == "health"));
        Assert.Equal([miscategorizedId], health.Items.Select(i => i.Id).ToArray());
        Assert.DoesNotContain(feed.Sections, s => s.Key == "local");
    }

    private static Article Published(
        string headline,
        string sourceUrl,
        double hoursAgo,
        string category = "Local",
        string source = "Test Source") =>
        new()
        {
            CityId = 2,
            Headline = headline,
            Summary = "s",
            SourceName = source,
            SourceUrl = sourceUrl,
            PublishedAt = DateTimeOffset.UtcNow.AddHours(-hoursAgo),
            Category = category,
            Status = ArticleStatus.Published,
            IsMock = false,
            DetectedLanguage = "en",
        };
}
