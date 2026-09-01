using NewsFeed.Api.Data.Entities;

namespace NewsFeed.Api.Services;

/// <summary>One feed section over ranked article entities (pre-presentation).</summary>
public sealed record FeedSectionArticles(
    string Key,
    string Title,
    string? Category,
    IReadOnlyList<Article> Articles);

/// <summary>
/// Pure partition of a ranked candidate pool into ordered feed sections:
/// "Top stories" (first <see cref="TopSectionSize"/> ranked), then one section
/// per content-analyzed effective category ordered by the session's category
/// affinity (zero-affinity categories after, by their best-ranked story), then
/// "More stories" with everything left. Deterministic for fixed inputs; empty
/// sections are omitted.
/// </summary>
public static class FeedSectionBuilder
{
    public const string TopSectionKey = "top";
    public const string MoreSectionKey = "more";
    public const string TopSectionTitle = "Top stories";
    public const string MoreSectionTitle = "More stories";
    public const int TopSectionSize = 5;

    public static IReadOnlyList<FeedSectionArticles> Build(
        IReadOnlyList<Article> ranked,
        PersonalizationSignals signals,
        int perSectionLimit)
    {
        if (ranked.Count == 0)
        {
            return [];
        }

        var limit = Math.Max(1, perSectionLimit);
        var sections = new List<FeedSectionArticles>();

        var top = ranked.Take(TopSectionSize).ToList();
        sections.Add(new FeedSectionArticles(TopSectionKey, TopSectionTitle, null, top));

        // Group the remainder by effective (content-analyzed) category, keeping
        // ranked order inside each group and noting each group's best rank.
        var groups = new Dictionary<string, List<Article>>(StringComparer.OrdinalIgnoreCase);
        var firstRank = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var rank = TopSectionSize;
        foreach (var article in ranked.Skip(TopSectionSize))
        {
            var category = ContentCategoryClassifier
                .EffectiveCategory(article.Category, article.Headline, article.Summary)
                .Trim();
            if (category.Length == 0)
            {
                category = "General";
            }

            if (!groups.TryGetValue(category, out var list))
            {
                list = [];
                groups[category] = list;
                firstRank[category] = rank;
            }

            list.Add(article);
            rank++;
        }

        var orderedGroups = groups
            .Select(g => new
            {
                Category = g.Key,
                Articles = g.Value,
                Affinity = signals.CategoryAffinity.TryGetValue(g.Key, out var a) ? a : 0d,
                BestRank = firstRank[g.Key],
            })
            .OrderByDescending(g => g.Affinity)
            .ThenBy(g => g.BestRank)
            .ToList();

        var placed = new HashSet<int>(top.Select(a => a.Id));
        foreach (var group in orderedGroups)
        {
            var items = group.Articles.Take(limit).ToList();
            foreach (var item in items)
            {
                placed.Add(item.Id);
            }

            sections.Add(new FeedSectionArticles(
                Slugify(group.Category),
                group.Category,
                group.Category,
                items));
        }

        var more = ranked.Where(a => !placed.Contains(a.Id)).ToList();
        if (more.Count > 0)
        {
            sections.Add(new FeedSectionArticles(MoreSectionKey, MoreSectionTitle, null, more));
        }

        return sections;
    }

    /// <summary>Stable section key from a display category, e.g. "Health" → "health".</summary>
    public static string Slugify(string value)
    {
        var chars = value
            .Trim()
            .ToLowerInvariant()
            .Select(c => char.IsLetterOrDigit(c) ? c : '-')
            .ToArray();
        var slug = new string(chars);
        while (slug.Contains("--", StringComparison.Ordinal))
        {
            slug = slug.Replace("--", "-", StringComparison.Ordinal);
        }

        slug = slug.Trim('-');
        return slug.Length > 0 ? slug : "general";
    }
}
