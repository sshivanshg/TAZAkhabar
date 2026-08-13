using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class ArticleTranslationEndpointTests : IClassFixture<NewsFeedWebApplicationFactory>
{
    private readonly NewsFeedWebApplicationFactory _factory;

    public ArticleTranslationEndpointTests(NewsFeedWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetArticle_WithLang_TranslatesOnceAndCaches()
    {
        var client = _factory.CreateSeededClient();
        int id;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var article = new Article
            {
                CityId = 2,
                Headline = "झांसी में बजट पास",
                Summary = "नगर निगम ने बजट मंजूरी दी।",
                SourceName = "A",
                SourceUrl = "https://example.com/hi-story",
                PublishedAt = DateTimeOffset.UtcNow,
                Category = "Local",
                Status = ArticleStatus.Published,
                IsMock = false,
                DetectedLanguage = "hi",
            };
            db.Articles.Add(article);
            db.SaveChanges();
            id = article.Id;
        }

        var fake = (FakeArticleIntelligence)_factory.Services.GetRequiredService<IArticleIntelligence>();
        var before = fake.TranslateCallCount;

        var first = await client.GetFromJsonAsync<ArticleResponse>($"/api/articles/{id}?lang=en");
        Assert.NotNull(first);
        Assert.Equal("hi", first.DetectedLanguage);
        Assert.Equal("en", first.DisplayLanguage);
        Assert.StartsWith("[en]", first.Headline);
        Assert.Equal(before + 1, fake.TranslateCallCount);

        var second = await client.GetFromJsonAsync<ArticleResponse>($"/api/articles/{id}?lang=en");
        Assert.NotNull(second);
        Assert.Equal(first.Headline, second.Headline);
        Assert.Equal(before + 1, fake.TranslateCallCount);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var cached = Assert.Single(db.ArticleTranslations.Where(t => t.ArticleId == id && t.TargetLanguage == "en"));
            Assert.Equal(TranslationStatus.Completed, cached.Status);
        }
    }

    [Fact]
    public async Task GetArticles_SameLanguage_DoesNotTranslate()
    {
        var client = _factory.CreateSeededClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Articles.Add(new Article
            {
                CityId = 2,
                Headline = "English headline",
                Summary = "English summary",
                SourceName = "A",
                SourceUrl = "https://example.com/en-story",
                PublishedAt = DateTimeOffset.UtcNow,
                Category = "Local",
                Status = ArticleStatus.Published,
                IsMock = false,
                DetectedLanguage = "en",
            });
            db.SaveChanges();
        }

        var fake = (FakeArticleIntelligence)_factory.Services.GetRequiredService<IArticleIntelligence>();
        var before = fake.TranslateCallCount;
        var payload = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi&lang=en");
        Assert.NotNull(payload);
        var item = Assert.Single(payload.Items);
        Assert.Equal("en", item.DetectedLanguage);
        Assert.Equal("en", item.DisplayLanguage);
        Assert.Equal("English headline", item.Headline);
        Assert.Equal(before, fake.TranslateCallCount);
    }

    [Fact]
    public async Task AdminPatch_InvalidatesCachedTranslations()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory, "Editor");
        int id;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var article = new Article
            {
                CityId = 2,
                Headline = "Original Hindi",
                Summary = "Original summary",
                SourceName = "A",
                SourceUrl = "https://example.com/invalidate",
                PublishedAt = DateTimeOffset.UtcNow,
                Category = "Local",
                Status = ArticleStatus.Published,
                IsMock = false,
                DetectedLanguage = "hi",
            };
            db.Articles.Add(article);
            db.SaveChanges();
            id = article.Id;
            db.ArticleTranslations.Add(new ArticleTranslation
            {
                ArticleId = id,
                TargetLanguage = "en",
                TranslatedHeadline = "[en] Original Hindi",
                TranslatedSummary = "[en] Original summary",
                TranslatedAt = DateTimeOffset.UtcNow,
                Status = TranslationStatus.Completed,
            });
            db.SaveChanges();
        }

        var patch = await client.PatchAsJsonAsync(
            $"/api/admin/articles/{id}",
            new PatchAdminArticleRequest("Updated Hindi", "Updated summary", null, null, null));
        Assert.Equal(HttpStatusCode.OK, patch.StatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Empty(db.ArticleTranslations.Where(t => t.ArticleId == id));
        }
    }
}
