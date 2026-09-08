using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Services;

/// <summary>
/// Owns read-side article queries used by the public feed endpoints. The
/// endpoint layer remains responsible for HTTP validation and response shape;
/// this service owns the persistence/query rules for visible articles.
/// </summary>
public interface IArticleFeedQueryService
{
    Task<City?> FindCityAsync(string citySlug, CancellationToken cancellationToken);

    Task<IReadOnlyList<Article>> GetChronologicalAsync(
        City city,
        string? query,
        string? category,
        DateOnly? localDate,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Article>> GetArticlesForDatesAsync(
        City city,
        int windowDays,
        string? category,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Article>> GetTrendingAsync(
        City city,
        int limit,
        DateTimeOffset now,
        CancellationToken cancellationToken);

    Task<ArticleCandidateSet> GetPersonalizationCandidatesAsync(
        City city,
        string? category,
        int poolSize,
        CancellationToken cancellationToken);

    Task<Article?> GetPublishedByIdAsync(
        int articleId,
        CancellationToken cancellationToken);

    Task<bool> IsPublishedAsync(
        int articleId,
        CancellationToken cancellationToken);
}

public sealed record ArticleCandidateSet(
    IReadOnlyList<Article> Candidates,
    int Total);

public sealed class ArticleFeedQueryService(
    AppDbContext db,
    IOptions<ArticleRetentionOptions> retentionOptions) : IArticleFeedQueryService
{
    public Task<City?> FindCityAsync(string citySlug, CancellationToken cancellationToken) =>
        db.Cities
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Slug == citySlug.Trim().ToLowerInvariant(), cancellationToken);

    public async Task<IReadOnlyList<Article>> GetChronologicalAsync(
        City city,
        string? query,
        string? category,
        DateOnly? localDate,
        CancellationToken cancellationToken)
    {
        var articleQuery = VisibleArticles(city.Id, ArticleRetention.CutoffUtc(
            DateTimeOffset.UtcNow,
            retentionOptions.Value.Days));

        if (!string.IsNullOrWhiteSpace(query))
        {
            var needle = query.Trim().ToLowerInvariant();
            articleQuery = articleQuery.Where(a => a.Headline.ToLower().Contains(needle));
        }

        if (localDate is { } day)
        {
            var (startUtc, endUtc) = CityCalendar.UtcBoundsForLocalDate(day, city);
            articleQuery = articleQuery.Where(a => a.PublishedAt >= startUtc && a.PublishedAt < endUtc);
        }

        var entities = await articleQuery
            .OrderByDescending(a => a.PublishedAt)
            .ToListAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(category))
        {
            entities = entities
                .Where(a => IsEffectiveCategory(a, category))
                .ToList();
        }

        return entities;
    }

    public async Task<IReadOnlyList<Article>> GetArticlesForDatesAsync(
        City city,
        int windowDays,
        string? category,
        CancellationToken cancellationToken)
    {
        var todayLocal = CityCalendar.TodayLocal(city);
        var windowStartLocal = todayLocal.AddDays(-(windowDays - 1));
        var (windowStartUtc, _) = CityCalendar.UtcBoundsForLocalDate(windowStartLocal, city);
        var (_, windowEndUtc) = CityCalendar.UtcBoundsForLocalDate(todayLocal, city);

        var articles = await VisibleArticles(city.Id, windowStartUtc)
            .Where(a => a.PublishedAt < windowEndUtc)
            .ToListAsync(cancellationToken);

        return string.IsNullOrWhiteSpace(category)
            ? articles
            : articles.Where(a => IsEffectiveCategory(a, category)).ToList();
    }

    public async Task<IReadOnlyList<Article>> GetTrendingAsync(
        City city,
        int limit,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var viewSince = now - TimeSpan.FromHours(24);
        var publishedSince = ArticleRetention.CutoffUtc(now, retentionOptions.Value.Days);

        var rankedIds = await db.ArticleViews
            .AsNoTracking()
            .Where(v => v.ViewedAt >= viewSince)
            .Where(v => v.Article.CityId == city.Id
                && v.Article.Status == ArticleStatus.Published
                && !v.Article.IsMock
                && v.Article.PublishedAt >= publishedSince)
            .ExcludeEpaperEditions()
            .GroupBy(v => v.ArticleId)
            .Select(g => new { ArticleId = g.Key, Views = g.Count() })
            .OrderByDescending(x => x.Views)
            .ThenByDescending(x => x.ArticleId)
            .Take(limit)
            .ToListAsync(cancellationToken);

        if (rankedIds.Count == 0)
        {
            return [];
        }

        var idOrder = rankedIds.Select(x => x.ArticleId).ToList();
        var entities = await db.Articles
            .AsNoTracking()
            .Where(a => idOrder.Contains(a.Id))
            .ToListAsync(cancellationToken);

        var byId = entities.ToDictionary(a => a.Id);
        return idOrder
            .Where(id => byId.ContainsKey(id))
            .Select(id => byId[id])
            .ToList();
    }

    public async Task<ArticleCandidateSet> GetPersonalizationCandidatesAsync(
        City city,
        string? category,
        int poolSize,
        CancellationToken cancellationToken)
    {
        var candidates = await VisibleArticles(city.Id, ArticleRetention.CutoffUtc(
                DateTimeOffset.UtcNow,
                retentionOptions.Value.Days))
            .OrderByDescending(a => a.PublishedAt)
            .ThenByDescending(a => a.Id)
            .ToListAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(category))
        {
            candidates = candidates
                .Where(a => string.Equals(
                    ContentCategoryClassifier.EffectiveCategory(a.Category, a.Headline, a.Summary),
                    category.Trim(),
                    StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        var total = candidates.Count;
        return new ArticleCandidateSet(
            candidates.Take(Math.Max(1, poolSize)).ToList(),
            total);
    }

    public Task<Article?> GetPublishedByIdAsync(int articleId, CancellationToken cancellationToken) =>
        VisibleArticle(articleId, ArticleRetention.CutoffUtc(
                DateTimeOffset.UtcNow,
                retentionOptions.Value.Days))
            .FirstOrDefaultAsync(cancellationToken);

    public Task<bool> IsPublishedAsync(int articleId, CancellationToken cancellationToken) =>
        VisibleArticle(articleId, ArticleRetention.CutoffUtc(
                DateTimeOffset.UtcNow,
                retentionOptions.Value.Days))
            .AnyAsync(cancellationToken);

    private IQueryable<Article> VisibleArticles(int cityId, DateTimeOffset cutoff) =>
        db.Articles
            .AsNoTracking()
            .Where(a => a.CityId == cityId
                && a.Status == ArticleStatus.Published
                && !a.IsMock
                && a.PublishedAt >= cutoff)
            .ExcludeEpaperEditions();

    private IQueryable<Article> VisibleArticle(int articleId, DateTimeOffset cutoff) =>
        db.Articles
            .AsNoTracking()
            .Where(a => a.Id == articleId
                && a.Status == ArticleStatus.Published
                && !a.IsMock
                && a.PublishedAt >= cutoff)
            .ExcludeEpaperEditions();

    private static bool IsEffectiveCategory(Article article, string requestedCategory) =>
        string.Equals(
            ContentCategoryClassifier.EffectiveCategory(article.Category, article.Headline, article.Summary),
            requestedCategory.Trim(),
            StringComparison.OrdinalIgnoreCase);
}
