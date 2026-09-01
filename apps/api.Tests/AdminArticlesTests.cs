using System.Net;
using System.Text;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Tests;

public sealed class AdminArticlesTests : IClassFixture<TazaKhabarWebApplicationFactory>
{
    private readonly TazaKhabarWebApplicationFactory _factory;

    public AdminArticlesTests(TazaKhabarWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Publish_StampsReviewedBy_And_DoesNotChangePublishedAt()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        DateTimeOffset publishedAt;
        int id;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            publishedAt = DateTimeOffset.UtcNow.AddHours(-2);
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
                DetectedLanguage = "en",
                IngestedAt = DateTimeOffset.UtcNow,
            };
            db.Articles.Add(article);
            db.SaveChanges();
            id = article.Id;
        }

        var response = await client.PostAsync($"/api/admin/articles/{id}/publish", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<AdminArticleResponse>(TestJson.Options);
        Assert.Equal("Published", body!.Status);
        Assert.Equal("Admin", body.ReviewedBy);
        Assert.NotNull(body.ReviewedAt);
        Assert.Equal(publishedAt, body.PublishedAt);

        var publicFeed = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        Assert.Contains(publicFeed!.Items, a => a.Id == id);

        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var audit = Assert.Single(verifyDb.ArticleAuditLogs.Where(l => l.ArticleId == id));
        Assert.Equal("publish", audit.Action);
        Assert.Equal("Admin", audit.Actor);
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
        Assert.Equal("Draft", draft!.Status);

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
        Assert.Equal("Published", live!.Status);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Contains(db.ArticleAuditLogs.Where(l => l.ArticleId == live.Id), l => l.Action == "create_publish");
        }

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

    [Theory]
    [InlineData("""{"summary":"s","city":"jhansi","category":"Local","sourceName":"Desk","sourceUrl":"https://example.com/missing-headline","publishNow":false}""", "Headline")]
    [InlineData("""{"headline":null,"summary":"s","city":"jhansi","category":"Local","sourceName":"Desk","sourceUrl":"https://example.com/null-headline","publishNow":false}""", "Headline")]
    [InlineData("""{"headline":"   ","summary":"s","city":"jhansi","category":"Local","sourceName":"Desk","sourceUrl":"https://example.com/empty-headline","publishNow":false}""", "Headline")]
    [InlineData("""{"headline":"Manual","summary":"s","city":"jhansi","category":"Local","sourceName":"Desk","sourceUrl":"https://example.com/missing-publish"}""", "PublishNow")]
    public async Task CreateArticle_MalformedRequiredFields_ReturnsValidationProblem(string json, string field)
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        var response = await PostJsonAsync(client, "/api/admin/articles", json);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>(TestJson.Options);
        Assert.NotNull(problem);
        Assert.Contains(field, problem!.Errors.Keys);
    }

    [Fact]
    public async Task CreateArticle_WrongTypedField_Returns400()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        var response = await PostJsonAsync(
            client,
            "/api/admin/articles",
            """
            {"headline":"Manual","summary":"s","city":"jhansi","category":"Local","sourceName":"Desk","sourceUrl":"https://example.com/wrong-publish","publishNow":"yes"}
            """);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PatchArticle_EmptySuppliedField_Returns400()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        var create = await client.PostAsJsonAsync("/api/admin/articles", new
        {
            headline = "Patch me",
            summary = "Editor written",
            city = "jhansi",
            category = "Local",
            sourceName = "Desk",
            sourceUrl = "https://example.com/patch-empty-field",
            publishNow = false,
        });
        create.EnsureSuccessStatusCode();
        var article = await create.Content.ReadFromJsonAsync<AdminArticleResponse>(TestJson.Options);

        var response = await client.PatchAsJsonAsync($"/api/admin/articles/{article!.Id}", new { headline = " " });

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
                DetectedLanguage = "en",
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

    [Fact]
    public async Task ArchivePublished_HidesFromPublicFeed()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        var create = await client.PostAsJsonAsync("/api/admin/articles", new
        {
            headline = "Live then archived",
            summary = "Will leave the feed",
            city = "jhansi",
            category = "Local",
            sourceName = "Desk",
            sourceUrl = "https://example.com/live-then-archived",
            publishNow = true,
        });
        Assert.Equal(HttpStatusCode.OK, create.StatusCode);
        var live = await create.Content.ReadFromJsonAsync<AdminArticleResponse>(TestJson.Options);
        Assert.Equal("Published", live!.Status);

        var publicBefore = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        Assert.Contains(publicBefore!.Items, a => a.Id == live.Id);

        var archive = await client.PostAsync($"/api/admin/articles/{live.Id}/archive", null);
        Assert.Equal(HttpStatusCode.OK, archive.StatusCode);
        var archived = await archive.Content.ReadFromJsonAsync<AdminArticleResponse>(TestJson.Options);
        Assert.Equal("Archived", archived!.Status);
        Assert.Equal("Admin", archived.ReviewedBy);
        Assert.NotNull(archived.ReviewedAt);

        var publicAfter = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        Assert.DoesNotContain(publicAfter!.Items, a => a.Id == live.Id);

        var byId = await client.GetAsync($"/api/articles/{live.Id}");
        Assert.Equal(HttpStatusCode.NotFound, byId.StatusCode);
    }

    [Fact]
    public async Task ArchiveAlreadyArchived_Returns409()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        int id;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var article = new Article
            {
                CityId = 2,
                Headline = "Already archived",
                Summary = "s",
                SourceName = "A",
                SourceUrl = "https://example.com/already-archived",
                PublishedAt = DateTimeOffset.UtcNow,
                Category = "Local",
                Status = ArticleStatus.Archived,
                IsMock = false,
                DetectedLanguage = "en",
            };
            db.Articles.Add(article);
            db.SaveChanges();
            id = article.Id;
        }

        var response = await client.PostAsync($"/api/admin/articles/{id}/archive", null);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    private static Task<HttpResponseMessage> PostJsonAsync(HttpClient client, string url, string json) =>
        client.PostAsync(url, new StringContent(json, Encoding.UTF8, "application/json"));
}
