using System.Text;
using System.Threading.RateLimiting;
using NewsFeed.Api;
using NewsFeed.Api.Data;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Endpoints;
using NewsFeed.Api.Ingest;
using NewsFeed.Api.Options;
using NewsFeed.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    // Render Free/shared kernels cap inotify at 128; JSON file watchers blow that at boot.
    Environment.SetEnvironmentVariable("DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE", "false");
    LoadDotEnv();

    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console(),
        preserveStaticLogger: true);

    builder.Services.Configure<CorsOptions>(builder.Configuration.GetSection(CorsOptions.SectionName));
    builder.Services.Configure<RateLimitingOptions>(builder.Configuration.GetSection(RateLimitingOptions.SectionName));
    builder.Services.Configure<RssIngestOptions>(builder.Configuration.GetSection(RssIngestOptions.SectionName));
    builder.Services.Configure<ArticleRetentionOptions>(
        builder.Configuration.GetSection(ArticleRetentionOptions.SectionName));
    builder.Services.Configure<AdminOptions>(builder.Configuration.GetSection(AdminOptions.SectionName));
    builder.Services.Configure<ArticleIntelligenceOptions>(
        builder.Configuration.GetSection(ArticleIntelligenceOptions.SectionName));
    builder.Services.Configure<UploadOptions>(builder.Configuration.GetSection(UploadOptions.SectionName));
    if (builder.Environment.IsDevelopment())
    {
        builder.Services.PostConfigure<UploadOptions>(upload =>
        {
            if (string.IsNullOrWhiteSpace(upload.RootPath))
            {
                upload.RootPath = Path.Combine(Path.GetTempPath(), "newsfeed-uploads");
            }
        });
    }

    builder.Services.AddHttpClient("rss", client =>
    {
        client.Timeout = TimeSpan.FromSeconds(15);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("NewsFeedIngest/0.1");
    });
    builder.Services.AddHttpClient(ScrapeHttpClient.HttpClientName, client =>
    {
        client.Timeout = TimeSpan.FromSeconds(15);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("NewsFeedIngest/0.1");
    }).ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
    {
        AllowAutoRedirect = false,
    });
    builder.Services.AddHttpClient(ArticleImageHtmlClient.HttpClientName, client =>
    {
        client.Timeout = TimeSpan.FromSeconds(15);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("NewsFeedIngest/0.1");
    }).ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
    {
        AllowAutoRedirect = false,
    });
    builder.Services.AddHttpClient(ClaudeArticleIntelligence.HttpClientName, client =>
    {
        client.Timeout = TimeSpan.FromSeconds(90);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("NewsFeedIngest/0.1");
    });
    builder.Services.AddSingleton<IIngestionEventBus, IngestionEventBus>();
    builder.Services.AddSingleton<IRssFeedClient, RssFeedClient>();
    builder.Services.AddSingleton<IScrapeHttpClient, ScrapeHttpClient>();
    builder.Services.AddSingleton<IArticleImageHtmlClient, ArticleImageHtmlClient>();
    builder.Services.AddSingleton<IArticleIntelligence, ClaudeArticleIntelligence>();
    builder.Services.AddSingleton<PdfProcessingQueue>();
    builder.Services.AddSingleton<ImageEnrichmentQueue>();
    builder.Services.AddScoped<RssIngestService>();
    builder.Services.AddScoped<ArticlePurgeService>();
    builder.Services.AddScoped<ArticleBodyBackfillService>();
    builder.Services.AddScoped<PdfIngestService>();
    builder.Services.AddScoped<ScrapeIngestService>();
    builder.Services.AddScoped<ArticleImageEnrichmentService>();
    builder.Services.AddScoped<NewsFeed.Api.Services.IArticlePresentationService, NewsFeed.Api.Services.ArticlePresentationService>();
    builder.Services.AddHostedService<PdfProcessingWorker>();
    builder.Services.AddHostedService<ImageEnrichmentWorker>();

    var corsOptions = builder.Configuration.GetSection(CorsOptions.SectionName).Get<CorsOptions>() ?? new CorsOptions();
    var rateLimitingOptions = builder.Configuration.GetSection(RateLimitingOptions.SectionName).Get<RateLimitingOptions>()
        ?? new RateLimitingOptions();
    var adminOptions = builder.Configuration.GetSection(AdminOptions.SectionName).Get<AdminOptions>() ?? new AdminOptions();

    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });

    builder.Services.AddProblemDetails();
    builder.Services.ConfigureHttpJsonOptions(options =>
    {
        options.SerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter(
                System.Text.Json.JsonNamingPolicy.CamelCase));
    });
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new() { Title = "NewsFeed API", Version = "v1" });
    });

    var connectionString = builder.Configuration.GetConnectionString("Database");
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException(
            "Connection string 'Database' is missing. Set ConnectionStrings__Database via environment variables.");
    }

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString));

    builder.Services.AddHealthChecks()
        .AddNpgSql(connectionString, name: "postgres");

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Frontend", policy =>
        {
            if (corsOptions.AllowedOrigins.Length == 0)
            {
                throw new InvalidOperationException(
                    "Cors:AllowedOrigins must contain at least one origin. Wildcard CORS is not allowed.");
            }

            policy.SetIsOriginAllowed(origin => CorsOrigin.IsAllowed(origin, corsOptions.AllowedOrigins))
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
    });

    if (!string.IsNullOrEmpty(adminOptions.JwtSigningKey))
    {
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(adminOptions.JwtSigningKey)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1),
                    NameClaimType = System.Security.Claims.ClaimTypes.Name,
                };
            });
    }
    else
    {
        builder.Services.AddAuthentication();
    }

    builder.Services.AddAuthorization();

    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.OnRejected = async (context, token) =>
        {
            context.HttpContext.Response.Headers.RetryAfter = rateLimitingOptions.WindowSeconds.ToString();
            context.HttpContext.Response.ContentType = "application/problem+json";
            var problem = Results.Problem(
                title: "Too Many Requests",
                detail: "Rate limit exceeded. Try again later.",
                statusCode: StatusCodes.Status429TooManyRequests);
            await problem.ExecuteAsync(context.HttpContext);
        };

        options.AddPolicy("public", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = rateLimitingOptions.PermitLimit,
                    Window = TimeSpan.FromSeconds(rateLimitingOptions.WindowSeconds),
                    QueueLimit = 0,
                }));

        options.AddPolicy("admin-login", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                }));
    });

    var app = builder.Build();

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (db.Database.IsRelational())
        {
            await db.Database.MigrateAsync();
        }
    }

    app.UseSerilogRequestLogging();
    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            var feature = context.Features.Get<IExceptionHandlerFeature>();
            var logger = context.RequestServices.GetRequiredService<ILoggerFactory>()
                .CreateLogger("ExceptionHandler");
            logger.LogError(feature?.Error, "Unhandled exception");

            await Results.Problem(
                    title: "An unexpected error occurred.",
                    statusCode: StatusCodes.Status500InternalServerError)
                .ExecuteAsync(context);
        });
    });

    app.UseStatusCodePages(async statusCodeContext =>
    {
        var http = statusCodeContext.HttpContext;
        if (http.Response.HasStarted || http.Response.ContentLength is > 0)
        {
            return;
        }

        await Results.Problem(statusCode: http.Response.StatusCode).ExecuteAsync(http);
    });

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.MapSwagger("/openapi/{documentName}.json");

    app.UseForwardedHeaders();

    app.Use(async (context, next) =>
    {
        context.Response.Headers.XContentTypeOptions = "nosniff";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        await next();
    });

    app.UseCors("Frontend");
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseRateLimiter();

    var api = app.MapGroup("/api")
        .RequireRateLimiting("public");

    api.MapGet("/health", async (AppDbContext db, CancellationToken cancellationToken) =>
        {
            var canConnect = await db.Database.CanConnectAsync(cancellationToken);
            var response = new HealthResponse(
                Status: canConnect ? "healthy" : "degraded",
                Service: "newsfeed-api",
                TimestampUtc: DateTimeOffset.UtcNow,
                Database: canConnect ? "up" : "down");

            return canConnect
                ? Results.Ok(response)
                : Results.Json(response, statusCode: StatusCodes.Status503ServiceUnavailable);
        })
        .WithName("GetHealth")
        .WithOpenApi()
        .Produces<HealthResponse>(StatusCodes.Status200OK)
        .Produces<HealthResponse>(StatusCodes.Status503ServiceUnavailable)
        .ProducesProblem(StatusCodes.Status429TooManyRequests);

    api.MapCitiesEndpoints();
    api.MapArticlesEndpoints();
    api.MapIngestEndpoints();
    api.MapMaintenanceEndpoints();

    var admin = api.MapGroup("/admin");
    admin.MapAdminAuthEndpoints();

    var adminSecure = admin.MapGroup("")
        .RequireAuthorization();
    adminSecure.MapAdminArticlesEndpoints();
    adminSecure.MapAdminSourcesEndpoints();
    adminSecure.MapAdminUploadsEndpoints();

    app.MapHealthChecks("/healthz");

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}

static void LoadDotEnv()
{
    var current = new DirectoryInfo(Directory.GetCurrentDirectory());
    while (current is not null)
    {
        var path = Path.Combine(current.FullName, ".env");
        if (File.Exists(path))
        {
            foreach (var rawLine in File.ReadLines(path))
            {
                var line = rawLine.Trim();
                if (line.Length == 0 || line.StartsWith('#'))
                {
                    continue;
                }

                var separator = line.IndexOf('=');
                if (separator <= 0)
                {
                    continue;
                }

                var key = line[..separator].Trim();
                var value = line[(separator + 1)..].Trim().Trim('"');
                if (key.Length > 0
                    && !key.StartsWith("ConnectionStrings__", StringComparison.Ordinal)
                    && Environment.GetEnvironmentVariable(key) is null)
                {
                    Environment.SetEnvironmentVariable(key, value);
                }
            }

            return;
        }

        current = current.Parent;
    }
}

public partial class Program;
