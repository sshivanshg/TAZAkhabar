using Microsoft.EntityFrameworkCore;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using Serilog.Context;

namespace NewsFeed.Api.Ingest;

public sealed class RssIngestService(
    AppDbContext db,
    IRssFeedClient feedClient,
    IScrapeHttpClient scrapeHttp,
    IArticleIntelligence intelligence,
    IIngestionEventBus events,
    ImageEnrichmentQueue imageEnrichmentQueue,
    ILogger<RssIngestService> logger)
{
    public async Task<IngestRunResult> RunAsync(CancellationToken cancellationToken, bool useIntelligence = true)
    {
        var sources = await db.Sources
            .AsNoTracking()
            .Where(s => s.Type == SourceType.Rss && s.IsActive)
            .OrderBy(s => s.Id)
            .ToListAsync(cancellationToken);

        var attempted = 0;
        var failed = 0;
        var inserted = 0;
        var skipped = 0;

        foreach (var source in sources)
        {
            attempted++;
            var run = await RunSourceAsync(source.Id, cancellationToken, useIntelligence: useIntelligence);
            inserted += run.ArticlesAdded;
            skipped += run.ArticlesSkipped;
            if (run.ArticlesFailed > 0 || !string.IsNullOrEmpty(run.ErrorSummary))
            {
                failed++;
            }
        }

        return new IngestRunResult(attempted, failed, inserted, skipped);
    }

    public async Task<IngestionRun> RunSourceAsync(
        int sourceId,
        CancellationToken cancellationToken,
        int? existingRunId = null,
        bool useIntelligence = true)
    {
        var source = await db.Sources.FirstOrDefaultAsync(s => s.Id == sourceId, cancellationToken)
            ?? throw new InvalidOperationException($"Source {sourceId} not found.");

        IngestionRun run;
        if (existingRunId is int runId)
        {
            run = await db.IngestionRuns.FirstOrDefaultAsync(r => r.Id == runId && r.SourceId == sourceId, cancellationToken)
                ?? throw new InvalidOperationException($"Ingestion run {runId} not found for source {sourceId}.");
        }
        else
        {
            run = new IngestionRun
            {
                SourceId = source.Id,
                StartedAt = DateTimeOffset.UtcNow,
            };
            db.IngestionRuns.Add(run);
            await db.SaveChangesAsync(cancellationToken);
            IngestionEvents.Emit(events, run.Id, "started", $"RSS run started · {source.Name}");
        }

        using var runLogContext = LogContext.PushProperty("IngestionRunId", run.Id);
        try
        {
            if (source.Type != SourceType.Rss || string.IsNullOrWhiteSpace(source.FeedUrl))
            {
                run.ArticlesFailed = 1;
                run.ErrorSummary = IngestErrorClassifier.InvalidSource;
                await CompleteRunAsync(source, run, FetchStatus.Error, run.ErrorSummary, cancellationToken);
                return run;
            }

            IngestionEvents.Emit(events, run.Id, "fetch", $"Fetching feed {source.FeedUrl}");
            var xml = await feedClient.FetchXmlAsync(source.FeedUrl, cancellationToken);
            if (xml is null)
            {
                run.ArticlesFailed = 1;
                run.ErrorSummary = IngestErrorClassifier.FetchFailed;
                logger.LogWarning(
                    "RSS fetch failed for source {SourceId} {FeedUrl} run {IngestionRunId}",
                    source.Id,
                    source.FeedUrl,
                    run.Id);
                await CompleteRunAsync(source, run, FetchStatus.Error, run.ErrorSummary, cancellationToken);
                return run;
            }

            var items = RssFeedParser.Parse(xml);
            run.ArticlesFound = items.Count;
            IngestionEvents.Emit(
                events,
                run.Id,
                "found",
                $"Parsed {items.Count} feed item{(items.Count == 1 ? "" : "s")}",
                found: items.Count);

            var city = await db.Cities
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == source.CityId, cancellationToken);

            if (city is null)
            {
                run.ArticlesSkipped = items.Count;
                run.ErrorSummary = IngestErrorClassifier.InvalidSource;
                logger.LogWarning(
                    "City id {CityId} not found; skipping feed {FeedUrl} run {IngestionRunId}",
                    source.CityId,
                    source.FeedUrl,
                    run.Id);
                await CompleteRunAsync(source, run, FetchStatus.Error, run.ErrorSummary, cancellationToken);
                return run;
            }

            var inserted = 0;
            var skipped = 0;

            foreach (var item in items)
            {
                if (source.Kind == SourceKind.Wider
                    && !PlaceNameMatcher.MatchesJhansiEdition(item.Title, item.Snippet))
                {
                    skipped++;
                    IngestionEvents.Emit(
                        events,
                        run.Id,
                        "skipped",
                        $"Skipped (wider filter) · {HtmlText.Truncate(item.Title, 80)}",
                        found: items.Count,
                        added: inserted,
                        skipped: skipped);
                    continue;
                }

                if (await TryInsertAsync(city, source, item, run, cancellationToken, useIntelligence))
                {
                    inserted++;
                    IngestionEvents.Emit(
                        events,
                        run.Id,
                        "article_added",
                        $"Added · {HtmlText.Truncate(item.Title, 100)}",
                        found: items.Count,
                        added: inserted,
                        skipped: skipped);
                }
                else
                {
                    skipped++;
                    IngestionEvents.Emit(
                        events,
                        run.Id,
                        "skipped",
                        $"Duplicate/skip · {HtmlText.Truncate(item.Title, 80)}",
                        found: items.Count,
                        added: inserted,
                        skipped: skipped);
                }
            }

            run.ArticlesAdded = inserted;
            run.ArticlesSkipped = skipped;
            await CompleteRunAsync(source, run, FetchStatus.Success, null, cancellationToken);
            return run;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "RSS ingest failed for source {SourceId} {FeedUrl} run {IngestionRunId}",
                source.Id,
                source.FeedUrl,
                run.Id);
            db.ChangeTracker.Clear();

            var trackedRun = await db.IngestionRuns.FirstAsync(r => r.Id == run.Id, CancellationToken.None);
            var trackedSource = await db.Sources.FirstAsync(s => s.Id == source.Id, CancellationToken.None);
            trackedRun.ArticlesFailed = Math.Max(trackedRun.ArticlesFailed, 1);
            trackedRun.ErrorSummary = IngestErrorClassifier.FromException(ex);
            await CompleteRunAsync(trackedSource, trackedRun, FetchStatus.Error, trackedRun.ErrorSummary, CancellationToken.None);
            return trackedRun;
        }
    }

    private async Task CompleteRunAsync(
        Source source,
        IngestionRun run,
        FetchStatus status,
        string? error,
        CancellationToken cancellationToken)
    {
        run.CompletedAt = DateTimeOffset.UtcNow;
        source.LastFetchedAt = run.CompletedAt;
        source.LastFetchStatus = status;
        source.LastErrorMessage = error;
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "RSS ingest run {IngestionRunId} completed with status {FetchStatus}: found {ArticlesFound}, added {ArticlesAdded}, skipped {ArticlesSkipped}, failed {ArticlesFailed}",
            run.Id,
            status,
            run.ArticlesFound,
            run.ArticlesAdded,
            run.ArticlesSkipped,
            run.ArticlesFailed);

        if (status == FetchStatus.Error)
        {
            IngestionEvents.Emit(
                events,
                run.Id,
                "error",
                error ?? "RSS run failed",
                found: run.ArticlesFound,
                added: run.ArticlesAdded,
                skipped: run.ArticlesSkipped,
                failed: run.ArticlesFailed);
        }
        else
        {
            IngestionEvents.Emit(
                events,
                run.Id,
                "completed",
                $"Done · +{run.ArticlesAdded} added · {run.ArticlesSkipped} skipped",
                found: run.ArticlesFound,
                added: run.ArticlesAdded,
                skipped: run.ArticlesSkipped,
                failed: run.ArticlesFailed);
        }
    }

    private async Task<bool> TryInsertAsync(
        City city,
        Source source,
        ParsedRssItem item,
        IngestionRun run,
        CancellationToken cancellationToken,
        bool useIntelligence)
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
            ? source.Name
            : item.SourceName.Trim();
        var snippet = item.Snippet;
        var summary = string.IsNullOrWhiteSpace(snippet)
            ? $"Tap to read the full story on {sourceName}"
            : snippet;

        if (useIntelligence)
        {
            try
            {
                IngestionEvents.Emit(events, run.Id, "progress", $"Summarizing · {HtmlText.Truncate(item.Title, 80)}");
                var rewritten = await intelligence.SummarizeArticleAsync(item.Title, snippet, city.Slug, cancellationToken);
                if (!string.IsNullOrWhiteSpace(rewritten))
                {
                    summary = rewritten;
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "RSS summarize failed for {SourceUrl}; using feed snippet", sourceUrl);
            }
        }
        else
        {
            IngestionEvents.Emit(events, run.Id, "progress", $"Using feed snippet · {HtmlText.Truncate(item.Title, 80)}");
        }

        var body = await TryFetchArticleBodyAsync(sourceUrl, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var article = new Article
        {
            CityId = city.Id,
            Headline = item.Title,
            Summary = HtmlText.Truncate(summary.Trim(), 1000),
            Body = body,
            SourceName = sourceName,
            SourceUrl = sourceUrl,
            PublishedAt = ToUtc(item.PublishedAt ?? now),
            Category = "Local",
            ImageUrl = NormalizeImageUrl(item.ImageUrl),
            Status = ArticleStatus.PendingReview,
            IsMock = false,
            IngestedAt = now,
            SourceId = source.Id,
            DetectedLanguage = ArticleLanguageDetector.Detect(
                item.Title,
                summary,
                fallback: source.Language),
        };

        db.Articles.Add(article);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            if (ArticleImageEnrichmentService.IsEligible(article))
            {
                await imageEnrichmentQueue.EnqueueAsync(article.Id, cancellationToken);
            }

            return true;
        }
        catch (DbUpdateException)
        {
            db.Entry(article).State = EntityState.Detached;
            return false;
        }
    }

    private async Task<string?> TryFetchArticleBodyAsync(string sourceUrl, CancellationToken cancellationToken)
    {
        if (!SafeHttp.TryValidatePublicAbsoluteUri(sourceUrl, out var articleUri, out _))
        {
            return null;
        }

        try
        {
            var html = await scrapeHttp.GetStringAsync(articleUri, cancellationToken);
            var body = HtmlArticleExtractor.ExtractBody(html);
            return string.IsNullOrWhiteSpace(body) ? null : body;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "RSS article body fetch failed for {SourceUrl}", sourceUrl);
            return null;
        }
    }

    private static DateTimeOffset ToUtc(DateTimeOffset value) =>
        value.Offset == TimeSpan.Zero ? value : value.ToUniversalTime();

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
