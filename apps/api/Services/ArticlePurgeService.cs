using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NewsFeed.Api.Data;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Services;

public sealed class ArticlePurgeService(
    AppDbContext db,
    IOptions<ArticleRetentionOptions> retentionOptions,
    ILogger<ArticlePurgeService> logger)
{
    private const int BatchSize = 500;

    public async Task<int> PurgeAsync(CancellationToken cancellationToken)
    {
        var days = retentionOptions.Value.Days;
        var cutoff = ArticleRetention.CutoffUtc(DateTimeOffset.UtcNow, days);
        var deleted = 0;

        while (true)
        {
            var batch = await db.Articles
                .Where(a =>
                    (a.Status == ArticleStatus.Published && a.PublishedAt < cutoff)
                    || (a.Status != ArticleStatus.Published
                        && (a.IngestedAt ?? a.PublishedAt) < cutoff))
                .OrderBy(a => a.Id)
                .Take(BatchSize)
                .ToListAsync(cancellationToken);

            if (batch.Count == 0)
            {
                break;
            }

            var ids = batch.Select(a => a.Id).ToList();
            var views = await db.ArticleViews
                .Where(v => ids.Contains(v.ArticleId))
                .ToListAsync(cancellationToken);
            db.ArticleViews.RemoveRange(views);
            db.Articles.RemoveRange(batch);
            await db.SaveChangesAsync(cancellationToken);
            deleted += batch.Count;
        }

        logger.LogInformation("Purged {Deleted} articles older than retention cutoff {Cutoff}", deleted, cutoff);
        return deleted;
    }
}
