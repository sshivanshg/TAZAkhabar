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
                var validation = await ValidateSourceAsync(
                    db,
                    request.Name,
                    request.FeedUrl,
                    request.City,
                    request.Type,
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
                    Type = request.Type,
                    Kind = request.Kind,
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
                var type = request.Type ?? source.Type;
                var language = request.Language ?? source.Language;

                var validation = await ValidateSourceAsync(
                    db, name, feedUrl, citySlug, type, language, id, cancellationToken);
                if (validation.Error is not null)
                {
                    return validation.Error;
                }

                source.Name = validation.Name!;
                source.FeedUrl = validation.FeedUrl;
                source.CityId = validation.CityId;
                source.Type = type;
                if (request.Kind is not null) source.Kind = request.Kind.Value;
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
                RssIngestService ingest,
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

                if (!source.IsActive || source.Type != SourceType.Rss)
                {
                    return Results.Problem(
                        title: "Invalid source",
                        detail: "Only active RSS sources can be triggered.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var run = await ingest.RunSourceAsync(id, cancellationToken);
                return Results.Ok(ToRunResponse(run));
            })
            .WithName("AdminTriggerSource")
            .WithOpenApi()
            .Produces<IngestionRunResponseDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
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
        if (type == SourceType.Rss)
        {
            if (string.IsNullOrWhiteSpace(feedUrl))
            {
                return (Results.Problem(
                    title: "Invalid feedUrl",
                    detail: "feedUrl is required for RSS sources.",
                    statusCode: StatusCodes.Status400BadRequest), null, null, 0, null, null);
            }

            normalizedFeed = HtmlText.Truncate(feedUrl.Trim(), 500);
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
            s.Type,
            s.Kind,
            s.Language,
            s.IsActive,
            s.LastFetchedAt,
            s.LastFetchStatus,
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
