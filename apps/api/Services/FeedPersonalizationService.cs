using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Endpoints;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Services;

/// <summary>
/// Signals derived from anonymous view events. No user identity is involved —
/// everything keys off the opaque client session id already used for trending
/// (ADR-002). Cold start (no/unknown session) yields zeroed affinity and seen
/// sets, so ranking degrades to recency + city trending.
/// </summary>
public sealed record PersonalizationSignals(
    IReadOnlyDictionary<string, double> CategoryAffinity,
    IReadOnlyDictionary<int, double> TrendingScores,
    IReadOnlySet<int> SeenArticleIds)
{
    public static readonly PersonalizationSignals Empty = new(
        new Dictionary<string, double>(),
        new Dictionary<int, double>(),
        new HashSet<int>());
}

public interface IFeedPersonalizationService
{
    /// <summary>Loads session affinity/seen history and city trending counts for the candidate pool.</summary>
    Task<PersonalizationSignals> LoadSignalsAsync(
        int cityId,
        string? sessionKey,
        IReadOnlyCollection<int> candidateIds,
        DateTimeOffset now,
        CancellationToken cancellationToken);

    /// <summary>Pure re-rank of a recency-bounded candidate pool. Deterministic for fixed inputs.</summary>
    IReadOnlyList<Article> Rank(
        IReadOnlyList<Article> candidates,
        PersonalizationSignals signals,
        DateTimeOffset now);
}

public sealed class FeedPersonalizationService(
    AppDbContext db,
    IOptions<FeedPersonalizationOptions> options) : IFeedPersonalizationService
{
    public async Task<PersonalizationSignals> LoadSignalsAsync(
        int cityId,
        string? sessionKey,
        IReadOnlyCollection<int> candidateIds,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var opts = options.Value;
        var affinitySince = now - TimeSpan.FromDays(Math.Max(1, opts.AffinityWindowDays));

        var categoryAffinity = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
        var seenArticleIds = new HashSet<int>();

        if (!string.IsNullOrWhiteSpace(sessionKey))
        {
            // Affinity is intentionally not city-scoped: category taste travels
            // with the reader when they switch cities.
            var sessionViews = await db.ArticleViews
                .AsNoTracking()
                .Where(v => v.SessionKey == sessionKey && v.ViewedAt >= affinitySince)
                .Select(v => new { v.ArticleId, v.Article.Category })
                .ToListAsync(cancellationToken);

            var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            foreach (var view in sessionViews)
            {
                seenArticleIds.Add(view.ArticleId);
                var category = view.Category?.Trim();
                if (!string.IsNullOrEmpty(category))
                {
                    counts[category] = counts.TryGetValue(category, out var n) ? n + 1 : 1;
                }
            }

            var max = counts.Count > 0 ? counts.Values.Max() : 0;
            if (max > 0)
            {
                foreach (var (category, count) in counts)
                {
                    categoryAffinity[category] = (double)count / max;
                }
            }
        }

        var trendingScores = new Dictionary<int, double>();
        if (candidateIds.Count > 0)
        {
            var trendingSince = now - TrendingDefaults.ViewWindow;
            var viewCounts = await db.ArticleViews
                .AsNoTracking()
                .Where(v => v.ViewedAt >= trendingSince
                    && v.Article.CityId == cityId
                    && candidateIds.Contains(v.ArticleId))
                .GroupBy(v => v.ArticleId)
                .Select(g => new { ArticleId = g.Key, Views = g.Count() })
                .ToListAsync(cancellationToken);

            var maxViews = viewCounts.Count > 0 ? viewCounts.Max(x => x.Views) : 0;
            if (maxViews > 0)
            {
                foreach (var row in viewCounts)
                {
                    trendingScores[row.ArticleId] = (double)row.Views / maxViews;
                }
            }
        }

        return new PersonalizationSignals(categoryAffinity, trendingScores, seenArticleIds);
    }

    public IReadOnlyList<Article> Rank(
        IReadOnlyList<Article> candidates,
        PersonalizationSignals signals,
        DateTimeOffset now)
    {
        if (candidates.Count == 0)
        {
            return [];
        }

        var opts = options.Value;
        var halfLifeHours = opts.RecencyHalfLifeHours > 0 ? opts.RecencyHalfLifeHours : 18;

        var scored = candidates
            .Select(article =>
            {
                var ageHours = Math.Max(0, (now - article.PublishedAt).TotalHours);
                var recency = Math.Pow(0.5, ageHours / halfLifeHours);
                var affinity = signals.CategoryAffinity.TryGetValue(article.Category ?? string.Empty, out var a)
                    ? a
                    : 0d;
                var trending = signals.TrendingScores.TryGetValue(article.Id, out var t)
                    ? t
                    : 0d;
                var seen = signals.SeenArticleIds.Contains(article.Id) ? 1d : 0d;

                var score = opts.RecencyWeight * recency
                    + opts.AffinityWeight * affinity
                    + opts.TrendingWeight * trending
                    - opts.SeenPenalty * seen;

                return new ScoredArticle(article, score);
            })
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.Article.PublishedAt)
            .ThenByDescending(x => x.Article.Id)
            .ToList();

        return DiversifySources(scored, opts);
    }

    /// <summary>
    /// Breaks long same-source streaks by swapping in the best-scoring story from a
    /// different source within a small lookahead window. Runs after scoring so it
    /// never changes which stories are eligible, only their local order.
    /// </summary>
    private static IReadOnlyList<Article> DiversifySources(
        List<ScoredArticle> ranked,
        FeedPersonalizationOptions opts)
    {
        var maxStreak = Math.Max(1, opts.MaxSourceStreak);
        var lookahead = Math.Max(1, opts.DiversificationLookahead);

        var remaining = new List<ScoredArticle>(ranked);
        var result = new List<Article>(ranked.Count);
        string? streakSource = null;
        var streakLength = 0;

        while (remaining.Count > 0)
        {
            var pickIndex = 0;
            var candidateSource = NormalizeSource(remaining[0].Article);

            if (streakSource is not null
                && streakLength >= maxStreak
                && string.Equals(candidateSource, streakSource, StringComparison.OrdinalIgnoreCase))
            {
                var limit = Math.Min(lookahead, remaining.Count);
                for (var i = 1; i < limit; i++)
                {
                    var altSource = NormalizeSource(remaining[i].Article);
                    if (!string.Equals(altSource, streakSource, StringComparison.OrdinalIgnoreCase))
                    {
                        pickIndex = i;
                        candidateSource = altSource;
                        break;
                    }
                }
            }

            var pick = remaining[pickIndex];
            remaining.RemoveAt(pickIndex);

            if (string.Equals(candidateSource, streakSource, StringComparison.OrdinalIgnoreCase))
            {
                streakLength++;
            }
            else
            {
                streakSource = candidateSource;
                streakLength = 1;
            }

            result.Add(pick.Article);
        }

        return result;
    }

    private static string NormalizeSource(Article article) =>
        article.SourceName?.Trim() ?? string.Empty;

    private sealed record ScoredArticle(Article Article, double Score);
}
