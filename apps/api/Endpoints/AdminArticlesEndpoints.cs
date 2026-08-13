using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Endpoints;

public static class AdminArticlesEndpoints
{
    public static readonly string[] AllowedCategories =
        ["Local", "State", "National", "Business", "Health", "Sports"];

    private const int PageSize = 20;

    public static RouteGroupBuilder MapAdminArticlesEndpoints(this RouteGroupBuilder admin)
    {
        admin.MapGet("/articles", async (
                string? status,
                string? city,
                int? source,
                int? page,
                AppDbContext db,
                CancellationToken cancellationToken) =>
            {
                var pageNumber = page is null or < 1 ? 1 : page.Value;
                var query = db.Articles.AsNoTracking().AsQueryable();

                if (!string.IsNullOrWhiteSpace(status))
                {
                    if (!Enum.TryParse<ArticleStatus>(status.Trim(), ignoreCase: true, out var parsed))
                    {
                        return Results.Problem(
                            title: "Invalid status",
                            detail: $"Unknown status '{status}'.",
                            statusCode: StatusCodes.Status400BadRequest);
                    }

                    query = query.Where(a => a.Status == parsed);
                }

                if (!string.IsNullOrWhiteSpace(city))
                {
                    var slug = city.Trim().ToLowerInvariant();
                    var cityEntity = await db.Cities.AsNoTracking()
                        .FirstOrDefaultAsync(c => c.Slug == slug, cancellationToken);
                    if (cityEntity is null)
                    {
                        return Results.Problem(
                            title: "Unknown city",
                            detail: $"No city found with slug '{slug}'.",
                            statusCode: StatusCodes.Status400BadRequest);
                    }

                    query = query.Where(a => a.CityId == cityEntity.Id);
                }

                if (source is > 0)
                {
                    query = query.Where(a => a.SourceId == source);
                }

                var total = await query.CountAsync(cancellationToken);
                var entities = await query
                    .OrderByDescending(a => a.PublishedAt)
                    .Skip((pageNumber - 1) * PageSize)
                    .Take(PageSize)
                    .ToListAsync(cancellationToken);
                var items = entities.Select(ToResponse).ToList();

                return Results.Ok(new PagedAdminArticlesResponse(items, total, pageNumber, PageSize));
            })
            .WithName("AdminListArticles")
            .WithOpenApi()
            .Produces<PagedAdminArticlesResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        admin.MapPatch("/articles/{id:int}", async (
                int id,
                PatchAdminArticleRequest request,
                AppDbContext db,
                CancellationToken cancellationToken) =>
            {
                var article = await db.Articles.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
                if (article is null)
                {
                    return Results.Problem(
                        title: "Article not found",
                        detail: $"No article found with id '{id}'.",
                        statusCode: StatusCodes.Status404NotFound);
                }

                if (request.Headline is not null)
                {
                    var headline = HtmlText.Truncate(request.Headline.Trim(), 300);
                    if (string.IsNullOrWhiteSpace(headline))
                    {
                        return Results.Problem(
                            title: "Invalid headline",
                            detail: "headline cannot be empty.",
                            statusCode: StatusCodes.Status400BadRequest);
                    }

                    article.Headline = headline;
                }

                if (request.Summary is not null)
                {
                    var summary = HtmlText.Truncate(request.Summary.Trim(), 1000);
                    if (string.IsNullOrWhiteSpace(summary))
                    {
                        return Results.Problem(
                            title: "Invalid summary",
                            detail: "summary cannot be empty.",
                            statusCode: StatusCodes.Status400BadRequest);
                    }

                    article.Summary = summary;
                }

                if (request.Category is not null)
                {
                    if (!IsAllowedCategory(request.Category))
                    {
                        return Results.Problem(
                            title: "Invalid category",
                            detail: $"category must be one of: {string.Join(", ", AllowedCategories)}.",
                            statusCode: StatusCodes.Status400BadRequest);
                    }

                    article.Category = request.Category.Trim();
                }

                if (request.City is not null)
                {
                    var slug = request.City.Trim().ToLowerInvariant();
                    var cityEntity = await db.Cities.AsNoTracking()
                        .FirstOrDefaultAsync(c => c.Slug == slug, cancellationToken);
                    if (cityEntity is null)
                    {
                        return Results.Problem(
                            title: "Unknown city",
                            detail: $"No city found with slug '{slug}'.",
                            statusCode: StatusCodes.Status400BadRequest);
                    }

                    article.CityId = cityEntity.Id;
                }

                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(ToResponse(article));
            })
            .WithName("AdminPatchArticle")
            .WithOpenApi()
            .Produces<AdminArticleResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        admin.MapPost("/articles/{id:int}/publish", async (
                int id,
                ClaimsPrincipal user,
                AppDbContext db,
                CancellationToken cancellationToken) =>
            await Transition(id, ArticleStatus.Published, user, db, cancellationToken))
            .WithName("AdminPublishArticle")
            .WithOpenApi()
            .Produces<AdminArticleResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        admin.MapPost("/articles/{id:int}/reject", async (
                int id,
                ClaimsPrincipal user,
                AppDbContext db,
                CancellationToken cancellationToken) =>
            await Transition(id, ArticleStatus.Rejected, user, db, cancellationToken))
            .WithName("AdminRejectArticle")
            .WithOpenApi()
            .Produces<AdminArticleResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        admin.MapPost("/articles", async (
                CreateAdminArticleRequest request,
                ClaimsPrincipal user,
                AppDbContext db,
                CancellationToken cancellationToken) =>
            {
                if (!IsAllowedCategory(request.Category))
                {
                    return Results.Problem(
                        title: "Invalid category",
                        detail: $"category must be one of: {string.Join(", ", AllowedCategories)}.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var slug = request.City.Trim().ToLowerInvariant();
                var cityEntity = await db.Cities.AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Slug == slug, cancellationToken);
                if (cityEntity is null)
                {
                    return Results.Problem(
                        title: "Unknown city",
                        detail: $"No city found with slug '{slug}'.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var headline = HtmlText.Truncate(request.Headline.Trim(), 300);
                var summary = HtmlText.Truncate(request.Summary.Trim(), 1000);
                var sourceName = HtmlText.Truncate(request.SourceName.Trim(), 120);
                var sourceUrl = HtmlText.Truncate(request.SourceUrl.Trim(), 500);
                if (string.IsNullOrWhiteSpace(headline)
                    || string.IsNullOrWhiteSpace(summary)
                    || string.IsNullOrWhiteSpace(sourceName)
                    || string.IsNullOrWhiteSpace(sourceUrl))
                {
                    return Results.Problem(
                        title: "Invalid article",
                        detail: "headline, summary, sourceName, and sourceUrl are required.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                if (await db.Articles.AnyAsync(a => a.SourceUrl == sourceUrl, cancellationToken))
                {
                    return Results.Problem(
                        title: "Duplicate source URL",
                        detail: "An article with this sourceUrl already exists.",
                        statusCode: StatusCodes.Status409Conflict);
                }

                var now = DateTimeOffset.UtcNow;
                var editor = EditorName(user);
                var article = new Article
                {
                    CityId = cityEntity.Id,
                    Headline = headline,
                    Summary = summary,
                    SourceName = sourceName,
                    SourceUrl = sourceUrl,
                    PublishedAt = now,
                    Category = request.Category.Trim(),
                    Status = request.PublishNow ? ArticleStatus.Published : ArticleStatus.Draft,
                    IsMock = false,
                    IngestedAt = null,
                    SourceId = null,
                    ReviewedBy = request.PublishNow ? editor : null,
                    ReviewedAt = request.PublishNow ? now : null,
                };

                db.Articles.Add(article);
                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(ToResponse(article));
            })
            .WithName("AdminCreateArticle")
            .WithOpenApi()
            .Produces<AdminArticleResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status409Conflict);

        return admin;
    }

    private static async Task<IResult> Transition(
        int id,
        ArticleStatus target,
        ClaimsPrincipal user,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        var article = await db.Articles.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (article is null)
        {
            return Results.Problem(
                title: "Article not found",
                detail: $"No article found with id '{id}'.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (article.Status == ArticleStatus.Archived)
        {
            return Results.Problem(
                title: "Conflict",
                detail: "Archived articles cannot be published or rejected.",
                statusCode: StatusCodes.Status409Conflict);
        }

        if (article.Status is not (ArticleStatus.Draft or ArticleStatus.PendingReview or ArticleStatus.Rejected))
        {
            return Results.Problem(
                title: "Conflict",
                detail: $"Cannot move article from status '{article.Status}' to '{target}'.",
                statusCode: StatusCodes.Status409Conflict);
        }

        article.Status = target;
        article.ReviewedBy = EditorName(user);
        article.ReviewedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(ToResponse(article));
    }

    private static bool IsAllowedCategory(string? category) =>
        !string.IsNullOrWhiteSpace(category)
        && AllowedCategories.Any(c => c.Equals(category.Trim(), StringComparison.OrdinalIgnoreCase));

    private static string EditorName(ClaimsPrincipal user) =>
        user.Identity?.Name?.Trim()
        ?? user.FindFirstValue(ClaimTypes.Name)
        ?? "admin";

    private static AdminArticleResponse ToResponse(Article a) =>
        new(
            a.Id,
            a.CityId,
            a.Headline,
            a.Summary,
            a.SourceName,
            a.SourceUrl,
            a.PublishedAt,
            a.Category,
            a.ImageUrl,
            a.Status.ToString(),
            a.IsMock,
            a.IngestedAt,
            a.ReviewedBy,
            a.ReviewedAt,
            a.SourceId);
}
