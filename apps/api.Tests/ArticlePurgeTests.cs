using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Tests;

public sealed class ArticlePurgeTests : IClassFixture<TazaKhabarWebApplicationFactory>
{
    private readonly TazaKhabarWebApplicationFactory _factory;

    public ArticlePurgeTests(TazaKhabarWebApplicationFactory factory) => _factory = factory;

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
        int oldId;
        int freshId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var old = Published("Old story", "https://example.com/purge-old", DateTimeOffset.UtcNow.AddDays(-8));
            var fresh = Published("Fresh story", "https://example.com/purge-fresh", DateTimeOffset.UtcNow.AddDays(-1));
            db.Articles.AddRange(old, fresh);
            db.SaveChanges();
            oldId = old.Id;
            freshId = fresh.Id;
            db.ArticleViews.Add(new ArticleView
            {
                ArticleId = oldId,
                ViewedAt = DateTimeOffset.UtcNow.AddDays(-7),
                SessionKey = "purge-test",
            });
            db.SaveChanges();
        }

        client.DefaultRequestHeaders.Add("X-Ingest-Key", TazaKhabarWebApplicationFactory.TestIngestKey);
        var response = await client.PostAsync("/api/maintenance/purge-old-articles", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PurgeOldArticlesResponse>();
        Assert.NotNull(body);
        Assert.True(body.Deleted >= 1);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Null(await db.Articles.AsNoTracking().FirstOrDefaultAsync(a => a.Id == oldId));
            Assert.NotNull(await db.Articles.AsNoTracking().FirstOrDefaultAsync(a => a.Id == freshId));
            Assert.False(await db.ArticleViews.AsNoTracking().AnyAsync(v => v.ArticleId == oldId));
        }
    }

    [Fact]
    public async Task Purge_Idempotent_SecondCallDeletedZero()
    {
        var client = _factory.CreateSeededClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Articles.Add(Published("Stale", "https://example.com/purge-idem", DateTimeOffset.UtcNow.AddDays(-10)));
            db.SaveChanges();
        }

        client.DefaultRequestHeaders.Add("X-Ingest-Key", TazaKhabarWebApplicationFactory.TestIngestKey);
        await client.PostAsync("/api/maintenance/purge-old-articles", null);
        var second = await client.PostAsync("/api/maintenance/purge-old-articles", null);
        var body = await second.Content.ReadFromJsonAsync<PurgeOldArticlesResponse>();
        Assert.Equal(0, body!.Deleted);
    }

    private static Article Published(string headline, string sourceUrl, DateTimeOffset publishedAt) =>
        new()
        {
            CityId = 2,
            Headline = headline,
            Summary = "s",
            SourceName = "A",
            SourceUrl = sourceUrl,
            PublishedAt = publishedAt,
            Category = "Local",
            Status = ArticleStatus.Published,
            IsMock = false,
            DetectedLanguage = "en",
        };
}
