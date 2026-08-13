using Microsoft.EntityFrameworkCore;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;

namespace NewsFeed.Api.Ingest;

public sealed class ArticleImageEnrichmentService(
    AppDbContext db,
    IArticleImageHtmlClient htmlClient,
    ImageEnrichmentQueue queue,
    ILogger<ArticleImageEnrichmentService> logger)
{
    public const int StartupSweepLimit = 50;

    public static bool IsEligible(Article article) =>
        article.ImageUrl is null
        && article.ImageEnrichmentAttemptedAt is null
        && !article.IsMock
        && SafeHttp.TryValidatePublicAbsoluteUri(article.SourceUrl, out _, out _);

    public async Task EnqueueIfEligibleAsync(Article article, CancellationToken ct)
    {
        if (!IsEligible(article))
        {
            return;
        }

        await queue.EnqueueAsync(article.Id, ct);
    }

    public async Task EnqueueEligibleStartupAsync(CancellationToken ct)
    {
        var ids = await db.Articles
            .AsNoTracking()
            .Where(a =>
                a.ImageUrl == null
                && a.ImageEnrichmentAttemptedAt == null
                && !a.IsMock
                && (a.SourceUrl.StartsWith("http://") || a.SourceUrl.StartsWith("https://")))
            .OrderByDescending(a => a.IngestedAt)
            .ThenByDescending(a => a.Id)
            .Take(StartupSweepLimit)
            .Select(a => a.Id)
            .ToListAsync(ct);

        foreach (var id in ids)
        {
            await queue.EnqueueAsync(id, ct);
        }

        if (ids.Count > 0)
        {
            logger.LogInformation("Enqueued {Count} articles for image enrichment startup sweep", ids.Count);
        }
    }

    public async Task EnrichAsync(int articleId, CancellationToken ct)
    {
        var article = await db.Articles.FirstOrDefaultAsync(a => a.Id == articleId, ct);
        if (article is null)
        {
            return;
        }

        if (article.ImageUrl is not null)
        {
            if (article.ImageEnrichmentAttemptedAt is null)
            {
                article.ImageEnrichmentAttemptedAt = DateTimeOffset.UtcNow;
                await db.SaveChangesAsync(ct);
            }

            return;
        }

        if (article.ImageEnrichmentAttemptedAt is not null)
        {
            return;
        }

        if (!SafeHttp.TryValidatePublicAbsoluteUri(article.SourceUrl, out var pageUri, out _))
        {
            article.ImageEnrichmentAttemptedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
            return;
        }

        var html = await htmlClient.GetHtmlAsync(pageUri, ct);
        string? imageUrl = null;
        if (!string.IsNullOrWhiteSpace(html))
        {
            imageUrl = NormalizeImageUrl(OgImageExtractor.TryExtract(html, pageUri));
        }

        if (imageUrl is not null && article.ImageUrl is null)
        {
            article.ImageUrl = imageUrl;
        }

        article.ImageEnrichmentAttemptedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private static string? NormalizeImageUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return null;
        }

        var trimmed = url.Trim();
        if (!trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            && !trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return HtmlText.Truncate(trimmed, 500);
    }
}
