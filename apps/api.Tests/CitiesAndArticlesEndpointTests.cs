using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Tests;

public sealed class CitiesEndpointTests : IClassFixture<NewsFeedWebApplicationFactory>
{
    private readonly NewsFeedWebApplicationFactory _factory;

    public CitiesEndpointTests(NewsFeedWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetCities_ReturnsSeededPilotCities()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.GetAsync("/api/cities");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var cities = await response.Content.ReadFromJsonAsync<List<CityResponse>>();
        Assert.NotNull(cities);
        Assert.True(cities.Count >= 5);

        var slugs = cities.Select(c => c.Slug).ToHashSet();
        Assert.Contains("jhansi", slugs);
        Assert.Contains("kanpur", slugs);
        Assert.Contains("lucknow", slugs);
        Assert.Contains("agra", slugs);
        Assert.Contains("delhi", slugs);

        Assert.Equal(cities.OrderBy(c => c.Name).Select(c => c.Slug), cities.Select(c => c.Slug));
    }
}

public sealed class ArticlesEndpointTests : IClassFixture<NewsFeedWebApplicationFactory>
{
    private readonly NewsFeedWebApplicationFactory _factory;

    public ArticlesEndpointTests(NewsFeedWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetArticles_ForJhansi_ReturnsNewestFirst()
    {
        var client = _factory.CreateSeededClient();
        var older = DateTimeOffset.UtcNow.AddHours(-2);
        var newer = DateTimeOffset.UtcNow;
        InsertJhansiArticles(
            Published("Older published", "https://example.com/older", older),
            Published("Newer published", "https://example.com/newer", newer));

        var response = await client.GetAsync("/api/articles?city=jhansi");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<PagedArticlesResponse>();
        Assert.NotNull(payload);
        Assert.Equal(2, payload.Total);
        Assert.Equal(0, payload.Offset);
        Assert.Equal(20, payload.Limit);
        Assert.Equal(["Newer published", "Older published"], payload.Items.Select(a => a.Headline));
        Assert.All(payload.Items, a => Assert.DoesNotContain("[MOCK]", a.Headline));
    }

    [Fact]
    public async Task GetArticles_SupportsOffsetPagination()
    {
        var client = _factory.CreateSeededClient();
        var now = DateTimeOffset.UtcNow;
        InsertJhansiArticles(
            Enumerable.Range(0, 6)
                .Select(i => Published($"Live {i}", $"https://example.com/page-{i}", now.AddHours(-i)))
                .ToArray());

        var page1 = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi&limit=3&offset=0");
        var page2 = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi&limit=3&offset=3");

        Assert.NotNull(page1);
        Assert.NotNull(page2);
        Assert.Equal(3, page1.Items.Count);
        Assert.Equal(3, page2.Offset);
        Assert.DoesNotContain(page2.Items.Select(i => i.Id), id => page1.Items.Any(i => i.Id == id));
    }

    [Fact]
    public async Task GetArticles_EmptyCity_ReturnsEmptyItems()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.GetAsync("/api/articles?city=emptyville");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<PagedArticlesResponse>();
        Assert.NotNull(payload);
        Assert.Equal(0, payload.Total);
        Assert.Empty(payload.Items);
    }

    [Fact]
    public async Task GetArticles_InvalidCity_ReturnsProblemDetails()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.GetAsync("/api/articles?city=not-a-real-city");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(400, problem.Status);
        Assert.Contains("not-a-real-city", problem.Detail ?? string.Empty);
    }

    [Fact]
    public async Task GetArticles_MissingCity_ReturnsProblemDetails()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.GetAsync("/api/articles");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetArticles_QueryFilter_MatchesHeadlineSubstring()
    {
        var client = _factory.CreateSeededClient();
        InsertJhansiArticles(
            Published("Local municipal budget approved", "https://example.com/budget"),
            Published("Unrelated sports result", "https://example.com/sports"));

        var response = await client.GetAsync("/api/articles?city=jhansi&q=budget");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<PagedArticlesResponse>();
        Assert.NotNull(payload);
        Assert.NotEmpty(payload.Items);
        Assert.All(payload.Items, a => Assert.Contains("budget", a.Headline, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task GetArticles_CategoryFilter_MatchesCategory()
    {
        var client = _factory.CreateSeededClient();
        InsertJhansiArticles(
            Published("Clinic hours", "https://example.com/health", category: "Health"),
            Published("Ward meeting", "https://example.com/local"));

        var response = await client.GetAsync("/api/articles?city=jhansi&category=Health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<PagedArticlesResponse>();
        Assert.NotNull(payload);
        Assert.NotEmpty(payload.Items);
        Assert.All(payload.Items, a => Assert.Equal("Health", a.Category, ignoreCase: true));
    }

    [Fact]
    public async Task GetArticles_DateFilter_UsesCityLocalCalendarDay()
    {
        var client = _factory.CreateSeededClient();
        var day = new DateOnly(2026, 8, 14);
        var (start, end) = NewsFeed.Api.Services.CityCalendar.UtcBoundsForLocalDate(day);
        InsertJhansiArticles(
            Published("On day early UTC", "https://example.com/date-early", start.AddHours(1)),
            Published("On day late UTC", "https://example.com/date-late", end.AddMinutes(-30)),
            Published("Previous local day", "https://example.com/date-prev", start.AddMinutes(-30)),
            Published("Next local day", "https://example.com/date-next", end.AddMinutes(30)));

        var response = await client.GetAsync("/api/articles?city=jhansi&date=2026-08-14");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = await response.Content.ReadFromJsonAsync<PagedArticlesResponse>();
        Assert.NotNull(payload);
        Assert.Equal(2, payload.Total);
        Assert.Equal(
            ["On day late UTC", "On day early UTC"],
            payload.Items.Select(a => a.Headline));
    }

    [Fact]
    public async Task GetArticles_InvalidDate_ReturnsBadRequest()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.GetAsync("/api/articles?city=jhansi&date=08/14/2026");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetArticleDates_ReturnsLocalDatesWithArticles()
    {
        var client = _factory.CreateSeededClient();
        var today = NewsFeed.Api.Services.CityCalendar.TodayLocal();
        var twoDaysAgo = today.AddDays(-2);
        var (todayStart, todayEnd) = NewsFeed.Api.Services.CityCalendar.UtcBoundsForLocalDate(today);
        var (olderStart, _) = NewsFeed.Api.Services.CityCalendar.UtcBoundsForLocalDate(twoDaysAgo);
        InsertJhansiArticles(
            Published("Today-ish", "https://example.com/dates-a", todayStart.AddHours(1)),
            Published("Same local day", "https://example.com/dates-b", todayEnd.AddMinutes(-60)),
            Published("Other day", "https://example.com/dates-c", olderStart.AddHours(12)));

        var response = await client.GetAsync("/api/articles/dates?city=jhansi");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = await response.Content.ReadFromJsonAsync<ArticleDatesResponse>();
        Assert.NotNull(payload);
        Assert.Contains(today.ToString("yyyy-MM-dd"), payload.Dates);
        Assert.Contains(twoDaysAgo.ToString("yyyy-MM-dd"), payload.Dates);
        Assert.Equal(payload.Dates, payload.Dates.OrderByDescending(d => d).ToList());
    }

    [Fact]
    public async Task GetArticles_SetsPublicCacheControl()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.GetAsync("/api/articles?city=jhansi");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("public, max-age=60", response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task GetArticleById_ReturnsArticle()
    {
        var client = _factory.CreateSeededClient();
        InsertJhansiArticles(Published("Live published", "https://example.com/by-id"));
        var list = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi&limit=1");
        Assert.NotNull(list);
        Assert.NotEmpty(list.Items);
        var id = list.Items[0].Id;

        var response = await client.GetAsync($"/api/articles/{id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("public, max-age=60", response.Headers.CacheControl?.ToString());

        var article = await response.Content.ReadFromJsonAsync<ArticleResponse>();
        Assert.NotNull(article);
        Assert.Equal(id, article.Id);
    }

    [Fact]
    public async Task GetArticleById_UnknownId_ReturnsNotFound()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.GetAsync("/api/articles/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(404, problem.Status);
    }

    [Fact]
    public async Task GetArticles_QueryTooLong_ReturnsBadRequest()
    {
        var client = _factory.CreateSeededClient();
        var q = new string('a', 101);
        var response = await client.GetAsync($"/api/articles?city=jhansi&q={q}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetArticles_HidesMockSeedRows()
    {
        var client = _factory.CreateSeededClient();
        var jhansi = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        var lucknow = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=lucknow");
        Assert.NotNull(jhansi);
        Assert.NotNull(lucknow);
        Assert.Equal(0, jhansi.Total);
        Assert.Empty(jhansi.Items);
        Assert.Equal(0, lucknow.Total);
    }

    [Fact]
    public async Task GetArticles_ReturnsOnlyPublishedNonMock()
    {
        var client = _factory.CreateSeededClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Articles.AddRange(
                new Article { CityId = 2, Headline = "Live published", Summary = "s", SourceName = "A", SourceUrl = "https://example.com/live-pub", PublishedAt = DateTimeOffset.UtcNow, Category = "Local", Status = ArticleStatus.Published, IsMock = false, DetectedLanguage = "en" },
                new Article { CityId = 2, Headline = "Pending", Summary = "s", SourceName = "A", SourceUrl = "https://example.com/pending", PublishedAt = DateTimeOffset.UtcNow, Category = "Local", Status = ArticleStatus.PendingReview, IsMock = false, DetectedLanguage = "en" },
                new Article { CityId = 2, Headline = "Draft", Summary = "s", SourceName = "A", SourceUrl = "https://example.com/draft", PublishedAt = DateTimeOffset.UtcNow, Category = "Local", Status = ArticleStatus.Draft, IsMock = false, DetectedLanguage = "en" });
            db.SaveChanges();
        }
        var payload = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        Assert.Equal(1, payload!.Total);
        Assert.Equal("Live published", Assert.Single(payload.Items).Headline);
    }

    [Fact]
    public async Task GetArticleById_UnpublishedOrMock_Returns404()
    {
        var client = _factory.CreateSeededClient();
        int mockId, pendingId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var mock = db.Articles.First(a => a.IsMock);
            mockId = mock.Id;
            var pending = new Article { CityId = 2, Headline = "P", Summary = "s", SourceName = "A", SourceUrl = "https://example.com/p-byid", PublishedAt = DateTimeOffset.UtcNow, Category = "Local", Status = ArticleStatus.PendingReview, IsMock = false, DetectedLanguage = "en" };
            db.Articles.Add(pending);
            db.SaveChanges();
            pendingId = pending.Id;
        }
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/articles/{mockId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/articles/{pendingId}")).StatusCode);
    }

    private void InsertJhansiArticles(params Article[] articles)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Articles.AddRange(articles);
        db.SaveChanges();
    }

    private static Article Published(
        string headline,
        string sourceUrl,
        DateTimeOffset? publishedAt = null,
        string category = "Local") =>
        new()
        {
            CityId = 2,
            Headline = headline,
            Summary = "s",
            SourceName = "A",
            SourceUrl = sourceUrl,
            PublishedAt = publishedAt ?? DateTimeOffset.UtcNow,
            Category = category,
            Status = ArticleStatus.Published,
            IsMock = false,
            DetectedLanguage = "en",
        };
}
