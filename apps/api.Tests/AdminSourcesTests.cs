using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class AdminSourcesTests : IClassFixture<NewsFeedWebApplicationFactory>
{
    private readonly NewsFeedWebApplicationFactory _factory;

    public AdminSourcesTests(NewsFeedWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ListSources_OrderedByName()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        var sources = await client.GetFromJsonAsync<List<AdminSourceResponse>>("/api/admin/sources", TestJson.Options);
        Assert.NotNull(sources);
        Assert.True(sources.Count >= 4);
        Assert.Equal(sources.OrderBy(s => s.Name).ThenBy(s => s.Id).Select(s => s.Id), sources.Select(s => s.Id));
    }

    [Fact]
    public async Task CreateRss_And_DuplicateFeedUrl_Returns409()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        var body = new
        {
            name = "Test Feed",
            feedUrl = "https://feeds.example.com/unique-admin-source.xml",
            city = "jhansi",
            type = "Rss",
            kind = "CityEdition",
            language = "en",
            isActive = true,
        };
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/admin/sources", body)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/admin/sources", body)).StatusCode);
    }

    [Fact]
    public async Task Trigger_WritesIngestionRun()
    {
        var feedUrl = "https://feeds.example.com/trigger-now.xml";
        var fake = new FakeRssFeedClient
        {
            Responses =
            {
                [feedUrl] = """
                    <?xml version="1.0"?><rss version="2.0"><channel>
                      <item>
                        <title>Triggered story</title>
                        <link>https://example.com/triggered-story</link>
                        <description>from trigger</description>
                      </item>
                    </channel></rss>
                    """,
            },
        };

        using var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                foreach (var d in services.Where(x => x.ServiceType == typeof(IRssFeedClient)).ToList())
                {
                    services.Remove(d);
                }

                services.AddSingleton<IRssFeedClient>(fake);
            });
        });

        var client = factory.CreateClient();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureDeleted();
            db.Database.EnsureCreated();
        }

        var login = await client.PostAsJsonAsync("/api/admin/login", new
        {
            password = NewsFeedWebApplicationFactory.TestAdminPassword,
            displayName = "Ada",
        });
        var token = (await login.Content.ReadFromJsonAsync<AdminLoginResponse>())!.Token;
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        int sourceId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var source = new Source
            {
                Name = "Triggerable",
                FeedUrl = feedUrl,
                CityId = 2,
                Type = SourceType.Rss,
                Kind = SourceKind.CityEdition,
                Language = "en",
                IsActive = true,
            };
            db.Sources.Add(source);
            db.SaveChanges();
            sourceId = source.Id;
        }

        var response = await client.PostAsync($"/api/admin/sources/{sourceId}/trigger", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var run = await response.Content.ReadFromJsonAsync<IngestionRunResponseDto>(TestJson.Options);
        Assert.Equal(sourceId, run!.SourceId);
        Assert.True(run.ArticlesAdded >= 1);
        Assert.NotNull(run.CompletedAt);

        var runs = await client.GetFromJsonAsync<PagedIngestionRunsResponse>(
            $"/api/admin/ingestion-runs?sourceId={sourceId}&page=1",
            TestJson.Options);
        Assert.Contains(runs!.Items, r => r.Id == run.Id);
    }

    [Fact]
    public async Task Trigger_Inactive_Returns400()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        int id;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var source = new Source
            {
                Name = "Inactive",
                FeedUrl = "https://feeds.example.com/inactive.xml",
                CityId = 2,
                Type = SourceType.Rss,
                Kind = SourceKind.CityEdition,
                Language = "en",
                IsActive = false,
            };
            db.Sources.Add(source);
            db.SaveChanges();
            id = source.Id;
        }

        var response = await client.PostAsync($"/api/admin/sources/{id}/trigger", null);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
