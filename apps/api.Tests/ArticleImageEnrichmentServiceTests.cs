using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class ArticleImageEnrichmentServiceTests
{
    [Fact]
    public async Task Enrich_SetsImageUrl_AndAttemptedAt_OnSuccess()
    {
        await using var db = CreateDb();
        var article = await AddArticleAsync(db, sourceUrl: "https://news.example/story-1");
        var html = """<meta property="og:image" content="https://cdn.example/pic.jpg" />""";
        var service = CreateService(db, new FakeArticleImageHtmlClient { HtmlByUrl = { ["https://news.example/story-1"] = html } });

        await service.EnrichAsync(article.Id, CancellationToken.None);

        var stored = await db.Articles.SingleAsync(a => a.Id == article.Id);
        Assert.Equal("https://cdn.example/pic.jpg", stored.ImageUrl);
        Assert.NotNull(stored.ImageEnrichmentAttemptedAt);
    }

    [Fact]
    public async Task Enrich_MissingMeta_SetsAttemptedAt_Only()
    {
        await using var db = CreateDb();
        var article = await AddArticleAsync(db, sourceUrl: "https://news.example/story-2");
        var service = CreateService(db, new FakeArticleImageHtmlClient
        {
            HtmlByUrl = { ["https://news.example/story-2"] = "<html><head></head></html>" },
        });

        await service.EnrichAsync(article.Id, CancellationToken.None);

        var stored = await db.Articles.SingleAsync(a => a.Id == article.Id);
        Assert.Null(stored.ImageUrl);
        Assert.NotNull(stored.ImageEnrichmentAttemptedAt);
    }

    [Fact]
    public async Task Enrich_DoesNotOverwrite_ExistingImageUrl()
    {
        await using var db = CreateDb();
        var article = await AddArticleAsync(
            db,
            sourceUrl: "https://news.example/story-3",
            imageUrl: "https://cdn.example/existing.jpg");
        var html = """<meta property="og:image" content="https://cdn.example/new.jpg" />""";
        var service = CreateService(db, new FakeArticleImageHtmlClient { HtmlByUrl = { ["https://news.example/story-3"] = html } });

        await service.EnrichAsync(article.Id, CancellationToken.None);

        var stored = await db.Articles.SingleAsync(a => a.Id == article.Id);
        Assert.Equal("https://cdn.example/existing.jpg", stored.ImageUrl);
        Assert.NotNull(stored.ImageEnrichmentAttemptedAt);
    }

    [Fact]
    public async Task Enrich_FetchFailure_SetsAttemptedAt()
    {
        await using var db = CreateDb();
        var article = await AddArticleAsync(db, sourceUrl: "https://news.example/story-4");
        var service = CreateService(db, new FakeArticleImageHtmlClient());

        await service.EnrichAsync(article.Id, CancellationToken.None);

        var stored = await db.Articles.SingleAsync(a => a.Id == article.Id);
        Assert.Null(stored.ImageUrl);
        Assert.NotNull(stored.ImageEnrichmentAttemptedAt);
    }

    [Fact]
    public async Task Enrich_InvalidSourceUrl_SetsAttemptedAt()
    {
        await using var db = CreateDb();
        var article = await AddArticleAsync(db, sourceUrl: "pdf://upload/1/abc");
        var service = CreateService(db, new FakeArticleImageHtmlClient());

        await service.EnrichAsync(article.Id, CancellationToken.None);

        var stored = await db.Articles.SingleAsync(a => a.Id == article.Id);
        Assert.Null(stored.ImageUrl);
        Assert.NotNull(stored.ImageEnrichmentAttemptedAt);
    }

    [Fact]
    public void IsEligible_RequiresNullImage_NullAttempt_NonMock_HttpUrl()
    {
        var eligible = new Article
        {
            Headline = "h",
            Summary = "s",
            SourceName = "n",
            SourceUrl = "https://news.example/a",
            Category = "Local",
            PublishedAt = DateTimeOffset.UtcNow,
            DetectedLanguage = "en",
        };
        Assert.True(ArticleImageEnrichmentService.IsEligible(eligible));

        eligible.ImageUrl = "https://cdn.example/x.jpg";
        Assert.False(ArticleImageEnrichmentService.IsEligible(eligible));
    }

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"img-enrich-{Guid.NewGuid():N}")
            .Options;
        var db = new AppDbContext(options);
        db.Cities.Add(new City { Id = 2, Name = "Jhansi", State = "UP", Slug = "jhansi" });
        db.SaveChanges();
        return db;
    }

    private static async Task<Article> AddArticleAsync(
        AppDbContext db,
        string sourceUrl,
        string? imageUrl = null)
    {
        var article = new Article
        {
            CityId = 2,
            Headline = "Headline",
            Summary = "Summary",
            DetectedLanguage = "en",
            SourceName = "Source",
            SourceUrl = sourceUrl,
            PublishedAt = DateTimeOffset.UtcNow,
            Category = "Local",
            ImageUrl = imageUrl,
            Status = ArticleStatus.Published,
            IsMock = false,
            IngestedAt = DateTimeOffset.UtcNow,
        };
        db.Articles.Add(article);
        await db.SaveChangesAsync();
        return article;
    }

    private static ArticleImageEnrichmentService CreateService(
        AppDbContext db,
        IArticleImageHtmlClient htmlClient) =>
        new(db, htmlClient, new ImageEnrichmentQueue(), NullLogger<ArticleImageEnrichmentService>.Instance);

    private sealed class FakeArticleImageHtmlClient : IArticleImageHtmlClient
    {
        public Dictionary<string, string?> HtmlByUrl { get; } = new(StringComparer.Ordinal);

        public Task<string?> GetHtmlAsync(Uri uri, CancellationToken ct) =>
            Task.FromResult(HtmlByUrl.TryGetValue(uri.AbsoluteUri, out var html) ? html : null);
    }
}
