using Microsoft.EntityFrameworkCore;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;

namespace NewsFeed.Api.Ingest;

public sealed class ArticleSourceUrlBackfillService
{
    private const int DefaultTake = 40;
    private const int MaxTake = 80;

    private readonly AppDbContext _db;
    private readonly IRssFeedClient _feedClient;
    private readonly ILogger<ArticleSourceUrlBackfillService> _logger;

    public ArticleSourceUrlBackfillService(
        AppDbContext db,
        IRssFeedClient feedClient,
        ILogger<ArticleSourceUrlBackfillService> logger)
    {
        _db = db;
        _feedClient = feedClient;
        _logger = logger;
    }

    public async Task<ArticleSourceUrlBackfillResult> RunAsync(
        int take,
        int afterId,
        CancellationToken ct)
    {
        take = take <= 0 ? DefaultTake : Math.Min(take, MaxTake);
        if (afterId < 0)
        {
            afterId = 0;
        }

        var candidates = await _db.Articles
            .Where(a => a.Id > afterId && a.SourceUrl.Contains("news.google.com"))
            .OrderBy(a => a.Id)
            .Take(take * 3)
            .ToListAsync(ct);

        candidates = candidates
            .Where(a => ArticleSourceUrl.LooksLegacyTruncated(a.SourceUrl))
            .Take(take)
            .ToList();

        var examined = 0;
        var updated = 0;
        var skipped = 0;
        var failed = 0;
        int? nextAfterId = null;
        var feedCache = new Dictionary<int, Dictionary<string, string>>(capacity: 8);

        foreach (var article in candidates)
        {
            examined++;
            nextAfterId = article.Id;

            try
            {
                var resolved = await ResolveFromRssAsync(article, feedCache, ct);
                if (string.IsNullOrWhiteSpace(resolved))
                {
                    skipped++;
                    continue;
                }

                var normalized = ArticleSourceUrl.Normalize(resolved);
                if (normalized.Length <= article.SourceUrl.Length
                    || string.Equals(normalized, article.SourceUrl, StringComparison.Ordinal))
                {
                    skipped++;
                    continue;
                }

                if (!SafeHttp.TryValidatePublicAbsoluteUri(normalized, out _, out _))
                {
                    skipped++;
                    continue;
                }

                var duplicate = await _db.Articles.AnyAsync(
                    a => a.Id != article.Id && a.SourceUrl == normalized,
                    ct);
                if (duplicate)
                {
                    skipped++;
                    continue;
                }

                article.SourceUrl = normalized;
                updated++;
            }
            catch (Exception ex)
            {
                failed++;
                _logger.LogWarning(ex, "Source URL backfill failed for article {ArticleId}", article.Id);
            }
        }

        if (updated > 0)
        {
            await _db.SaveChangesAsync(ct);
        }

        return new ArticleSourceUrlBackfillResult(examined, updated, skipped, failed, nextAfterId);
    }

    private async Task<string?> ResolveFromRssAsync(
        Article article,
        Dictionary<int, Dictionary<string, string>> feedCache,
        CancellationToken ct)
    {
        if (!feedCache.TryGetValue(article.CityId, out var byHeadline))
        {
            byHeadline = await BuildHeadlineUrlMapAsync(article.CityId, ct);
            feedCache[article.CityId] = byHeadline;
        }

        var key = NormalizeHeadline(article.Headline);
        return byHeadline.TryGetValue(key, out var url) ? url : null;
    }

    private async Task<Dictionary<string, string>> BuildHeadlineUrlMapAsync(int cityId, CancellationToken ct)
    {
        var map = new Dictionary<string, string>(StringComparer.Ordinal);
        var sources = await _db.Sources
            .AsNoTracking()
            .Where(s => s.CityId == cityId && s.Type == SourceType.Rss && s.IsActive && s.FeedUrl != null)
            .ToListAsync(ct);

        foreach (var source in sources)
        {
            string xml;
            try
            {
                xml = await _feedClient.FetchXmlAsync(source.FeedUrl!, ct) ?? "";
                if (string.IsNullOrWhiteSpace(xml))
                {
                    continue;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Source URL backfill skipped feed {FeedUrl}", source.FeedUrl);
                continue;
            }

            foreach (var item in RssFeedParser.Parse(xml))
            {
                var url = ArticleSourceUrl.Normalize(item.SourceUrl);
                if (string.IsNullOrWhiteSpace(url))
                {
                    continue;
                }

                var key = NormalizeHeadline(item.Title);
                if (!map.ContainsKey(key) || url.Length > map[key].Length)
                {
                    map[key] = url;
                }
            }
        }

        return map;
    }

    private static string NormalizeHeadline(string? headline) =>
        string.Join(' ', (headline ?? "").Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
}

public sealed record ArticleSourceUrlBackfillResult(
    int Examined,
    int Updated,
    int Skipped,
    int Failed,
    int? NextAfterId);
