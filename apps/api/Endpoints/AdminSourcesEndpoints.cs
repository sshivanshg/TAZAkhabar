using Microsoft.EntityFrameworkCore;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Endpoints;

public static class AdminSourcesEndpoints
{
    private const int PageSize = 20;

    public static RouteGroupBuilder MapAdminSourcesEndpoints(this RouteGroupBuilder admin)
    {
        admin.MapGet("/sources", async (AppDbContext db, CancellationToken cancellationToken) =>
            {
                var sources = await db.Sources
                    .AsNoTracking()
                    .Include(s => s.City)
                    .OrderBy(s => s.Name)
                    .ThenBy(s => s.Id)
                    .ToListAsync(cancellationToken);

                return Results.Ok(sources.Select(ToResponse).ToList());
            })
            .WithName("AdminListSources")
            .WithOpenApi()
            .Produces<List<AdminSourceResponse>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        admin.MapPost("/sources", async (
                CreateAdminSourceRequest request,
                AppDbContext db,
                CancellationToken cancellationToken) =>
            {
                if (!Enum.TryParse<SourceType>(request.Type, ignoreCase: true, out var sourceType)
                    || !Enum.TryParse<SourceKind>(request.Kind, ignoreCase: true, out var sourceKind))
                {
                    return Results.Problem(
                        title: "Invalid type or kind",
                        detail: "type must be Rss|Manual|Scrape; kind must be CityEdition|Wider.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var validation = await ValidateSourceAsync(
                    db,
                    request.Name,
                    request.FeedUrl,
                    request.City,
                    sourceType,
                    request.Language,
                    excludeId: null,
                    cancellationToken);
                if (validation.Error is not null)
                {
                    return validation.Error;
                }

                var source = new Source
                {
                    Name = validation.Name!,
                    FeedUrl = validation.FeedUrl,
                    CityId = validation.CityId,
                    Type = sourceType,
                    Kind = sourceKind,
                    Language = validation.Language!,
                    IsActive = request.IsActive,
                };
                db.Sources.Add(source);
                try
                {
                    await db.SaveChangesAsync(cancellationToken);
                }
                catch (DbUpdateException)
                {
                    return Results.Problem(
                        title: "Duplicate feed URL",
                        detail: "An RSS source with this feedUrl already exists.",
                        statusCode: StatusCodes.Status409Conflict);
                }

                source.City = validation.City!;
                return Results.Ok(ToResponse(source));
            })
            .WithName("AdminCreateSource")
            .WithOpenApi()
            .Produces<AdminSourceResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status409Conflict);

        admin.MapPatch("/sources/{id:int}", async (
                int id,
                PatchAdminSourceRequest request,
                AppDbContext db,
                CancellationToken cancellationToken) =>
            {
                var source = await db.Sources.Include(s => s.City)
                    .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
                if (source is null)
                {
                    return Results.Problem(
                        title: "Source not found",
                        detail: $"No source found with id '{id}'.",
                        statusCode: StatusCodes.Status404NotFound);
                }

                var name = request.Name ?? source.Name;
                var feedUrl = request.FeedUrl ?? source.FeedUrl;
                var citySlug = request.City ?? source.City.Slug;
                var typeName = request.Type ?? source.Type.ToString();
                var language = request.Language ?? source.Language;

                if (!Enum.TryParse<SourceType>(typeName, ignoreCase: true, out var sourceType))
                {
                    return Results.Problem(
                        title: "Invalid type",
                        detail: "type must be Rss, Manual, or Scrape.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                SourceKind sourceKind = source.Kind;
                if (request.Kind is not null)
                {
                    if (!Enum.TryParse<SourceKind>(request.Kind, ignoreCase: true, out sourceKind))
                    {
                        return Results.Problem(
                            title: "Invalid kind",
                            detail: "kind must be CityEdition or Wider.",
                            statusCode: StatusCodes.Status400BadRequest);
                    }
                }

                var validation = await ValidateSourceAsync(
                    db, name, feedUrl, citySlug, sourceType, language, id, cancellationToken);
                if (validation.Error is not null)
                {
                    return validation.Error;
                }

                source.Name = validation.Name!;
                source.FeedUrl = validation.FeedUrl;
                source.CityId = validation.CityId;
                source.Type = sourceType;
                source.Kind = sourceKind;
                source.Language = validation.Language!;
                if (request.IsActive is not null) source.IsActive = request.IsActive.Value;

                try
                {
                    await db.SaveChangesAsync(cancellationToken);
                }
                catch (DbUpdateException)
                {
                    return Results.Problem(
                        title: "Duplicate feed URL",
                        detail: "An RSS source with this feedUrl already exists.",
                        statusCode: StatusCodes.Status409Conflict);
                }

                source.City = validation.City!;
                return Results.Ok(ToResponse(source));
            })
            .WithName("AdminPatchSource")
            .WithOpenApi()
            .Produces<AdminSourceResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        admin.MapPost("/sources/{id:int}/trigger", async (
                int id,
                AppDbContext db,
                IIngestionEventBus events,
                IServiceScopeFactory scopeFactory,
                CancellationToken cancellationToken) =>
            {
                var source = await db.Sources.AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
                if (source is null)
                {
                    return Results.Problem(
                        title: "Source not found",
                        detail: $"No source found with id '{id}'.",
                        statusCode: StatusCodes.Status404NotFound);
                }

                if (!source.IsActive || (source.Type != SourceType.Rss && source.Type != SourceType.Scrape))
                {
                    return Results.Problem(
                        title: "Invalid source",
                        detail: "Only active RSS or Scrape sources can be triggered.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var run = new IngestionRun
                {
                    SourceId = source.Id,
                    StartedAt = DateTimeOffset.UtcNow,
                };
                db.IngestionRuns.Add(run);
                await db.SaveChangesAsync(cancellationToken);

                IngestionEvents.Emit(
                    events,
                    run.Id,
                    "started",
                    $"{source.Type} run queued · {source.Name}");

                var runId = run.Id;
                var sourceType = source.Type;
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await using var scope = scopeFactory.CreateAsyncScope();
                        var dbScoped = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var eventsScoped = scope.ServiceProvider.GetRequiredService<IIngestionEventBus>();
                        if (sourceType == SourceType.Scrape)
                        {
                            var worker = scope.ServiceProvider.GetRequiredService<IExtractionWorkerClient>();
                            if (!worker.IsConfigured)
                            {
                                var failed = await dbScoped.IngestionRuns.FirstOrDefaultAsync(r => r.Id == runId);
                                if (failed is not null)
                                {
                                    failed.CompletedAt = DateTimeOffset.UtcNow;
                                    failed.ErrorSummary = HtmlText.Truncate(
                                        "ExtractionWorker:BaseUrl is not configured. Start apps/ingestion_engine.",
                                        1000);
                                    await dbScoped.SaveChangesAsync();
                                }

                                eventsScoped.Publish(
                                    runId,
                                    new IngestionEventDto(
                                        "error",
                                        "Extraction worker not configured. Set ExtractionWorker:BaseUrl and start the Python worker.",
                                        DateTimeOffset.UtcNow));
                                return;
                            }

                            IngestionEvents.Emit(
                                eventsScoped,
                                runId,
                                "progress",
                                "Calling Python extraction worker…");
                            try
                            {
                                var summary = await worker.RunAsync(id, runId, CancellationToken.None);
                                var completed = await dbScoped.IngestionRuns.FirstOrDefaultAsync(r => r.Id == runId);
                                if (completed is not null)
                                {
                                    completed.CompletedAt = DateTimeOffset.UtcNow;
                                    completed.ArticlesAdded = summary.Inserted;
                                    completed.ArticlesSkipped = summary.Skipped;
                                    completed.ArticlesFailed = summary.Failed;
                                    completed.ArticlesFound = summary.Inserted + summary.Skipped + summary.Failed;
                                    await dbScoped.SaveChangesAsync();
                                }

                                IngestionEvents.Emit(
                                    eventsScoped,
                                    runId,
                                    "completed",
                                    $"Done · +{summary.Inserted} added · {summary.Skipped} skipped · {summary.Failed} failed",
                                    found: summary.Inserted + summary.Skipped + summary.Failed,
                                    added: summary.Inserted,
                                    skipped: summary.Skipped,
                                    failed: summary.Failed);
                            }
                            catch (Exception ex)
                            {
                                var failed = await dbScoped.IngestionRuns.FirstOrDefaultAsync(r => r.Id == runId);
                                if (failed is not null)
                                {
                                    failed.CompletedAt = DateTimeOffset.UtcNow;
                                    failed.ErrorSummary = HtmlText.Truncate(ex.Message, 1000);
                                    await dbScoped.SaveChangesAsync();
                                }

                                eventsScoped.Publish(
                                    runId,
                                    new IngestionEventDto(
                                        "error",
                                        HtmlText.Truncate(ex.Message, 500),
                                        DateTimeOffset.UtcNow));
                            }
                        }
                        else
                        {
                            var rss = scope.ServiceProvider.GetRequiredService<RssIngestService>();
                            await rss.RunSourceAsync(id, CancellationToken.None, runId);
                        }
                    }
                    catch (Exception ex)
                    {
                        events.Publish(
                            runId,
                            new IngestionEventDto(
                                "error",
                                HtmlText.Truncate(ex.Message, 500),
                                DateTimeOffset.UtcNow));
                    }
                });

                return Results.Json(ToRunResponse(run), statusCode: StatusCodes.Status202Accepted);
            })
            .WithName("AdminTriggerSource")
            .WithOpenApi()
            .Produces<IngestionRunResponseDto>(StatusCodes.Status202Accepted)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        admin.MapGet("/ingestion-runs/{id:int}/events", async (
                int id,
                HttpContext http,
                AppDbContext db,
                IIngestionEventBus events,
                CancellationToken cancellationToken) =>
            {
                var exists = await db.IngestionRuns.AsNoTracking()
                    .AnyAsync(r => r.Id == id, cancellationToken);
                if (!exists)
                {
                    return Results.Problem(
                        title: "Run not found",
                        detail: $"No ingestion run found with id '{id}'.",
                        statusCode: StatusCodes.Status404NotFound);
                }

                http.Response.Headers.ContentType = "text/event-stream";
                http.Response.Headers.CacheControl = "no-cache";
                http.Response.Headers.Connection = "keep-alive";
                http.Response.Headers["X-Accel-Buffering"] = "no";

                await foreach (var evt in events.Subscribe(id, cancellationToken))
                {
                    var payload = System.Text.Json.JsonSerializer.Serialize(evt, new System.Text.Json.JsonSerializerOptions
                    {
                        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
                    });
                    await http.Response.WriteAsync($"event: ingest\ndata: {payload}\n\n", cancellationToken);
                    await http.Response.Body.FlushAsync(cancellationToken);
                }

                return Results.Empty;
            })
            .WithName("AdminStreamIngestionEvents")
            .WithOpenApi()
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        admin.MapGet("/ingestion-runs", async (
                int? sourceId,
                int? page,
                AppDbContext db,
                CancellationToken cancellationToken) =>
            {
                var pageNumber = page is null or < 1 ? 1 : page.Value;
                var query = db.IngestionRuns.AsNoTracking().AsQueryable();
                if (sourceId is > 0)
                {
                    query = query.Where(r => r.SourceId == sourceId);
                }

                var total = await query.CountAsync(cancellationToken);
                var entities = await query
                    .OrderByDescending(r => r.StartedAt)
                    .Skip((pageNumber - 1) * PageSize)
                    .Take(PageSize)
                    .ToListAsync(cancellationToken);
                var items = entities.Select(ToRunResponse).ToList();

                return Results.Ok(new PagedIngestionRunsResponse(items, total, pageNumber, PageSize));
            })
            .WithName("AdminListIngestionRuns")
            .WithOpenApi()
            .Produces<PagedIngestionRunsResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        return admin;
    }

    private static async Task<(
        IResult? Error,
        string? Name,
        string? FeedUrl,
        int CityId,
        City? City,
        string? Language)> ValidateSourceAsync(
        AppDbContext db,
        string name,
        string? feedUrl,
        string citySlug,
        SourceType type,
        string language,
        int? excludeId,
        CancellationToken cancellationToken)
    {
        var trimmedName = HtmlText.Truncate(name.Trim(), 120);
        var trimmedLanguage = HtmlText.Truncate(language.Trim(), 8);
        if (string.IsNullOrWhiteSpace(trimmedName) || string.IsNullOrWhiteSpace(trimmedLanguage))
        {
            return (Results.Problem(
                title: "Invalid source",
                detail: "name and language are required.",
                statusCode: StatusCodes.Status400BadRequest), null, null, 0, null, null);
        }

        var slug = citySlug.Trim().ToLowerInvariant();
        var city = await db.Cities.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Slug == slug, cancellationToken);
        if (city is null)
        {
            return (Results.Problem(
                title: "Unknown city",
                detail: $"No city found with slug '{slug}'.",
                statusCode: StatusCodes.Status400BadRequest), null, null, 0, null, null);
        }

        string? normalizedFeed = null;
        if (type is SourceType.Rss or SourceType.Scrape)
        {
            if (string.IsNullOrWhiteSpace(feedUrl))
            {
                return (Results.Problem(
                    title: "Invalid feedUrl",
                    detail: type == SourceType.Rss
                        ? "feedUrl is required for RSS sources."
                        : "feedUrl is required for Scrape sources.",
                    statusCode: StatusCodes.Status400BadRequest), null, null, 0, null, null);
            }

            normalizedFeed = HtmlText.Truncate(feedUrl.Trim(), 500);
            if (type == SourceType.Rss)
            {
                var duplicate = await db.Sources.AsNoTracking().AnyAsync(
                    s => s.Type == SourceType.Rss
                        && s.FeedUrl == normalizedFeed
                        && (excludeId == null || s.Id != excludeId),
                    cancellationToken);
                if (duplicate)
                {
                    return (Results.Problem(
                        title: "Duplicate feed URL",
                        detail: "An RSS source with this feedUrl already exists.",
                        statusCode: StatusCodes.Status409Conflict), null, null, 0, null, null);
                }
            }
        }
        else if (!string.IsNullOrWhiteSpace(feedUrl))
        {
            normalizedFeed = HtmlText.Truncate(feedUrl.Trim(), 500);
        }

        return (null, trimmedName, normalizedFeed, city.Id, city, trimmedLanguage);
    }

    private static AdminSourceResponse ToResponse(Source s) =>
        new(
            s.Id,
            s.Name,
            s.FeedUrl,
            s.CityId,
            s.City.Slug,
            s.Type.ToString(),
            s.Kind.ToString(),
            s.Language,
            s.IsActive,
            s.LastFetchedAt,
            s.LastFetchStatus?.ToString(),
            s.LastErrorMessage);

    private static IngestionRunResponseDto ToRunResponse(IngestionRun r) =>
        new(
            r.Id,
            r.SourceId,
            r.StartedAt,
            r.CompletedAt,
            r.ArticlesFound,
            r.ArticlesAdded,
            r.ArticlesSkipped,
            r.ArticlesFailed,
            r.ErrorSummary);
}
