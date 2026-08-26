using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Ingest;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace NewsFeed.Api.Tests;

public sealed class NewsFeedWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string TestIngestKey = "test-ingest-key";
    public const string TestAdminPassword = "test-admin-password";
    public const string TestAdminJwtSigningKey = "test-admin-jwt-signing-key-min-32-chars!!";

    private readonly string _databaseName = $"newsfeed-tests-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("RssIngest:Secret", TestIngestKey);
        builder.UseSetting("Admin:Password", TestAdminPassword);
        builder.UseSetting("Admin:JwtSigningKey", TestAdminJwtSigningKey);
        builder.UseSetting("Upload:MaxBytes", "8192");
        builder.UseSetting("Upload:RootPath", Path.Combine(Path.GetTempPath(), $"newsfeed-test-uploads-{Guid.NewGuid():N}"));

        builder.ConfigureServices(services =>
        {
            var descriptors = services
                .Where(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>)
                            || d.ServiceType == typeof(AppDbContext))
                .ToList();

            foreach (var descriptor in descriptors)
            {
                services.Remove(descriptor);
            }

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));

            foreach (var descriptor in services.Where(d => d.ServiceType == typeof(IArticleIntelligence)).ToList())
            {
                services.Remove(descriptor);
            }

            services.AddSingleton<IArticleIntelligence, FakeArticleIntelligence>();

            foreach (var descriptor in services.Where(d => d.ServiceType == typeof(IArticleRewriter)).ToList())
            {
                services.Remove(descriptor);
            }

            services.AddSingleton<IArticleRewriter, FakeArticleRewriter>();

            foreach (var descriptor in services
                         .Where(d => d.ServiceType == typeof(IHostedService)
                                     && (d.ImplementationType == typeof(IngestionJobWorker)
                                         || d.ImplementationType == typeof(IngestSilenceMonitor)))
                         .ToList())
            {
                services.Remove(descriptor);
            }
        });
    }

    public HttpClient CreateSeededClient()
    {
        var client = CreateClient();
        ResetDatabase();
        return client;
    }

    public void ResetDatabase()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureDeleted();
        db.Database.EnsureCreated();

        if (!db.Cities.Any(c => c.Slug == SeedData.EmptyTestCity.Slug))
        {
            db.Cities.Add(new City
            {
                Id = SeedData.EmptyTestCity.Id,
                Name = SeedData.EmptyTestCity.Name,
                State = SeedData.EmptyTestCity.State,
                Slug = SeedData.EmptyTestCity.Slug,
            });
            db.SaveChanges();
        }
    }
}
