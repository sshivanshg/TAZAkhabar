using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class ExternalArticleIngestEndpointTests : IClassFixture<NewsFeedWebApplicationFactory>
{
    private readonly NewsFeedWebApplicationFactory _factory;

    public ExternalArticleIngestEndpointTests(NewsFeedWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task IngestArticles_MissingKey_Returns401()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.PostAsJsonAsync("/api/ingest/articles", new { articles = Array.Empty<object>() });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task IngestScrape_ValidKey_Returns410()
    {
        var client = _factory.CreateSeededClient();
        client.DefaultRequestHeaders.Add("X-Ingest-Key", NewsFeedWebApplicationFactory.TestIngestKey);
        var response = await client.PostAsync("/api/ingest/scrape", null);
        Assert.Equal(HttpStatusCode.Gone, response.StatusCode);
    }

    [Fact]
    public async Task IngestSources_ReturnsActiveScrapeSources()
    {
        var client = _factory.CreateSeededClient();
        client.DefaultRequestHeaders.Add("X-Ingest-Key", NewsFeedWebApplicationFactory.TestIngestKey);
        var response = await client.GetAsync("/api/ingest/sources?type=scrape");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<IngestSourcesResponse>();
        Assert.NotNull(body);
        Assert.Contains(body.Sources, s => s.FeedUrl != null && s.FeedUrl.Contains("amarujala", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task IngestArticles_InsertsPersistsCleanText_AndSkipsDuplicate()
    {
        var client = _factory.CreateSeededClient();
        int sourceId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            sourceId = db.Sources.First(s => s.Type == SourceType.Scrape && s.IsActive).Id;
        }

        client.DefaultRequestHeaders.Add("X-Ingest-Key", NewsFeedWebApplicationFactory.TestIngestKey);
        var url = "https://www.amarujala.com/uttar-pradesh/jhansi/external-ingest-story-1";
        var payload = new IngestArticlesRequest(
            null,
            [
                new IngestArticleItemDto(
                    sourceId,
                    url,
                    "Jhansi road works",
                    DateTimeOffset.UtcNow,
                    "https://images.example.com/hero.jpg",
                    "Full clean body text about road works in Jhansi city today.",
                    "hi",
                    "Tier1_Newspaper4k"),
            ]);

        var first = await client.PostAsJsonAsync("/api/ingest/articles", payload);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        var firstBody = await first.Content.ReadFromJsonAsync<IngestArticlesResponse>();
        Assert.Equal(1, firstBody!.Inserted);
        Assert.Equal(0, firstBody.Skipped);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var article = await db.Articles.Include(a => a.Content).SingleAsync(a => a.SourceUrl.Contains("external-ingest-story-1"));
            Assert.Equal("Short original summary for Jhansi road works", article.Summary);
            Assert.NotNull(article.Content);
            Assert.Contains("road works", article.Content!.CleanText);
            Assert.Equal("Tier1_Newspaper4k", article.Content.ExtractionTier);
            Assert.Equal("https://images.example.com/hero.jpg", article.ImageUrl);
        }

        var second = await client.PostAsJsonAsync("/api/ingest/articles", payload);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        var secondBody = await second.Content.ReadFromJsonAsync<IngestArticlesResponse>();
        Assert.Equal(0, secondBody!.Inserted);
        Assert.Equal(1, secondBody.Skipped);
        Assert.Equal("skippedDuplicate", secondBody.Items[0].Status);
    }

    [Fact]
    public async Task IngestArticles_MissingCleanText_FailsItem()
    {
        var client = _factory.CreateSeededClient();
        int sourceId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            sourceId = db.Sources.First(s => s.Type == SourceType.Scrape && s.IsActive).Id;
        }

        client.DefaultRequestHeaders.Add("X-Ingest-Key", NewsFeedWebApplicationFactory.TestIngestKey);
        var payload = new IngestArticlesRequest(
            null,
            [
                new IngestArticleItemDto(
                    sourceId,
                    "https://www.amarujala.com/uttar-pradesh/jhansi/missing-body",
                    "Headline only",
                    null,
                    null,
                    "   ",
                    "hi",
                    null),
            ]);

        var response = await client.PostAsJsonAsync("/api/ingest/articles", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<IngestArticlesResponse>();
        Assert.Equal(1, body!.Failed);
        Assert.Equal("failed", body.Items[0].Status);
    }

    [Fact]
    public async Task IngestArticles_BatchOverCap_Returns400()
    {
        var client = _factory.CreateSeededClient();
        int sourceId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            sourceId = db.Sources.First(s => s.Type == SourceType.Scrape && s.IsActive).Id;
        }

        client.DefaultRequestHeaders.Add("X-Ingest-Key", NewsFeedWebApplicationFactory.TestIngestKey);
        var articles = Enumerable.Range(0, ExternalArticleIngestService.MaxBatchSize + 1)
            .Select(i => new IngestArticleItemDto(
                sourceId,
                $"https://www.amarujala.com/story-{i}",
                $"Title {i}",
                null,
                null,
                $"Body {i}",
                "hi",
                null))
            .ToList();

        var response = await client.PostAsJsonAsync("/api/ingest/articles", new IngestArticlesRequest(null, articles));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
