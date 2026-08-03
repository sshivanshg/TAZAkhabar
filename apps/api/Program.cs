using System.Threading.RateLimiting;
using NewsFeed.Api.Data;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Endpoints;
using NewsFeed.Api.Options;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console(),
        preserveStaticLogger: true);

    builder.Services.Configure<CorsOptions>(builder.Configuration.GetSection(CorsOptions.SectionName));
    builder.Services.Configure<RateLimitingOptions>(builder.Configuration.GetSection(RateLimitingOptions.SectionName));

    var corsOptions = builder.Configuration.GetSection(CorsOptions.SectionName).Get<CorsOptions>() ?? new CorsOptions();
    var rateLimitingOptions = builder.Configuration.GetSection(RateLimitingOptions.SectionName).Get<RateLimitingOptions>()
        ?? new RateLimitingOptions();

    builder.Services.AddProblemDetails();
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

            policy.WithOrigins(corsOptions.AllowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
    });

    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.OnRejected = async (context, token) =>
        {
            context.HttpContext.Response.ContentType = "application/problem+json";
            var problem = Results.Problem(
                title: "Too Many Requests",
                detail: "Rate limit exceeded. Try again later.",
                statusCode: StatusCodes.Status429TooManyRequests);
            await problem.ExecuteAsync(context.HttpContext);
        };

        options.AddFixedWindowLimiter("public", limiter =>
        {
            limiter.PermitLimit = rateLimitingOptions.PermitLimit;
            limiter.Window = TimeSpan.FromSeconds(rateLimitingOptions.WindowSeconds);
            limiter.QueueLimit = 0;
        });
    });

    var app = builder.Build();

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

    // OpenAPI JSON is always available for shared-types generation (local + CI).
    app.MapSwagger("/openapi/{documentName}.json");

    app.UseCors("Frontend");
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

public partial class Program;
