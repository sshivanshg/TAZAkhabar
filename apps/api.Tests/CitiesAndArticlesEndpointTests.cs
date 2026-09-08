using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Tests;

public sealed class CitiesEndpointTests : IClassFixture<TazaKhabarWebApplicationFactory>
{
    private readonly TazaKhabarWebApplicationFactory _factory;

    public CitiesEndpointTests(TazaKhabarWebApplicationFactory factory)
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
        Assert.Equal(76, cities.Count); // 75 production cities + Emptyville test fixture

        var slugs = cities.Select(c => c.Slug).ToHashSet();
        Assert.Contains("jhansi", slugs);
        Assert.Contains("kanpur", slugs);
        Assert.Contains("lucknow", slugs);
        Assert.Contains("agra", slugs);
        Assert.Contains("delhi", slugs);
        Assert.Contains("mumbai", slugs);
        Assert.Contains("bengaluru", slugs);
        Assert.Contains("chennai", slugs);
        Assert.Contains("kolkata", slugs);
        Assert.All(cities.Where(city => city.Slug != "emptyville"), city =>
        {
            Assert.InRange(city.Latitude, 6, 38);
            Assert.InRange(city.Longitude, 68, 98);
        });

        Assert.Equal(cities.OrderBy(c => c.Name).Select(c => c.Slug), cities.Select(c => c.Slug));
    }
}

public sealed class ArticlesEndpointTests : IClassFixture<TazaKhabarWebApplicationFactory>
{
    private readonly TazaKhabarWebApplicationFactory _factory;

    public ArticlesEndpointTests(TazaKhabarWebApplicationFactory factory)
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
    public async Task GetArticles_CategoryFilter_UsesEffectiveContentCategory()
    {
        var client = _factory.CreateSeededClient();
        InsertJhansiArticles(
            Published("New vaccine drive at district hospital", "https://example.com/miscategorized"),
            Published("Ward meeting", "https://example.com/local"));

        var response = await client.GetAsync("/api/articles?city=jhansi&category=Health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = await response.Content.ReadFromJsonAsync<PagedArticlesResponse>();
        Assert.NotNull(payload);
        var article = Assert.Single(payload.Items);
        Assert.Equal("New vaccine drive at district hospital", article.Headline);
        Assert.Equal("Health", article.Category);
    }

    [Fact]
    public async Task GetArticles_DateFilter_UsesCityLocalCalendarDay()
    {
        var client = _factory.CreateSeededClient();
        var day = NewsFeed.Api.Services.CityCalendar.TodayLocal().AddDays(-1);
        var (start, end) = NewsFeed.Api.Services.CityCalendar.UtcBoundsForLocalDate(day);
        InsertJhansiArticles(
            Published("On day early UTC", "https://example.com/date-early", start.AddHours(1)),
            Published("On day late UTC", "https://example.com/date-late", end.AddMinutes(-30)),
            Published("Previous local day", "https://example.com/date-prev", start.AddMinutes(-30)),
            Published("Next local day", "https://example.com/date-next", end.AddMinutes(30)));

        var response = await client.GetAsync($"/api/articles?city=jhansi&date={day:yyyy-MM-dd}");

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
        Assert.Null(article.Body);
    }

    [Fact]
    public async Task GetArticleById_IncludesBody_ListOmitsBody()
    {
        var client = _factory.CreateSeededClient();
        int id;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var article = Published("With body", "https://example.com/with-body");
            article.Body = "Full story paragraph one.\n\nParagraph two.";
            db.Articles.Add(article);
            db.SaveChanges();
            id = article.Id;
        }

        var list = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        Assert.NotNull(list);
        var listed = Assert.Single(list.Items, a => a.Id == id);
        Assert.Null(listed.Body);

        var detail = await client.GetFromJsonAsync<ArticleResponse>($"/api/articles/{id}");
        Assert.NotNull(detail);
        Assert.Equal("Full story paragraph one.\n\nParagraph two.", detail.Body);
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
    public async Task GetArticles_GlobalScope_AggregatesAcrossCities()
    {
        var client = _factory.CreateSeededClient();
        int lucknowId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            lucknowId = db.Cities.Single(c => c.Slug == "lucknow").Id;
        }

        InsertJhansiArticles(
            Published("Jhansi global scope", "https://example.com/jhansi-global"),
            new Article
            {
                CityId = lucknowId,
                Headline = "Lucknow global scope",
                Summary = "s",
                SourceName = "A",
                SourceUrl = "https://example.com/lucknow-global",
                PublishedAt = DateTimeOffset.UtcNow,
                Category = "Local",
                Status = ArticleStatus.Published,
                IsMock = false,
                DetectedLanguage = "en",
            });

        var jhansi = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        var global = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=global");

        Assert.NotNull(jhansi);
        Assert.NotNull(global);
        Assert.Equal(1, jhansi.Total);
        Assert.Equal(2, global.Total);
        Assert.Contains(global.Items, a => a.Headline == "Jhansi global scope");
        Assert.Contains(global.Items, a => a.Headline == "Lucknow global scope");
    }

    [Fact]
    public async Task GetArticles_Global_IsValidSlug()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.GetAsync("/api/articles?city=global");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
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
    public async Task GetArticles_HidesAmarUjalaEpaperEditions()
    {
        var client = _factory.CreateSeededClient();
        InsertJhansiArticles(
            Published("Amar Ujala epaper Jammu city", "https://epaper.amarujala.com/jammu-city/20260827/01.html?format=img&ed_code=jammu-city"),
            Published("Betwa flood update", "https://www.amarujala.com/uttar-pradesh/jhansi/betwa-flood"));

        var payload = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        Assert.NotNull(payload);
        Assert.Equal(1, payload.Total);
        Assert.Equal("Betwa flood update", Assert.Single(payload.Items).Headline);
    }

    [Fact]
    public async Task GetArticleById_EpaperEdition_Returns404()
    {
        var client = _factory.CreateSeededClient();
        int id;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var article = Published(
                "Amar Ujala epaper Delhi",
                "https://epaper.amarujala.com/delhi-city/20260827/01.html?format=img&ed_code=delhi-city");
            db.Articles.Add(article);
            db.SaveChanges();
            id = article.Id;
        }

        var response = await client.GetAsync($"/api/articles/{id}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
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

    [Fact]
    public async Task GetArticles_ExcludesOlderThanRetention()
    {
        var client = _factory.CreateSeededClient();
        InsertJhansiArticles(
            Published("Old", "https://example.com/old-ret", DateTimeOffset.UtcNow.AddDays(-8)),
            Published("Fresh", "https://example.com/fresh-ret", DateTimeOffset.UtcNow.AddDays(-1)));

        var payload = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        Assert.NotNull(payload);
        Assert.DoesNotContain(payload.Items, a => a.Headline == "Old");
        Assert.Contains(payload.Items, a => a.Headline == "Fresh");
    }

    [Fact]
    public async Task GetArticleById_Old_Returns404()
    {
        var client = _factory.CreateSeededClient();
        int id;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var article = Published("Ancient", "https://example.com/ancient", DateTimeOffset.UtcNow.AddDays(-10));
            db.Articles.Add(article);
            db.SaveChanges();
            id = article.Id;
        }

        var response = await client.GetAsync($"/api/articles/{id}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
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
