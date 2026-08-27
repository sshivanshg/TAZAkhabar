using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Tests;

public sealed class TrendingEndpointTests : IClassFixture<TazaKhabarWebApplicationFactory>
{
    private readonly TazaKhabarWebApplicationFactory _factory;

    public TrendingEndpointTests(TazaKhabarWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task RecordView_ThenTrending_RanksByRecentViews()
    {
        var client = _factory.CreateSeededClient();
        int hotId, coldId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var hot = Published("Hot story", "https://example.com/trend-hot");
            var cold = Published("Cold story", "https://example.com/trend-cold");
            db.Articles.AddRange(hot, cold);
            db.SaveChanges();
            hotId = hot.Id;
            coldId = cold.Id;
        }

        for (var i = 0; i < 3; i++)
        {
            var res = await client.PostAsJsonAsync(
                $"/api/articles/{hotId}/view",
                new RecordArticleViewRequest($"sess-{i}"));
            Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
        }

        Assert.Equal(
            HttpStatusCode.NoContent,
            (await client.PostAsJsonAsync(
                $"/api/articles/{coldId}/view",
                new RecordArticleViewRequest("sess-cold"))).StatusCode);

        var trending = await client.GetFromJsonAsync<TrendingArticlesResponse>(
            "/api/articles/trending?city=jhansi&limit=5");
        Assert.NotNull(trending);
        Assert.Equal(2, trending.Items.Count);
        Assert.Equal(hotId, trending.Items[0].Id);
        Assert.Equal(coldId, trending.Items[1].Id);
    }

    [Fact]
    public async Task RecordView_DedupesSameSessionWithinWindow()
    {
        var client = _factory.CreateSeededClient();
        int id;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var article = Published("Dedup me", "https://example.com/trend-dedup");
            db.Articles.Add(article);
            db.SaveChanges();
            id = article.Id;
        }

        var body = new RecordArticleViewRequest("same-session");
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync($"/api/articles/{id}/view", body)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync($"/api/articles/{id}/view", body)).StatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Equal(1, db.ArticleViews.Count(v => v.ArticleId == id));
        }
    }

    [Fact]
    public async Task Trending_IsCityScoped_AndIgnoresOldArticles()
    {
        var client = _factory.CreateSeededClient();
        int jhansiId, agraId, oldId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var jhansi = Published("Jhansi trend", "https://example.com/trend-j");
            var agra = Published("Agra trend", "https://example.com/trend-a", cityId: 1);
            var old = Published("Old trend", "https://example.com/trend-old",
                publishedAt: DateTimeOffset.UtcNow.AddDays(-10));
            db.Articles.AddRange(jhansi, agra, old);
            db.SaveChanges();
            jhansiId = jhansi.Id;
            agraId = agra.Id;
            oldId = old.Id;
            db.ArticleViews.AddRange(
                new ArticleView { ArticleId = jhansiId, ViewedAt = DateTimeOffset.UtcNow, SessionKey = "a" },
                new ArticleView { ArticleId = agraId, ViewedAt = DateTimeOffset.UtcNow, SessionKey = "b" },
                new ArticleView { ArticleId = oldId, ViewedAt = DateTimeOffset.UtcNow, SessionKey = "c" });
            db.SaveChanges();
        }

        var trending = await client.GetFromJsonAsync<TrendingArticlesResponse>(
            "/api/articles/trending?city=jhansi");
        Assert.NotNull(trending);
        Assert.Single(trending.Items);
        Assert.Equal(jhansiId, trending.Items[0].Id);
    }

    [Fact]
    public async Task RecordView_UnknownArticle_Returns404()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.PostAsJsonAsync(
            "/api/articles/999999/view",
            new RecordArticleViewRequest("x"));
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static Article Published(
        string headline,
        string sourceUrl,
        DateTimeOffset? publishedAt = null,
        int cityId = 2) =>
        new()
        {
            CityId = cityId,
            Headline = headline,
            Summary = "s",
            SourceName = "A",
            SourceUrl = sourceUrl,
            PublishedAt = publishedAt ?? DateTimeOffset.UtcNow,
            Category = "Local",
            Status = ArticleStatus.Published,
            IsMock = false,
            DetectedLanguage = "en",
        };
}
