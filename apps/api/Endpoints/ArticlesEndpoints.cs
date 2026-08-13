using NewsFeed.Api.Data;
using NewsFeed.Api.Dtos;
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
                int? offset,
                int? limit,
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

                if (q is { Length: > MaxQueryLength })
                {
                    return Results.Problem(
                        title: "Invalid q",
                        detail: $"Query parameter 'q' must be at most {MaxQueryLength} characters.",
                        statusCode: StatusCodes.Status400BadRequest);
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

                var total = await query.CountAsync(cancellationToken);

                var items = await query
                    .OrderByDescending(a => a.PublishedAt)
                    .Skip(pageOffset)
                    .Take(pageLimit)
                    .Select(a => new ArticleResponse(
                        a.Id,
                        a.CityId,
                        a.Headline,
                        a.Summary,
                        a.SourceName,
                        a.SourceUrl,
                        a.PublishedAt,
                        a.Category,
                        a.ImageUrl))
                    .ToListAsync(cancellationToken);

                httpContext.Response.Headers.CacheControl = PublicCacheControl;
                return Results.Ok(new PagedArticlesResponse(items, total, pageOffset, pageLimit));
            })
            .WithName("GetArticles")
            .WithOpenApi()
            .Produces<PagedArticlesResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapGet("/articles/{id:int}", async (
                int id,
                AppDbContext db,
                HttpContext httpContext,
                CancellationToken cancellationToken) =>
            {
                var article = await db.Articles
                    .AsNoTracking()
                    .Where(a => a.Id == id
                        && a.Status == ArticleStatus.Published
                        && !a.IsMock)
                    .Select(a => new ArticleResponse(
                        a.Id,
                        a.CityId,
                        a.Headline,
                        a.Summary,
                        a.SourceName,
                        a.SourceUrl,
                        a.PublishedAt,
                        a.Category,
                        a.ImageUrl))
                    .FirstOrDefaultAsync(cancellationToken);

                if (article is null)
                {
                    return Results.Problem(
                        title: "Article not found",
                        detail: $"No article found with id '{id}'.",
                        statusCode: StatusCodes.Status404NotFound);
                }

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
