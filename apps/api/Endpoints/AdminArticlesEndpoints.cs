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

                var textChanged = false;

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

                    if (!string.Equals(article.Headline, headline, StringComparison.Ordinal))
                    {
                        article.Headline = headline;
                        textChanged = true;
                    }
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

                    if (!string.Equals(article.Summary, summary, StringComparison.Ordinal))
                    {
                        article.Summary = summary;
                        textChanged = true;
                    }
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

                if (request.DetectedLanguage is not null)
                {
                    var normalized = ArticleLanguageDetector.Normalize(request.DetectedLanguage);
                    if (normalized is null)
                    {
                        return Results.Problem(
                            title: "Invalid detectedLanguage",
                            detail: "detectedLanguage must be a short ISO language code (e.g. en, hi).",
                            statusCode: StatusCodes.Status400BadRequest);
                    }

                    article.DetectedLanguage = normalized;
                }
                else if (textChanged)
                {
                    article.DetectedLanguage = ArticleLanguageDetector.Detect(
                        article.Headline,
                        article.Summary,
                        fallback: article.DetectedLanguage);
                }

                if (textChanged)
                {
                    var stale = await db.ArticleTranslations
                        .Where(t => t.ArticleId == article.Id)
                        .ToListAsync(cancellationToken);
                    if (stale.Count > 0)
                    {
                        db.ArticleTranslations.RemoveRange(stale);
                    }
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

        admin.MapPost("/articles/{id:int}/archive", async (
                int id,
                ClaimsPrincipal user,
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

                if (article.Status == ArticleStatus.Archived)
                {
                    return Results.Problem(
                        title: "Conflict",
                        detail: "Article is already archived.",
                        statusCode: StatusCodes.Status409Conflict);
                }

                if (article.Status != ArticleStatus.Published)
                {
                    return Results.Problem(
                        title: "Conflict",
                        detail: $"Cannot archive article from status '{article.Status}'.",
                        statusCode: StatusCodes.Status409Conflict);
                }

                article.Status = ArticleStatus.Archived;
                var editor = EditorName(user);
                var now = DateTimeOffset.UtcNow;
                article.ReviewedBy = editor;
                article.ReviewedAt = now;
                AddAudit(db, article.Id, "archive", editor, now);
                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(ToResponse(article));
            })
            .WithName("AdminArchiveArticle")
            .WithOpenApi()
            .Produces<AdminArticleResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        admin.MapPost("/articles", async (
                CreateAdminArticleRequest? request,
                ClaimsPrincipal user,
                AppDbContext db,
                CancellationToken cancellationToken) =>
            {
                if (AdminValidation.ValidateCreateArticle(request) is { } validationError)
                {
                    return validationError;
                }

                var validRequest = request!;

                if (!IsAllowedCategory(validRequest.Category))
                {
                    return Results.Problem(
                        title: "Invalid category",
                        detail: $"category must be one of: {string.Join(", ", AllowedCategories)}.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var slug = validRequest.City.Trim().ToLowerInvariant();
                var cityEntity = await db.Cities.AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Slug == slug, cancellationToken);
                if (cityEntity is null)
                {
                    return Results.Problem(
                        title: "Unknown city",
                        detail: $"No city found with slug '{slug}'.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var headline = HtmlText.Truncate(validRequest.Headline.Trim(), 300);
                var summary = HtmlText.Truncate(validRequest.Summary.Trim(), 1000);
                var sourceName = HtmlText.Truncate(validRequest.SourceName.Trim(), 120);
                var sourceUrl = ArticleSourceUrl.Normalize(validRequest.SourceUrl);
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
                    Category = validRequest.Category.Trim(),
                    Status = validRequest.PublishNow!.Value ? ArticleStatus.Published : ArticleStatus.Draft,
                    IsMock = false,
                    IngestedAt = null,
                    SourceId = null,
                    ReviewedBy = validRequest.PublishNow.Value ? editor : null,
                    ReviewedAt = validRequest.PublishNow.Value ? now : null,
                    DetectedLanguage = ArticleLanguageDetector.CoerceOrDetect(
                        validRequest.DetectedLanguage,
                        headline,
                        summary),
                };

                db.Articles.Add(article);
                await db.SaveChangesAsync(cancellationToken);
                AddAudit(db, article.Id, validRequest.PublishNow.Value ? "create_publish" : "create_draft", editor, now);
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

        var editor = EditorName(user);
        var now = DateTimeOffset.UtcNow;
        article.Status = target;
        article.ReviewedBy = editor;
        article.ReviewedAt = now;
        AddAudit(db, article.Id, target == ArticleStatus.Published ? "publish" : "reject", editor, now);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(ToResponse(article));
    }

    private static void AddAudit(AppDbContext db, int articleId, string action, string actor, DateTimeOffset now) =>
        db.ArticleAuditLogs.Add(new ArticleAuditLog
        {
            ArticleId = articleId,
            Action = action,
            Actor = HtmlText.Truncate(actor, 80),
            OccurredAt = now,
        });

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
            a.SourceId,
            a.DetectedLanguage);
}
