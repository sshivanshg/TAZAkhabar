using Microsoft.EntityFrameworkCore;
using NewsFeed.Api.Data;

namespace NewsFeed.Api.Ingest;

public sealed class ArticleBodyBackfillService
{
    private const int DefaultTake = 50;
    private const int MaxTake = 100;

    private readonly AppDbContext _db;
    private readonly IScrapeHttpClient _http;
    private readonly ILogger<ArticleBodyBackfillService> _logger;

    public ArticleBodyBackfillService(
        AppDbContext db,
        IScrapeHttpClient http,
        ILogger<ArticleBodyBackfillService> logger)
    {
        _db = db;
        _http = http;
        _logger = logger;
    }

    public async Task<ArticleBodyBackfillResult> RunAsync(
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
            .Where(a => (a.Body == null || a.Body == "")
                        && a.SourceUrl.StartsWith("https:")
                        && a.Id > afterId)
            .OrderBy(a => a.Id)
            .Take(take)
            .ToListAsync(ct);

        var examined = 0;
        var updated = 0;
        var skipped = 0;
        var failed = 0;
        int? nextAfterId = null;

        foreach (var article in candidates)
        {
            examined++;
            nextAfterId = article.Id;

            if (!SafeHttp.TryValidatePublicAbsoluteUri(article.SourceUrl, out var uri, out _))
            {
                skipped++;
                continue;
            }

            if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            {
                skipped++;
                continue;
            }

            string html;
            try
            {
                html = await _http.GetStringAsync(uri, ct);
            }
            catch (Exception ex)
            {
                failed++;
                _logger.LogWarning(ex, "Body backfill fetch failed for article {ArticleId}", article.Id);
                continue;
            }

            string body;
            try
            {
                body = HtmlArticleExtractor.ExtractBody(html);
            }
            catch (Exception ex)
            {
                failed++;
                _logger.LogWarning(ex, "Body backfill extract failed for article {ArticleId}", article.Id);
                continue;
            }

            if (string.IsNullOrWhiteSpace(body))
            {
                skipped++;
                continue;
            }

            article.Body = body;
            updated++;
        }

        if (updated > 0)
        {
            await _db.SaveChangesAsync(ct);
        }

        return new ArticleBodyBackfillResult(examined, updated, skipped, failed, nextAfterId);
    }
}

public sealed record ArticleBodyBackfillResult(
    int Examined,
    int Updated,
    int Skipped,
    int Failed,
    int? NextAfterId);
