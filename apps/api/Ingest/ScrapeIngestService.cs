using Microsoft.EntityFrameworkCore;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using Serilog.Context;

namespace NewsFeed.Api.Ingest;

public sealed class ScrapeIngestService
{
    public const int MaxArticleLinks = 20;

    private readonly AppDbContext _db;
    private readonly IScrapeHttpClient _http;
    private readonly IIngestionEventBus _events;
    private readonly ImageEnrichmentQueue _imageEnrichmentQueue;
    private readonly ILogger<ScrapeIngestService> _logger;
    private readonly TimeSpan _delay;

    public ScrapeIngestService(
        AppDbContext db,
        IScrapeHttpClient http,
        IIngestionEventBus events,
        ImageEnrichmentQueue imageEnrichmentQueue,
        ILogger<ScrapeIngestService> logger)
        : this(db, http, events, imageEnrichmentQueue, logger, TimeSpan.FromMilliseconds(300))
    {
    }

    public ScrapeIngestService(
        AppDbContext db,
        IScrapeHttpClient http,
        IIngestionEventBus events,
        ImageEnrichmentQueue imageEnrichmentQueue,
        ILogger<ScrapeIngestService> logger,
        TimeSpan delayBetweenRequests)
    {
        _db = db;
        _http = http;
        _events = events;
        _imageEnrichmentQueue = imageEnrichmentQueue;
        _logger = logger;
        _delay = delayBetweenRequests;
    }

    public async Task<IngestRunResult> RunAllActiveAsync(CancellationToken ct)
    {
        var sources = await _db.Sources
            .AsNoTracking()
            .Where(s => s.Type == SourceType.Scrape && s.IsActive)
            .OrderBy(s => s.Id)
            .ToListAsync(ct);

        var attempted = 0;
        var failed = 0;
        var inserted = 0;
        var skipped = 0;

        foreach (var source in sources)
        {
            attempted++;
            var run = await RunSourceAsync(source.Id, ct);
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
        CancellationToken ct,
        int? existingRunId = null)
    {
        var source = await _db.Sources.FirstOrDefaultAsync(s => s.Id == sourceId, ct)
            ?? throw new InvalidOperationException($"Source {sourceId} not found.");

        IngestionRun run;
        if (existingRunId is int runId)
        {
            run = await _db.IngestionRuns.FirstOrDefaultAsync(r => r.Id == runId && r.SourceId == sourceId, ct)
                ?? throw new InvalidOperationException($"Ingestion run {runId} not found for source {sourceId}.");
        }
        else
        {
            run = new IngestionRun
            {
                SourceId = source.Id,
                StartedAt = DateTimeOffset.UtcNow,
            };
            _db.IngestionRuns.Add(run);
            await _db.SaveChangesAsync(ct);
            IngestionEvents.Emit(_events, run.Id, "started", $"Scrape run started · {source.Name}");
        }

        using var runLogContext = LogContext.PushProperty("IngestionRunId", run.Id);
        try
        {
            if (source.Type != SourceType.Scrape || string.IsNullOrWhiteSpace(source.FeedUrl))
            {
                run.ArticlesFailed = 1;
                run.ErrorSummary = IngestErrorClassifier.InvalidSource;
                await CompleteRunAsync(source, run, FetchStatus.Error, run.ErrorSummary, ct);
                return run;
            }

            if (!SafeHttp.TryValidatePublicAbsoluteUri(source.FeedUrl, out var listUri, out var urlError))
            {
                run.ArticlesFailed = 1;
                run.ErrorSummary = IngestErrorClassifier.InvalidSourceUrl;
                _logger.LogWarning(
                    "Scrape FeedUrl rejected for source {SourceId} run {IngestionRunId}: {Error}",
                    source.Id,
                    run.Id,
                    urlError);
                await CompleteRunAsync(source, run, FetchStatus.Error, run.ErrorSummary, ct);
                return run;
            }

            IngestionEvents.Emit(_events, run.Id, "fetch", $"Fetching list page {source.FeedUrl}");
            string listHtml;
            try
            {
                listHtml = await _http.GetStringAsync(listUri, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                run.ArticlesFailed = 1;
                run.ErrorSummary = IngestErrorClassifier.FromException(ex);
                _logger.LogWarning(
                    ex,
                    "Scrape list fetch failed for source {SourceId} {FeedUrl} run {IngestionRunId}",
                    source.Id,
                    source.FeedUrl,
                    run.Id);
                await CompleteRunAsync(source, run, FetchStatus.Error, run.ErrorSummary, ct);
                return run;
            }

            var links = HtmlArticleExtractor.ExtractArticleLinks(listHtml, listUri, MaxArticleLinks);
            run.ArticlesFound = links.Count;
            IngestionEvents.Emit(
                _events,
                run.Id,
                "found",
                $"Found {links.Count} article link{(links.Count == 1 ? "" : "s")}",
                found: links.Count);

            if (links.Count == 0)
            {
                run.ArticlesFailed = 1;
                run.ErrorSummary = IngestErrorClassifier.NoArticlesFound;
                _logger.LogWarning(
                    "Scrape found zero article links for source {SourceId} {FeedUrl} run {IngestionRunId}",
                    source.Id,
                    source.FeedUrl,
                    run.Id);
                await CompleteRunAsync(source, run, FetchStatus.Error, run.ErrorSummary, ct);
                return run;
            }

            var city = await _db.Cities
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == source.CityId, ct);

            if (city is null)
            {
                run.ArticlesSkipped = links.Count;
                run.ErrorSummary = IngestErrorClassifier.InvalidSource;
                _logger.LogWarning(
                    "City id {CityId} not found; skipping scrape {FeedUrl} run {IngestionRunId}",
                    source.CityId,
                    source.FeedUrl,
                    run.Id);
                await CompleteRunAsync(source, run, FetchStatus.Error, run.ErrorSummary, ct);
                return run;
            }

            var inserted = 0;
            var skipped = 0;
            var failed = 0;
            var fetchedAny = false;

            foreach (var link in links)
            {
                var sourceUrl = HtmlText.Truncate(link.AbsoluteUri, 500);
                if (await _db.Articles.AnyAsync(a => a.SourceUrl == sourceUrl, ct))
                {
                    skipped++;
                    IngestionEvents.Emit(
                        _events,
                        run.Id,
                        "skipped",
                        $"Already have · {HtmlText.Truncate(sourceUrl, 90)}",
                        found: links.Count,
                        added: inserted,
                        skipped: skipped,
                        failed: failed);
                    continue;
                }

                if (fetchedAny && _delay > TimeSpan.Zero)
                {
                    await Task.Delay(_delay, ct);
                }

                fetchedAny = true;
                IngestionEvents.Emit(_events, run.Id, "fetch", $"Fetching article · {HtmlText.Truncate(sourceUrl, 90)}");
                try
                {
                    var articleHtml = await _http.GetStringAsync(link, ct);
                    var (headline, snippet, body, publishedAt) = HtmlArticleExtractor.ExtractArticle(articleHtml);
                    headline = HtmlText.Truncate(headline.Trim(), 300);
                    if (string.IsNullOrWhiteSpace(headline))
                    {
                        skipped++;
                        IngestionEvents.Emit(
                            _events,
                            run.Id,
                            "skipped",
                            "Empty headline after extract",
                            found: links.Count,
                            added: inserted,
                            skipped: skipped,
                            failed: failed);
                        continue;
                    }

                    IngestionEvents.Emit(_events, run.Id, "progress", $"Extracting · {HtmlText.Truncate(headline, 80)}");

                    var summary = snippet;
                    if (string.IsNullOrWhiteSpace(summary))
                    {
                        summary = $"Tap to read the full story on {source.Name}";
                    }

                    var storedBody = string.IsNullOrWhiteSpace(body) ? null : body;

                    if (await TryInsertAsync(city.Id, source, headline, summary, storedBody, sourceUrl, publishedAt, ct))
                    {
                        inserted++;
                        IngestionEvents.Emit(
                            _events,
                            run.Id,
                            "article_added",
                            $"Added · {HtmlText.Truncate(headline, 100)}",
                            found: links.Count,
                            added: inserted,
                            skipped: skipped,
                            failed: failed);
                    }
                    else
                    {
                        skipped++;
                        IngestionEvents.Emit(
                            _events,
                            run.Id,
                            "skipped",
                            $"Duplicate on insert · {HtmlText.Truncate(headline, 80)}",
                            found: links.Count,
                            added: inserted,
                            skipped: skipped,
                            failed: failed);
                    }
                }
                catch (OperationCanceledException) when (ct.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    failed++;
                    _logger.LogWarning(ex, "Scrape article fetch failed for {SourceUrl}", sourceUrl);
                    IngestionEvents.Emit(
                        _events,
                        run.Id,
                        "failed",
                        $"Fetch failed · {HtmlText.Truncate(sourceUrl, 90)}",
                        found: links.Count,
                        added: inserted,
                        skipped: skipped,
                        failed: failed);
                }
            }

            run.ArticlesAdded = inserted;
            run.ArticlesSkipped = skipped;
            run.ArticlesFailed = failed;
            await CompleteRunAsync(source, run, FetchStatus.Success, null, ct);
            return run;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Scrape ingest failed for source {SourceId} {FeedUrl} run {IngestionRunId}",
                source.Id,
                source.FeedUrl,
                run.Id);
            _db.ChangeTracker.Clear();

            var trackedRun = await _db.IngestionRuns.FirstAsync(r => r.Id == run.Id, CancellationToken.None);
            var trackedSource = await _db.Sources.FirstAsync(s => s.Id == source.Id, CancellationToken.None);
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
        await _db.SaveChangesAsync(cancellationToken);
        _logger.LogInformation(
            "Scrape ingest run {IngestionRunId} completed with status {FetchStatus}: found {ArticlesFound}, added {ArticlesAdded}, skipped {ArticlesSkipped}, failed {ArticlesFailed}",
            run.Id,
            status,
            run.ArticlesFound,
            run.ArticlesAdded,
            run.ArticlesSkipped,
            run.ArticlesFailed);

        if (status == FetchStatus.Error)
        {
            IngestionEvents.Emit(
                _events,
                run.Id,
                "error",
                error ?? "Scrape run failed",
                found: run.ArticlesFound,
                added: run.ArticlesAdded,
                skipped: run.ArticlesSkipped,
                failed: run.ArticlesFailed);
        }
        else
        {
            IngestionEvents.Emit(
                _events,
                run.Id,
                "completed",
                $"Done · +{run.ArticlesAdded} added · {run.ArticlesSkipped} skipped · {run.ArticlesFailed} failed",
                found: run.ArticlesFound,
                added: run.ArticlesAdded,
                skipped: run.ArticlesSkipped,
                failed: run.ArticlesFailed);
        }
    }

    private async Task<bool> TryInsertAsync(
        int cityId,
        Source source,
        string headline,
        string summary,
        string? body,
        string sourceUrl,
        DateTimeOffset? publishedAt,
        CancellationToken cancellationToken)
    {
        if (await _db.Articles.AnyAsync(a => a.SourceUrl == sourceUrl, cancellationToken))
        {
            return false;
        }

        var now = DateTimeOffset.UtcNow;
        var article = new Article
        {
            CityId = cityId,
            Headline = headline,
            Summary = HtmlText.Truncate(summary.Trim(), 1000),
            Body = body,
            SourceName = HtmlText.Truncate(source.Name, 120),
            SourceUrl = sourceUrl,
            PublishedAt = ToUtc(publishedAt ?? now),
            Category = "Local",
            Status = ArticleStatus.PendingReview,
            IsMock = false,
            IngestedAt = now,
            SourceId = source.Id,
            DetectedLanguage = ArticleLanguageDetector.Detect(
                headline,
                summary,
                fallback: source.Language),
        };

        _db.Articles.Add(article);
        try
        {
            await _db.SaveChangesAsync(cancellationToken);
            if (ArticleImageEnrichmentService.IsEligible(article))
            {
                await _imageEnrichmentQueue.EnqueueAsync(article.Id, cancellationToken);
            }

            return true;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "Article insert failed for {SourceUrl}", sourceUrl);
            _db.Entry(article).State = EntityState.Detached;
            return false;
        }
    }

    private static DateTimeOffset ToUtc(DateTimeOffset value) =>
        value.Offset == TimeSpan.Zero ? value : value.ToUniversalTime();
}
