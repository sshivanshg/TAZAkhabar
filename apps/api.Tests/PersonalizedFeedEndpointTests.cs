using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Tests;

public sealed class PersonalizedFeedEndpointTests : IClassFixture<TazaKhabarWebApplicationFactory>
{
    private readonly TazaKhabarWebApplicationFactory _factory;

    public PersonalizedFeedEndpointTests(TazaKhabarWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Personalized_RequiresKnownCity()
    {
        var client = _factory.CreateSeededClient();

        Assert.Equal(
            HttpStatusCode.BadRequest,
            (await client.GetAsync("/api/articles/personalized")).StatusCode);
        Assert.Equal(
            HttpStatusCode.BadRequest,
            (await client.GetAsync("/api/articles/personalized?city=nowhere")).StatusCode);
    }

    [Fact]
    public async Task Personalized_ColdStart_MatchesChronologicalFeed()
    {
        var client = _factory.CreateSeededClient();
        int oldestId, middleId, newestId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var oldest = Published("Oldest", "https://example.com/p-old", hoursAgo: 30);
            var middle = Published("Middle", "https://example.com/p-mid", hoursAgo: 10);
            var newest = Published("Newest", "https://example.com/p-new", hoursAgo: 1);
            db.Articles.AddRange(oldest, middle, newest);
            db.SaveChanges();
            oldestId = oldest.Id;
            middleId = middle.Id;
            newestId = newest.Id;
        }

        var response = await client.GetAsync("/api/articles/personalized?city=jhansi");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("public, max-age=60", response.Headers.CacheControl?.ToString());

        var feed = await response.Content.ReadFromJsonAsync<PagedArticlesResponse>();
        Assert.NotNull(feed);
        Assert.Equal(3, feed.Total);
        Assert.Equal([newestId, middleId, oldestId], feed.Items.Select(i => i.Id).ToArray());
        // List payloads never carry the body.
        Assert.All(feed.Items, item => Assert.Null(item.Body));
    }

    [Fact]
    public async Task Personalized_BoostsAffinityCategory_AndDemotesSeen()
    {
        var client = _factory.CreateSeededClient();
        int freshLocalId, olderHealthId, seenHealthId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var freshLocal = Published("Fresh local", "https://example.com/p-fl", hoursAgo: 0, category: "Local");
            var olderHealth = Published("Older health", "https://example.com/p-oh", hoursAgo: 12, category: "Health");
            var seenHealth = Published("Seen health", "https://example.com/p-sh", hoursAgo: 24, category: "Health");
            db.Articles.AddRange(freshLocal, olderHealth, seenHealth);
            db.SaveChanges();
            freshLocalId = freshLocal.Id;
            olderHealthId = olderHealth.Id;
            seenHealthId = seenHealth.Id;

            // Session s1 reads Health exclusively and already opened seenHealth.
            db.ArticleViews.AddRange(
                new ArticleView { ArticleId = seenHealthId, SessionKey = "s1", ViewedAt = DateTimeOffset.UtcNow.AddHours(-2) },
                new ArticleView { ArticleId = seenHealthId, SessionKey = "s1", ViewedAt = DateTimeOffset.UtcNow.AddHours(-3) });
            db.SaveChanges();
        }

        var response = await client.GetAsync("/api/articles/personalized?city=jhansi&sessionId=s1");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cacheControl = response.Headers.CacheControl?.ToString() ?? string.Empty;
        Assert.Contains("private", cacheControl);
        Assert.Contains("no-store", cacheControl);

        var feed = await response.Content.ReadFromJsonAsync<PagedArticlesResponse>();
        Assert.NotNull(feed);
        // Health affinity lifts the 12h-old Health story above the brand-new Local one…
        Assert.Equal(olderHealthId, feed.Items[0].Id);
        // …while the already-seen Health story sinks below the fresh Local story.
        var ids = feed.Items.Select(i => i.Id).ToArray();
        Assert.True(
            Array.IndexOf(ids, freshLocalId) < Array.IndexOf(ids, seenHealthId),
            $"Expected seen story {seenHealthId} below fresh story {freshLocalId}; got [{string.Join(",", ids)}]");
    }

    [Fact]
    public async Task Personalized_PaginatesRankedPool()
    {
        var client = _factory.CreateSeededClient();
        var ids = new List<int>();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            for (var i = 0; i < 3; i++)
            {
                var article = Published($"Story {i}", $"https://example.com/p-page-{i}", hoursAgo: i * 2);
                db.Articles.Add(article);
                db.SaveChanges();
                ids.Add(article.Id);
            }
        }

        var page1 = await client.GetFromJsonAsync<PagedArticlesResponse>(
            "/api/articles/personalized?city=jhansi&limit=2");
        Assert.NotNull(page1);
        Assert.Equal(3, page1.Total);
        Assert.Equal(2, page1.Items.Count);

        var page2 = await client.GetFromJsonAsync<PagedArticlesResponse>(
            "/api/articles/personalized?city=jhansi&limit=2&offset=2");
        Assert.NotNull(page2);
        Assert.Equal(3, page2.Total);
        Assert.Single(page2.Items);

        var combined = page1.Items.Select(i => i.Id).Concat(page2.Items.Select(i => i.Id)).ToArray();
        Assert.Equal(3, combined.Distinct().Count());
        Assert.Equal(ids.ToHashSet(), combined.ToHashSet());
    }

    [Fact]
    public async Task Personalized_FiltersByCategory()
    {
        var client = _factory.CreateSeededClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Articles.AddRange(
                Published("Health one", "https://example.com/p-cat-h", hoursAgo: 1, category: "Health"),
                Published("Local one", "https://example.com/p-cat-l", hoursAgo: 0, category: "Local"));
            db.SaveChanges();
        }

        var feed = await client.GetFromJsonAsync<PagedArticlesResponse>(
            "/api/articles/personalized?city=jhansi&category=Health");
        Assert.NotNull(feed);
        Assert.Single(feed.Items);
        Assert.Equal("Health", feed.Items[0].Category);
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
