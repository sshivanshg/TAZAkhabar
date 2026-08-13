using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Ingest;

public sealed class RssIngestService(
    AppDbContext db,
    IOptions<RssIngestOptions> options,
    IRssFeedClient feedClient,
    ILogger<RssIngestService> logger)
{
    public async Task<IngestRunResult> RunAsync(CancellationToken cancellationToken)
    {
        var feeds = options.Value.Feeds ?? [];
        var attempted = 0;
        var failed = 0;
        var inserted = 0;
        var skipped = 0;

        foreach (var feed in feeds)
        {
            attempted++;
            try
            {
                var xml = await feedClient.FetchXmlAsync(feed.Url, cancellationToken);
                if (xml is null)
                {
                    failed++;
                    logger.LogWarning("RSS fetch failed for {FeedUrl}", feed.Url);
                    continue;
                }

                var (feedInserted, feedSkipped) = await IngestFeedAsync(feed, xml, cancellationToken);
                inserted += feedInserted;
                skipped += feedSkipped;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                failed++;
                logger.LogError(ex, "RSS ingest failed for {FeedUrl}", feed.Url);
                db.ChangeTracker.Clear();
            }
        }

        return new IngestRunResult(attempted, failed, inserted, skipped);
    }

    private async Task<(int Inserted, int Skipped)> IngestFeedAsync(
        RssFeedConfig feed,
        string xml,
        CancellationToken cancellationToken)
    {
        var items = RssFeedParser.Parse(xml);
        var city = await db.Cities
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Slug == feed.CitySlug, cancellationToken);

        if (city is null)
        {
            logger.LogWarning("City slug {CitySlug} not found; skipping feed {FeedUrl}", feed.CitySlug, feed.Url);
            return (0, items.Count);
        }

        var inserted = 0;
        var skipped = 0;

        foreach (var item in items)
        {
            if (feed.Kind == RssFeedKind.Wider
                && !PlaceNameMatcher.MatchesJhansiEdition(item.Title, item.Snippet))
            {
                skipped++;
                continue;
            }

            if (await TryInsertAsync(city.Id, feed, item, cancellationToken))
            {
                inserted++;
            }
            else
            {
                skipped++;
            }
        }

        return (inserted, skipped);
    }

    private async Task<bool> TryInsertAsync(
        int cityId,
        RssFeedConfig feed,
        ParsedRssItem item,
        CancellationToken cancellationToken)
    {
        var sourceUrl = HtmlText.Truncate(item.SourceUrl.Trim(), 500);
        if (string.IsNullOrWhiteSpace(sourceUrl))
        {
            return false;
        }

        if (await db.Articles.AnyAsync(a => a.SourceUrl == sourceUrl, cancellationToken))
        {
            return false;
        }

        var sourceName = string.IsNullOrWhiteSpace(item.SourceName)
            ? feed.SourceName
            : item.SourceName.Trim();
        var snippet = item.Snippet;
        var summary = string.IsNullOrWhiteSpace(snippet)
            ? $"Tap to read the full story on {sourceName}"
            : snippet;

        var article = new Article
        {
            CityId = cityId,
            Headline = item.Title,
            Summary = summary,
            SourceName = sourceName,
            SourceUrl = sourceUrl,
            PublishedAt = item.PublishedAt ?? DateTimeOffset.UtcNow,
            Category = "Local",
            ImageUrl = NormalizeImageUrl(item.ImageUrl),
        };

        db.Articles.Add(article);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException)
        {
            db.Entry(article).State = EntityState.Detached;
            return false;
        }
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
