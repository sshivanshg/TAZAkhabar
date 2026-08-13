using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Tests;

public sealed class AdminArticlesTests : IClassFixture<NewsFeedWebApplicationFactory>
{
    private readonly NewsFeedWebApplicationFactory _factory;

    public AdminArticlesTests(NewsFeedWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Publish_StampsReviewedBy_And_DoesNotChangePublishedAt()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory, "Editor One");
        DateTimeOffset publishedAt;
        int id;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            publishedAt = DateTimeOffset.Parse("2026-01-15T10:00:00Z");
            var article = new Article
            {
                CityId = 2,
                Headline = "Needs review",
                Summary = "summary",
                SourceName = "A",
                SourceUrl = "https://example.com/needs-review",
                PublishedAt = publishedAt,
                Category = "Local",
                Status = ArticleStatus.PendingReview,
                IsMock = false,
                IngestedAt = DateTimeOffset.UtcNow,
            };
            db.Articles.Add(article);
            db.SaveChanges();
            id = article.Id;
        }

        var response = await client.PostAsync($"/api/admin/articles/{id}/publish", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<AdminArticleResponse>(TestJson.Options);
        Assert.Equal(ArticleStatus.Published, body!.Status);
        Assert.Equal("Editor One", body.ReviewedBy);
        Assert.NotNull(body.ReviewedAt);
        Assert.Equal(publishedAt, body.PublishedAt);

        var publicFeed = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        Assert.Contains(publicFeed!.Items, a => a.Id == id);
    }

    [Fact]
    public async Task CreateDraft_DoesNotAppearOnPublicFeed_UntilPublishNow()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        var create = await client.PostAsJsonAsync("/api/admin/articles", new
        {
            headline = "Manual draft",
            summary = "Editor written",
            city = "jhansi",
            category = "Local",
            sourceName = "Desk",
            sourceUrl = "https://example.com/manual-draft",
            publishNow = false,
        });
        Assert.Equal(HttpStatusCode.OK, create.StatusCode);
        var draft = await create.Content.ReadFromJsonAsync<AdminArticleResponse>(TestJson.Options);
        Assert.Equal(ArticleStatus.Draft, draft!.Status);

        var publicBefore = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        Assert.DoesNotContain(publicBefore!.Items, a => a.Id == draft.Id);

        var publishNow = await client.PostAsJsonAsync("/api/admin/articles", new
        {
            headline = "Manual live",
            summary = "Editor written",
            city = "jhansi",
            category = "Local",
            sourceName = "Desk",
            sourceUrl = "https://example.com/manual-live",
            publishNow = true,
        });
        Assert.Equal(HttpStatusCode.OK, publishNow.StatusCode);
        var live = await publishNow.Content.ReadFromJsonAsync<AdminArticleResponse>(TestJson.Options);
        Assert.Equal(ArticleStatus.Published, live!.Status);

        var publicAfter = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        Assert.Contains(publicAfter!.Items, a => a.Id == live.Id);
    }

    [Fact]
    public async Task DuplicateSourceUrl_Returns409()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        var body = new
        {
            headline = "One",
            summary = "s",
            city = "jhansi",
            category = "Local",
            sourceName = "Desk",
            sourceUrl = "https://example.com/dup-url",
            publishNow = false,
        };
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/admin/articles", body)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/admin/articles", body)).StatusCode);
    }

    [Fact]
    public async Task InvalidCategory_Returns400()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        var response = await client.PostAsJsonAsync("/api/admin/articles", new
        {
            headline = "Bad cat",
            summary = "s",
            city = "jhansi",
            category = "Gossip",
            sourceName = "Desk",
            sourceUrl = "https://example.com/bad-cat",
            publishNow = false,
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PublishArchived_Returns409()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        int id;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var article = new Article
            {
                CityId = 2,
                Headline = "Archived",
                Summary = "s",
                SourceName = "A",
                SourceUrl = "https://example.com/archived",
                PublishedAt = DateTimeOffset.UtcNow,
                Category = "Local",
                Status = ArticleStatus.Archived,
                IsMock = false,
            };
            db.Articles.Add(article);
            db.SaveChanges();
            id = article.Id;
            db.ChangeTracker.Clear();
            var reloaded = db.Articles.Single(a => a.Id == id);
            Assert.Equal(ArticleStatus.Archived, reloaded.Status);
        }

        var listed = await client.GetFromJsonAsync<PagedAdminArticlesResponse>(
            "/api/admin/articles?status=Archived&page=1",
            TestJson.Options);
        Assert.Contains(listed!.Items, a => a.Id == id);

        var response = await client.PostAsync($"/api/admin/articles/{id}/publish", null);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }
}
