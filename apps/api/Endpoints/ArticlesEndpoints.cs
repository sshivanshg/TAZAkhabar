using NewsFeed.Api.Data;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace NewsFeed.Api.Endpoints;

public static class ArticlesEndpoints
{
    private const int DefaultLimit = 20;
    private const int MaxLimit = 50;
    private const int MaxQueryLength = 100;
    private const string PublicCacheControl = "public, max-age=60";

    public static RouteGroupBuilder MapArticlesEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/articles", async (
                string? city,
                string? category,
                string? q,
                string? lang,
                string? date,
                int? offset,
                int? limit,
                AppDbContext db,
                IArticlePresentationService presentation,
                HttpContext httpContext,
                CancellationToken cancellationToken) =>
            {
                if (string.IsNullOrWhiteSpace(city))
                {
                    return Results.Problem(
                        title: "Invalid city",
                        detail: "Query parameter 'city' (slug) is required.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                if (q is { Length: > MaxQueryLength })
                {
                    return Results.Problem(
                        title: "Invalid q",
                        detail: $"Query parameter 'q' must be at most {MaxQueryLength} characters.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                DateOnly? localDate = null;
                if (!string.IsNullOrWhiteSpace(date))
                {
                    if (!CityCalendar.TryParseDateParam(date, out var parsed, out var dateError))
                    {
                        return Results.Problem(
                            title: "Invalid date",
                            detail: dateError,
                            statusCode: StatusCodes.Status400BadRequest);
                    }

                    localDate = parsed;
                }

                var slug = city.Trim().ToLowerInvariant();
                var cityEntity = await db.Cities
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Slug == slug, cancellationToken);

                if (cityEntity is null)
                {
                    return Results.Problem(
                        title: "Unknown city",
                        detail: $"No city found with slug '{slug}'.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var pageOffset = Math.Max(offset ?? 0, 0);
                var pageLimit = limit ?? DefaultLimit;
                if (pageLimit < 1)
                {
                    pageLimit = DefaultLimit;
                }

                pageLimit = Math.Min(pageLimit, MaxLimit);

                var query = db.Articles
                    .AsNoTracking()
                    .Where(a => a.CityId == cityEntity.Id
                        && a.Status == ArticleStatus.Published
                        && !a.IsMock);

                if (!string.IsNullOrWhiteSpace(category))
                {
                    var categoryFilter = category.Trim();
                    query = query.Where(a => a.Category.ToLower() == categoryFilter.ToLower());
                }

                if (!string.IsNullOrWhiteSpace(q))
                {
                    var needle = q.Trim().ToLowerInvariant();
                    query = query.Where(a => a.Headline.ToLower().Contains(needle));
                }

                if (localDate is { } day)
                {
                    var (startUtc, endUtc) = CityCalendar.UtcBoundsForLocalDate(day, cityEntity);
                    query = query.Where(a => a.PublishedAt >= startUtc && a.PublishedAt < endUtc);
                }

                var total = await query.CountAsync(cancellationToken);

                var entities = await query
                    .OrderByDescending(a => a.PublishedAt)
                    .Skip(pageOffset)
                    .Take(pageLimit)
                    .ToListAsync(cancellationToken);

                var items = await presentation.PresentManyAsync(entities, lang, cancellationToken);

                httpContext.Response.Headers.CacheControl = PublicCacheControl;
                return Results.Ok(new PagedArticlesResponse(items, total, pageOffset, pageLimit));
            })
            .WithName("GetArticles")
            .WithOpenApi()
            .Produces<PagedArticlesResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapGet("/articles/dates", async (
                string? city,
                string? category,
                int? days,
                AppDbContext db,
                HttpContext httpContext,
                CancellationToken cancellationToken) =>
            {
                if (string.IsNullOrWhiteSpace(city))
                {
                    return Results.Problem(
                        title: "Invalid city",
                        detail: "Query parameter 'city' (slug) is required.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var windowDays = days ?? CityCalendar.DefaultDatesWindowDays;
                if (windowDays < 1)
                {
                    windowDays = CityCalendar.DefaultDatesWindowDays;
                }

                windowDays = Math.Min(windowDays, CityCalendar.DefaultDatesWindowDays);

                var slug = city.Trim().ToLowerInvariant();
                var cityEntity = await db.Cities
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Slug == slug, cancellationToken);

                if (cityEntity is null)
                {
                    return Results.Problem(
                        title: "Unknown city",
                        detail: $"No city found with slug '{slug}'.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var todayLocal = CityCalendar.TodayLocal(cityEntity);
                var windowStartLocal = todayLocal.AddDays(-(windowDays - 1));
                var (windowStartUtc, _) = CityCalendar.UtcBoundsForLocalDate(windowStartLocal, cityEntity);
                var (_, windowEndUtc) = CityCalendar.UtcBoundsForLocalDate(todayLocal, cityEntity);

                var query = db.Articles
                    .AsNoTracking()
                    .Where(a => a.CityId == cityEntity.Id
                        && a.Status == ArticleStatus.Published
                        && !a.IsMock
                        && a.PublishedAt >= windowStartUtc
                        && a.PublishedAt < windowEndUtc);

                if (!string.IsNullOrWhiteSpace(category))
                {
                    var categoryFilter = category.Trim();
                    query = query.Where(a => a.Category.ToLower() == categoryFilter.ToLower());
                }

                var publishedAts = await query
                    .Select(a => a.PublishedAt)
                    .ToListAsync(cancellationToken);

                var dates = publishedAts
                    .Select(at => CityCalendar.ToLocalDate(at, cityEntity))
                    .Distinct()
                    .OrderByDescending(d => d)
                    .Select(d => d.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture))
                    .ToList();

                httpContext.Response.Headers.CacheControl = PublicCacheControl;
                return Results.Ok(new ArticleDatesResponse(dates));
            })
            .WithName("GetArticleDates")
            .WithOpenApi()
            .Produces<ArticleDatesResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapGet("/articles/{id:int}", async (
                int id,
                string? lang,
                AppDbContext db,
                IArticlePresentationService presentation,
                HttpContext httpContext,
                CancellationToken cancellationToken) =>
            {
                var entity = await db.Articles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(
                        a => a.Id == id
                            && a.Status == ArticleStatus.Published
                            && !a.IsMock,
                        cancellationToken);

                if (entity is null)
                {
                    return Results.Problem(
                        title: "Article not found",
                        detail: $"No article found with id '{id}'.",
                        statusCode: StatusCodes.Status404NotFound);
                }

                var article = await presentation.PresentAsync(entity, lang, cancellationToken);

                httpContext.Response.Headers.CacheControl = PublicCacheControl;
                return Results.Ok(article);
            })
            .WithName("GetArticleById")
            .WithOpenApi()
            .Produces<ArticleResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        return api;
    }
}
