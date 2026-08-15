using System.Net;
using System.Text;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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
    public async Task CreateScrape_ReturnsOk()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        var feedUrl = "https://www.amarujala.com/uttar-pradesh/jhansi-admin-create";
        var response = await client.PostAsJsonAsync("/api/admin/sources", new
        {
            name = "Amar Ujala Scrape",
            feedUrl,
            city = "jhansi",
            type = "Scrape",
            kind = "CityEdition",
            language = "hi",
            isActive = true,
        });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<AdminSourceResponse>(TestJson.Options);
        Assert.Equal("Scrape", created!.Type);
        Assert.Equal(feedUrl, created.FeedUrl);
        Assert.Equal("jhansi", created.CitySlug);
        Assert.True(created.IsActive);
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

    [Theory]
    [InlineData("""{"feedUrl":"https://feeds.example.com/missing-name.xml","city":"jhansi","type":"Rss","kind":"CityEdition","language":"en","isActive":true}""", "Name")]
    [InlineData("""{"name":null,"feedUrl":"https://feeds.example.com/null-name.xml","city":"jhansi","type":"Rss","kind":"CityEdition","language":"en","isActive":true}""", "Name")]
    [InlineData("""{"name":"   ","feedUrl":"https://feeds.example.com/empty-name.xml","city":"jhansi","type":"Rss","kind":"CityEdition","language":"en","isActive":true}""", "Name")]
    [InlineData("""{"name":"No active","feedUrl":"https://feeds.example.com/no-active.xml","city":"jhansi","type":"Rss","kind":"CityEdition","language":"en"}""", "IsActive")]
    [InlineData("""{"name":"No feed","city":"jhansi","type":"Rss","kind":"CityEdition","language":"en","isActive":true}""", "FeedUrl")]
    public async Task CreateSource_MalformedRequiredFields_ReturnsValidationProblem(string json, string field)
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        var response = await PostJsonAsync(client, "/api/admin/sources", json);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>(TestJson.Options);
        Assert.NotNull(problem);
        Assert.Contains(field, problem!.Errors.Keys);
    }

    [Fact]
    public async Task CreateSource_WrongTypedField_Returns400()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        var response = await PostJsonAsync(
            client,
            "/api/admin/sources",
            """
            {"name":"Wrong active","feedUrl":"https://feeds.example.com/wrong-active.xml","city":"jhansi","type":"Rss","kind":"CityEdition","language":"en","isActive":"true"}
            """);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
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
        var scrape = new FakeScrapeHttpClient
        {
            Responses =
            {
                ["https://example.com/triggered-story"] = "<html><body><article><p>Triggered body.</p></article></body></html>",
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
                foreach (var d in services.Where(x => x.ServiceType == typeof(IScrapeHttpClient)).ToList())
                {
                    services.Remove(d);
                }

                services.AddSingleton<IScrapeHttpClient>(scrape);
                services.AddHostedService<IngestionJobWorker>();
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
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var run = await response.Content.ReadFromJsonAsync<IngestionRunResponseDto>(TestJson.Options);
        Assert.Equal(sourceId, run!.SourceId);
        Assert.Null(run.CompletedAt);

        IngestionRunResponseDto? completed = null;
        for (var i = 0; i < 100; i++)
        {
            await Task.Delay(100);
            var page = await client.GetFromJsonAsync<PagedIngestionRunsResponse>(
                $"/api/admin/ingestion-runs?sourceId={sourceId}&page=1",
                TestJson.Options);
            completed = page!.Items.FirstOrDefault(r => r.Id == run.Id);
            if (completed?.CompletedAt is not null)
            {
                break;
            }
        }

        Assert.NotNull(completed?.CompletedAt);
        Assert.True(
            completed!.ArticlesAdded >= 1,
            $"Expected at least one added article; failed={completed.ArticlesFailed}, skipped={completed.ArticlesSkipped}, error={completed.ErrorSummary}");

        var runs = await client.GetFromJsonAsync<PagedIngestionRunsResponse>(
            $"/api/admin/ingestion-runs?sourceId={sourceId}&page=1",
            TestJson.Options);
        Assert.Contains(runs!.Items, r => r.Id == run.Id);

        using var verifyScope = factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var job = await verifyDb.IngestionJobs.SingleAsync(j => j.IngestionRunId == run.Id);
        Assert.Equal(IngestionJobStatus.Completed, job.Status);
        Assert.NotNull(job.StartedAt);
        Assert.NotNull(job.CompletedAt);
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

    [Fact]
    public async Task PatchSource_EmptySuppliedField_Returns400()
    {
        var client = await AdminAuthTests.CreateAuthedClientAsync(_factory);
        var create = await client.PostAsJsonAsync("/api/admin/sources", new
        {
            name = "Patch Source",
            feedUrl = "https://feeds.example.com/patch-source.xml",
            city = "jhansi",
            type = "Rss",
            kind = "CityEdition",
            language = "en",
            isActive = true,
        });
        create.EnsureSuccessStatusCode();
        var source = await create.Content.ReadFromJsonAsync<AdminSourceResponse>(TestJson.Options);

        var response = await client.PatchAsJsonAsync($"/api/admin/sources/{source!.Id}", new { name = " " });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static Task<HttpResponseMessage> PostJsonAsync(HttpClient client, string url, string json) =>
        client.PostAsync(url, new StringContent(json, Encoding.UTF8, "application/json"));
}
