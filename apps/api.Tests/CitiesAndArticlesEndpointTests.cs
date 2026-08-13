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
        Assert.True(cities.Count >= 4);

        var slugs = cities.Select(c => c.Slug).ToHashSet();
        Assert.Contains("jhansi", slugs);
        Assert.Contains("kanpur", slugs);
        Assert.Contains("lucknow", slugs);
        Assert.Contains("agra", slugs);

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
        var response = await client.GetAsync("/api/articles?city=jhansi");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<PagedArticlesResponse>();
        Assert.NotNull(payload);
        Assert.True(payload.Total >= 8);
        Assert.NotEmpty(payload.Items);
        Assert.Equal(0, payload.Offset);
        Assert.Equal(20, payload.Limit);

        var dates = payload.Items.Select(a => a.PublishedAt).ToList();
        Assert.Equal(dates.OrderByDescending(d => d), dates);
        Assert.All(payload.Items, a => Assert.Contains("[MOCK]", a.Headline));
    }

    [Fact]
    public async Task GetArticles_SupportsOffsetPagination()
    {
        var client = _factory.CreateSeededClient();
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
        var response = await client.GetAsync("/api/articles?city=jhansi&category=Health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<PagedArticlesResponse>();
        Assert.NotNull(payload);
        Assert.NotEmpty(payload.Items);
        Assert.All(payload.Items, a => Assert.Equal("Health", a.Category, ignoreCase: true));
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
    public async Task GetArticles_Jhansi_KeepsMocks_WhenNoIngestedRows()
    {
        var client = _factory.CreateSeededClient();
        var payload = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        Assert.All(payload!.Items, a => Assert.StartsWith("[MOCK]", a.Headline));
    }

    [Fact]
    public async Task GetArticles_Jhansi_HidesMocks_WhenRealRowExists()
    {
        var client = _factory.CreateSeededClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Articles.Add(new Article
            {
                CityId = 2,
                Headline = "Ward sabha tonight",
                Summary = "A ward sabha is scheduled this evening.",
                SourceName = "Amar Ujala",
                SourceUrl = "https://www.amarujala.com/jhansi/ward-sabha-tonight-task7",
                PublishedAt = DateTimeOffset.UtcNow,
                Category = "Local",
            });
            db.SaveChanges();
        }

        var payload = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=jhansi");
        Assert.DoesNotContain(payload!.Items, a => a.Headline.StartsWith("[MOCK]", StringComparison.Ordinal));
        Assert.Contains(payload.Items, a => a.Headline == "Ward sabha tonight");
    }

    [Fact]
    public async Task GetArticles_Lucknow_StillMock_AfterJhansiRealRow()
    {
        var client = _factory.CreateSeededClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Articles.Add(new Article
            {
                CityId = 2,
                Headline = "Ward sabha tonight",
                Summary = "A ward sabha is scheduled this evening.",
                SourceName = "Amar Ujala",
                SourceUrl = "https://www.amarujala.com/jhansi/ward-sabha-lucknow-isolation-task7",
                PublishedAt = DateTimeOffset.UtcNow,
                Category = "Local",
            });
            db.SaveChanges();
        }

        var payload = await client.GetFromJsonAsync<PagedArticlesResponse>("/api/articles?city=lucknow");
        Assert.NotEmpty(payload!.Items);
        Assert.All(payload.Items, a => Assert.Contains("[MOCK]", a.Headline));
    }
}
