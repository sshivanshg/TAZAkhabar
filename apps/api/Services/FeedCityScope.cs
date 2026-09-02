using Microsoft.EntityFrameworkCore;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;

namespace NewsFeed.Api.Services;

/// <summary>
/// <c>city=global</c> is a virtual feed scope: all cities, ranked with the same
/// personalization pipeline (recency, affinity, cross-city trending, seen penalty).
/// </summary>
public static class FeedCityScope
{
    public const string GlobalSlug = "global";

    public static bool IsGlobal(string slug) =>
        string.Equals(slug.Trim(), GlobalSlug, StringComparison.OrdinalIgnoreCase);

    public readonly record struct Resolved(int? CityId, City? CityEntity);

    public static async Task<(Resolved? Scope, IResult? Error)> TryResolveAsync(
        AppDbContext db,
        string? cityParam,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(cityParam))
        {
            return (null, Results.Problem(
                title: "Invalid city",
                detail: "Query parameter 'city' (slug) is required.",
                statusCode: StatusCodes.Status400BadRequest));
        }

        var slug = cityParam.Trim().ToLowerInvariant();
        if (IsGlobal(slug))
        {
            return (new Resolved(null, null), null);
        }

        var cityEntity = await db.Cities
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Slug == slug, cancellationToken);

        if (cityEntity is null)
        {
            return (null, Results.Problem(
                title: "Unknown city",
                detail: $"No city found with slug '{slug}'.",
                statusCode: StatusCodes.Status400BadRequest));
        }

        return (new Resolved(cityEntity.Id, cityEntity), null);
    }

    public static IQueryable<Article> PublishedArticles(
        AppDbContext db,
        DateTimeOffset cutoff,
        int? cityId) =>
        FeedCityScopeQuery.PublishedArticles(db, cutoff, cityId);
}

internal static class FeedCityScopeQuery
{
    public static IQueryable<Article> PublishedArticles(
        AppDbContext db,
        DateTimeOffset cutoff,
        int? cityId)
    {
        var query = db.Articles
            .AsNoTracking()
            .Where(a => a.Status == ArticleStatus.Published
                && !a.IsMock
                && a.PublishedAt >= cutoff)
            .ExcludeEpaperEditions();

        if (cityId.HasValue)
        {
            query = query.Where(a => a.CityId == cityId.Value);
        }

        return query;
    }
}
