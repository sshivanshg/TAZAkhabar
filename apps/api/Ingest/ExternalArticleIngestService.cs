using Microsoft.EntityFrameworkCore;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Ingest;

public sealed class ExternalArticleIngestService(
    AppDbContext db,
    IArticleIntelligence intelligence,
    IIngestionEventBus events,
    ImageEnrichmentQueue imageEnrichmentQueue,
    ILogger<ExternalArticleIngestService> logger)
{
    public const int MaxBatchSize = 20;
    public const int MaxCleanTextChars = 50_000;

    public async Task<IngestSourcesResponse> ListScrapeSourcesAsync(int? id, CancellationToken ct)
    {
        var query = db.Sources
            .AsNoTracking()
            .Include(s => s.City)
            .Where(s => s.Type == SourceType.Scrape && s.IsActive);

        if (id is int sourceId)
        {
            query = query.Where(s => s.Id == sourceId);
        }

        var sources = await query
            .OrderBy(s => s.Id)
            .Select(s => new IngestSourceDto(
                s.Id,
                s.Name,
                s.FeedUrl,
                s.CityId,
                s.City.Slug,
                s.City.Name,
                s.Language,
                s.ScrapeConfig))
            .ToListAsync(ct);

        return new IngestSourcesResponse(sources);
    }

    public async Task<IngestArticlesResponse> IngestAsync(IngestArticlesRequest request, CancellationToken ct)
    {
        if (request.Articles is null || request.Articles.Count == 0)
        {
            return new IngestArticlesResponse(0, 0, 0, []);
        }

        if (request.Articles.Count > MaxBatchSize)
        {
            throw new ArgumentException($"Batch size cannot exceed {MaxBatchSize} articles.");
        }

        var inserted = 0;
        var skipped = 0;
        var failed = 0;
        var results = new List<IngestArticleItemResultDto>(request.Articles.Count);

        foreach (var item in request.Articles)
        {
            var result = await IngestOneAsync(item, request.RunId, ct);
            results.Add(result);
            switch (result.Status)
            {
                case "inserted":
                    inserted++;
                    break;
                case "skippedDuplicate":
                    skipped++;
                    break;
                default:
                    failed++;
                    break;
            }
        }

        return new IngestArticlesResponse(inserted, skipped, failed, results);
    }

    private async Task<IngestArticleItemResultDto> IngestOneAsync(
        IngestArticleItemDto item,
        int? runId,
        CancellationToken ct)
    {
        var rawUrl = item.CanonicalUrl?.Trim() ?? "";
        try
        {
            if (string.IsNullOrWhiteSpace(item.Title))
            {
                return Fail(rawUrl, runId, "Title is required.", inserted: null);
            }

            if (string.IsNullOrWhiteSpace(item.CleanText))
            {
                return Fail(rawUrl, runId, "cleanText is required.", inserted: null);
            }

            if (!SafeHttp.TryValidatePublicAbsoluteUri(rawUrl, out var uri, out var urlError))
            {
                return Fail(rawUrl, runId, urlError, inserted: null);
            }

            var sourceUrl = HtmlText.Truncate(NormalizeSourceUrl(uri), 500);
            var headline = HtmlText.Truncate(item.Title.Trim(), 300);
            var cleanText = HtmlText.Truncate(item.CleanText.Trim(), MaxCleanTextChars);

            var source = await db.Sources
                .Include(s => s.City)
                .FirstOrDefaultAsync(s => s.Id == item.SourceId, ct);

            if (source is null)
            {
                return Fail(sourceUrl, runId, $"Source {item.SourceId} not found.", inserted: null);
            }

            if (!source.IsActive || source.Type != SourceType.Scrape)
            {
                return Fail(sourceUrl, runId, "Source must be an active scrape source.", inserted: null);
            }

            if (await db.Articles.AnyAsync(a => a.SourceUrl == sourceUrl, ct))
            {
                Emit(runId, "skipped", $"Already have · {HtmlText.Truncate(sourceUrl, 90)}");
                return new IngestArticleItemResultDto(sourceUrl, "skippedDuplicate", null);
            }

            string summary;
            try
            {
                Emit(runId, "progress", $"Summarizing · {HtmlText.Truncate(headline, 80)}");
                summary = await intelligence.SummarizeArticleAsync(headline, cleanText, source.City.Slug, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Summarize failed for {SourceUrl}", sourceUrl);
                return Fail(sourceUrl, runId, "Summarize failed.", inserted: null);
            }

            if (string.IsNullOrWhiteSpace(summary))
            {
                summary = HtmlText.Truncate(cleanText, 400);
            }

            if (string.IsNullOrWhiteSpace(summary))
            {
                summary = $"Tap to read the full story on {source.Name}";
            }

            string? imageUrl = null;
            if (!string.IsNullOrWhiteSpace(item.HeroImageUrl)
                && SafeHttp.TryValidatePublicAbsoluteUri(item.HeroImageUrl, out var imageUri, out _))
            {
                imageUrl = HtmlText.Truncate(imageUri.AbsoluteUri, 500);
            }

            var now = DateTimeOffset.UtcNow;
            var language = ArticleLanguageDetector.CoerceOrDetect(
                item.DetectedLanguage,
                headline,
                cleanText,
                fallback: source.Language);

            var article = new Article
            {
                CityId = source.CityId,
                Headline = headline,
                Summary = HtmlText.Truncate(summary.Trim(), 1000),
                SourceName = HtmlText.Truncate(source.Name, 120),
                SourceUrl = sourceUrl,
                PublishedAt = ToUtc(item.PublishedAt ?? now),
                Category = "Local",
                ImageUrl = imageUrl,
                Status = ArticleStatus.Published,
                IsMock = false,
                IngestedAt = now,
                SourceId = source.Id,
                DetectedLanguage = language,
                Content = new ArticleContent
                {
                    CleanText = cleanText,
                    ExtractionTier = string.IsNullOrWhiteSpace(item.ExtractionTier)
                        ? null
                        : HtmlText.Truncate(item.ExtractionTier.Trim(), 64),
                },
            };

            db.Articles.Add(article);
            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex)
            {
                logger.LogWarning(ex, "Article insert failed for {SourceUrl}", sourceUrl);
                db.Entry(article).State = EntityState.Detached;
                if (article.Content is not null)
                {
                    db.Entry(article.Content).State = EntityState.Detached;
                }

                if (await db.Articles.AnyAsync(a => a.SourceUrl == sourceUrl, ct))
                {
                    Emit(runId, "skipped", $"Duplicate on insert · {HtmlText.Truncate(headline, 80)}");
                    return new IngestArticleItemResultDto(sourceUrl, "skippedDuplicate", null);
                }

                return Fail(sourceUrl, runId, "Insert failed.", inserted: null);
            }

            if (ArticleImageEnrichmentService.IsEligible(article))
            {
                await imageEnrichmentQueue.EnqueueAsync(article.Id, ct);
            }

            Emit(runId, "article_added", $"Added · {HtmlText.Truncate(headline, 100)}");
            return new IngestArticleItemResultDto(sourceUrl, "inserted", null);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "External ingest failed for {SourceUrl}", rawUrl);
            return Fail(rawUrl, runId, HtmlText.Truncate(ex.Message, 200), inserted: null);
        }
    }

    private IngestArticleItemResultDto Fail(string url, int? runId, string error, int? inserted)
    {
        _ = inserted;
        Emit(runId, "failed", $"{error} · {HtmlText.Truncate(url, 80)}");
        return new IngestArticleItemResultDto(url, "failed", error);
    }

    private void Emit(int? runId, string type, string message)
    {
        if (runId is int id)
        {
            IngestionEvents.Emit(events, id, type, message);
        }
    }

    internal static string NormalizeSourceUrl(Uri uri)
    {
        var builder = new UriBuilder(uri)
        {
            Fragment = "",
        };
        // Drop common tracking params while keeping meaningful query when needed.
        if (!string.IsNullOrEmpty(builder.Query))
        {
            builder.Query = "";
        }

        return builder.Uri.GetLeftPart(UriPartial.Path).TrimEnd('/');
    }

    private static DateTimeOffset ToUtc(DateTimeOffset value) =>
        value.Offset == TimeSpan.Zero ? value : value.ToUniversalTime();
}
