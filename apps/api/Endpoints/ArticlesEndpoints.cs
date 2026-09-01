using NewsFeed.Api.Data;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Options;
using NewsFeed.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace NewsFeed.Api.Endpoints;

public static class ArticlesEndpoints
{
    private const int DefaultLimit = 20;
    private const int MaxLimit = 50;
    private const int MaxQueryLength = 100;
    private const int DefaultSectionLimit = 8;
    private const int MaxSectionLimit = 25;
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
                IOptions<ArticleRetentionOptions> retentionOptions,
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

                var cutoff = ArticleRetention.CutoffUtc(DateTimeOffset.UtcNow, retentionOptions.Value.Days);

                var query = db.Articles
                    .AsNoTracking()
                    .Where(a => a.CityId == cityEntity.Id
                        && a.Status == ArticleStatus.Published
                        && !a.IsMock
                        && a.PublishedAt >= cutoff)
                    .ExcludeEpaperEditions();

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
                IOptions<ArticleRetentionOptions> retentionOptions,
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

                var retentionDays = Math.Max(1, retentionOptions.Value.Days);
                var windowDays = days ?? Math.Min(CityCalendar.DefaultDatesWindowDays, retentionDays);
                if (windowDays < 1)
                {
                    windowDays = Math.Min(CityCalendar.DefaultDatesWindowDays, retentionDays);
                }

                windowDays = Math.Min(windowDays, Math.Min(CityCalendar.DefaultDatesWindowDays, retentionDays));

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
                        && a.PublishedAt < windowEndUtc)
                    .ExcludeEpaperEditions();

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

        api.MapGet("/articles/trending", async (
                string? city,
                string? lang,
                int? limit,
                AppDbContext db,
                IArticlePresentationService presentation,
                IOptions<ArticleRetentionOptions> retentionOptions,
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

                var pageLimit = limit ?? TrendingDefaults.DefaultLimit;
                if (pageLimit < 1)
                {
                    pageLimit = TrendingDefaults.DefaultLimit;
                }

                pageLimit = Math.Min(pageLimit, TrendingDefaults.MaxLimit);

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

                var now = DateTimeOffset.UtcNow;
                var viewSince = now - TrendingDefaults.ViewWindow;
                var retentionDays = Math.Max(1, retentionOptions.Value.Days);
                var publishedSince = now - TimeSpan.FromDays(retentionDays);

                var rankedIds = await db.ArticleViews
                    .AsNoTracking()
                    .Where(v => v.ViewedAt >= viewSince)
                    .Where(v => v.Article.CityId == cityEntity.Id
                        && v.Article.Status == ArticleStatus.Published
                        && !v.Article.IsMock
                        && v.Article.PublishedAt >= publishedSince)
                    .ExcludeEpaperEditions()
                    .GroupBy(v => v.ArticleId)
                    .Select(g => new { ArticleId = g.Key, Views = g.Count() })
                    .OrderByDescending(x => x.Views)
                    .ThenByDescending(x => x.ArticleId)
                    .Take(pageLimit)
                    .ToListAsync(cancellationToken);

                if (rankedIds.Count == 0)
                {
                    httpContext.Response.Headers.CacheControl = PublicCacheControl;
                    return Results.Ok(new TrendingArticlesResponse([]));
                }

                var idOrder = rankedIds.Select(x => x.ArticleId).ToList();
                var entities = await db.Articles
                    .AsNoTracking()
                    .Where(a => idOrder.Contains(a.Id))
                    .ToListAsync(cancellationToken);

                var byId = entities.ToDictionary(a => a.Id);
                var ordered = idOrder
                    .Where(id => byId.ContainsKey(id))
                    .Select(id => byId[id])
                    .ToList();

                var items = await presentation.PresentManyAsync(ordered, lang, cancellationToken);

                httpContext.Response.Headers.CacheControl = PublicCacheControl;
                return Results.Ok(new TrendingArticlesResponse(items));
            })
            .WithName("GetTrendingArticles")
            .WithOpenApi()
            .Produces<TrendingArticlesResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapGet("/articles/personalized", async (
                string? city,
                string? sessionId,
                string? category,
                string? lang,
                int? offset,
                int? limit,
                AppDbContext db,
                IArticlePresentationService presentation,
                IFeedPersonalizationService personalization,
                IOptions<ArticleRetentionOptions> retentionOptions,
                IOptions<FeedPersonalizationOptions> personalizationOptions,
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

                var cutoff = ArticleRetention.CutoffUtc(DateTimeOffset.UtcNow, retentionOptions.Value.Days);

                var query = db.Articles
                    .AsNoTracking()
                    .Where(a => a.CityId == cityEntity.Id
                        && a.Status == ArticleStatus.Published
                        && !a.IsMock
                        && a.PublishedAt >= cutoff)
                    .ExcludeEpaperEditions();

                if (!string.IsNullOrWhiteSpace(category))
                {
                    var categoryFilter = category.Trim();
                    query = query.Where(a => a.Category.ToLower() == categoryFilter.ToLower());
                }

                var total = await query.CountAsync(cancellationToken);

                // Personalization re-ranks a recency-bounded pool so stale stories
                // never resurface just because they match the reader's taste.
                var poolSize = Math.Max(1, personalizationOptions.Value.CandidatePoolSize);
                var candidates = await query
                    .OrderByDescending(a => a.PublishedAt)
                    .ThenByDescending(a => a.Id)
                    .Take(poolSize)
                    .ToListAsync(cancellationToken);

                var sessionKey = NormalizeSessionKey(sessionId);
                var now = DateTimeOffset.UtcNow;
                var candidateIds = candidates.Select(a => a.Id).ToList();
                var signals = await personalization.LoadSignalsAsync(
                    cityEntity.Id, sessionKey, candidateIds, now, cancellationToken);
                var ranked = personalization.Rank(candidates, signals, now);
                var page = ranked.Skip(pageOffset).Take(pageLimit).ToList();

                var items = await presentation.PresentManyAsync(page, lang, cancellationToken);

                // Ranked output is session-specific; only the anonymous cold-start
                // variant is safe to share at the edge.
                httpContext.Response.Headers.CacheControl =
                    sessionKey is null ? PublicCacheControl : "private, no-store";
                return Results.Ok(new PagedArticlesResponse(items, total, pageOffset, pageLimit));
            })
            .WithName("GetPersonalizedArticles")
            .WithOpenApi()
            .Produces<PagedArticlesResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapGet("/articles/sections", async (
                string? city,
                string? sessionId,
                string? lang,
                int? limit,
                AppDbContext db,
                IArticlePresentationService presentation,
                IFeedPersonalizationService personalization,
                IOptions<ArticleRetentionOptions> retentionOptions,
                IOptions<FeedPersonalizationOptions> personalizationOptions,
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

                var perSectionLimit = limit ?? DefaultSectionLimit;
                if (perSectionLimit < 1)
                {
                    perSectionLimit = DefaultSectionLimit;
                }

                perSectionLimit = Math.Min(perSectionLimit, MaxSectionLimit);

                var cutoff = ArticleRetention.CutoffUtc(DateTimeOffset.UtcNow, retentionOptions.Value.Days);

                var query = db.Articles
                    .AsNoTracking()
                    .Where(a => a.CityId == cityEntity.Id
                        && a.Status == ArticleStatus.Published
                        && !a.IsMock
                        && a.PublishedAt >= cutoff)
                    .ExcludeEpaperEditions();

                // Same recency-bounded pool and ranking as the flat personalized
                // feed; sections partition that pool instead of paging it.
                var poolSize = Math.Max(1, personalizationOptions.Value.CandidatePoolSize);
                var candidates = await query
                    .OrderByDescending(a => a.PublishedAt)
                    .ThenByDescending(a => a.Id)
                    .Take(poolSize)
                    .ToListAsync(cancellationToken);

                var sessionKey = NormalizeSessionKey(sessionId);
                var now = DateTimeOffset.UtcNow;
                var candidateIds = candidates.Select(a => a.Id).ToList();
                var signals = await personalization.LoadSignalsAsync(
                    cityEntity.Id, sessionKey, candidateIds, now, cancellationToken);
                var ranked = personalization.Rank(candidates, signals, now);

                var sections = FeedSectionBuilder.Build(ranked, signals, perSectionLimit);

                // Present the whole partition in one pass (single translation-cache
                // lookup); PresentManyAsync preserves input order 1:1.
                var flat = sections.SelectMany(s => s.Articles).ToList();
                var presented = await presentation.PresentManyAsync(flat, lang, cancellationToken);

                var sectionDtos = new List<FeedSection>(sections.Count);
                var cursor = 0;
                foreach (var section in sections)
                {
                    var items = presented.Skip(cursor).Take(section.Articles.Count).ToList();
                    cursor += section.Articles.Count;
                    sectionDtos.Add(new FeedSection(section.Key, section.Title, section.Category, items));
                }

                // Ranked output is session-specific; only the anonymous cold-start
                // variant is safe to share at the edge.
                httpContext.Response.Headers.CacheControl =
                    sessionKey is null ? PublicCacheControl : "private, no-store";
                return Results.Ok(new FeedSectionsResponse(sectionDtos, ranked.Count));
            })
            .WithName("GetFeedSections")
            .WithOpenApi()
            .Produces<FeedSectionsResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapPost("/articles/{id:int}/view", async (
                int id,
                RecordArticleViewRequest? body,
                AppDbContext db,
                IOptions<ArticleRetentionOptions> retentionOptions,
                CancellationToken cancellationToken) =>
            {
                var cutoff = ArticleRetention.CutoffUtc(DateTimeOffset.UtcNow, retentionOptions.Value.Days);
                var exists = await db.Articles
                    .AsNoTracking()
                    .ExcludeEpaperEditions()
                    .AnyAsync(
                        a => a.Id == id
                            && a.Status == ArticleStatus.Published
                            && !a.IsMock
                            && a.PublishedAt >= cutoff,
                        cancellationToken);

                if (!exists)
                {
                    return Results.Problem(
                        title: "Article not found",
                        detail: $"No article found with id '{id}'.",
                        statusCode: StatusCodes.Status404NotFound);
                }

                var sessionKey = NormalizeSessionKey(body?.SessionId);
                var now = DateTimeOffset.UtcNow;

                if (sessionKey is not null)
                {
                    var dedupSince = now - TrendingDefaults.DedupWindow;
                    var recent = await db.ArticleViews
                        .AnyAsync(
                            v => v.ArticleId == id
                                && v.SessionKey == sessionKey
                                && v.ViewedAt >= dedupSince,
                            cancellationToken);
                    if (recent)
                    {
                        return Results.NoContent();
                    }
                }

                db.ArticleViews.Add(new Data.Entities.ArticleView
                {
                    ArticleId = id,
                    ViewedAt = now,
                    SessionKey = sessionKey,
                });
                await db.SaveChangesAsync(cancellationToken);
                return Results.NoContent();
            })
            .WithName("RecordArticleView")
            .WithOpenApi()
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapGet("/articles/{id:int}", async (
                int id,
                string? lang,
                AppDbContext db,
                IArticlePresentationService presentation,
                IOptions<ArticleRetentionOptions> retentionOptions,
                HttpContext httpContext,
                CancellationToken cancellationToken) =>
            {
                var cutoff = ArticleRetention.CutoffUtc(DateTimeOffset.UtcNow, retentionOptions.Value.Days);
                var entity = await db.Articles
                    .AsNoTracking()
                    .ExcludeEpaperEditions()
                    .FirstOrDefaultAsync(
                        a => a.Id == id
                            && a.Status == ArticleStatus.Published
                            && !a.IsMock
                            && a.PublishedAt >= cutoff,
                        cancellationToken);

                if (entity is null)
                {
                    return Results.Problem(
                        title: "Article not found",
                        detail: $"No article found with id '{id}'.",
                        statusCode: StatusCodes.Status404NotFound);
                }

                var article = await presentation.PresentAsync(entity, lang, cancellationToken, includeBody: true);

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

    private static string? NormalizeSessionKey(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        var trimmed = raw.Trim();
        if (trimmed.Length > TrendingDefaults.MaxSessionKeyLength)
        {
            trimmed = trimmed[..TrendingDefaults.MaxSessionKeyLength];
        }

        return trimmed;
    }
}

internal static class TrendingDefaults
{
    public static readonly TimeSpan ViewWindow = TimeSpan.FromHours(24);
    public static readonly TimeSpan DedupWindow = TimeSpan.FromMinutes(30);
    public const int DefaultLimit = 5;
    public const int MaxLimit = 20;
    public const int MaxSessionKeyLength = 64;
}
