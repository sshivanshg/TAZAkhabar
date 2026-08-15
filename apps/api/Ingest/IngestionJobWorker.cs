using Microsoft.EntityFrameworkCore;
using NewsFeed.Api.Data;

namespace NewsFeed.Api.Ingest;

public sealed class IngestionJobWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<IngestionJobWorker> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RequeueInterruptedJobsAsync(stoppingToken);

        using var timer = new PeriodicTimer(PollInterval);
        while (!stoppingToken.IsCancellationRequested)
        {
            await ProcessNextQueuedJobAsync(stoppingToken);
            await timer.WaitForNextTickAsync(stoppingToken);
        }
    }

    private async Task RequeueInterruptedJobsAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var running = await db.IngestionJobs
            .Where(j => j.Status == IngestionJobStatus.Running)
            .ToListAsync(ct);

        foreach (var job in running)
        {
            job.Status = IngestionJobStatus.Queued;
            job.ErrorSummary = "Resumed after restart";
        }

        if (running.Count > 0)
        {
            await db.SaveChangesAsync(ct);
            logger.LogWarning("Requeued {Count} interrupted ingestion jobs after startup", running.Count);
        }
    }

    private async Task ProcessNextQueuedJobAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var job = await db.IngestionJobs
            .Include(j => j.Source)
            .Where(j => j.Status == IngestionJobStatus.Queued)
            .OrderBy(j => j.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (job is null)
        {
            return;
        }

        job.Status = IngestionJobStatus.Running;
        job.Attempts++;
        job.StartedAt = DateTimeOffset.UtcNow;
        job.ErrorSummary = null;
        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "Started ingestion job {IngestionJobId} for source {SourceId} run {IngestionRunId}",
            job.Id,
            job.SourceId,
            job.IngestionRunId);

        try
        {
            if (job.Source.Type == SourceType.Scrape)
            {
                var scrape = scope.ServiceProvider.GetRequiredService<ScrapeIngestService>();
                await scrape.RunSourceAsync(job.SourceId, ct, job.IngestionRunId);
            }
            else if (job.Source.Type == SourceType.Rss)
            {
                var rss = scope.ServiceProvider.GetRequiredService<RssIngestService>();
                await rss.RunSourceAsync(job.SourceId, ct, job.IngestionRunId);
            }
            else
            {
                throw new InvalidOperationException($"Source type {job.Source.Type} cannot be manually triggered.");
            }

            job.Status = IngestionJobStatus.Completed;
            job.CompletedAt = DateTimeOffset.UtcNow;
            job.ErrorSummary = null;
            await db.SaveChangesAsync(CancellationToken.None);
            logger.LogInformation(
                "Completed ingestion job {IngestionJobId} for source {SourceId} run {IngestionRunId}",
                job.Id,
                job.SourceId,
                job.IngestionRunId);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            var summary = IngestErrorClassifier.FromException(ex);
            logger.LogError(
                ex,
                "Ingestion job {IngestionJobId} failed for source {SourceId} run {IngestionRunId}",
                job.Id,
                job.SourceId,
                job.IngestionRunId);

            db.ChangeTracker.Clear();
            var failedJob = await db.IngestionJobs.FirstAsync(j => j.Id == job.Id, CancellationToken.None);
            var failedRun = await db.IngestionRuns.FirstAsync(r => r.Id == job.IngestionRunId, CancellationToken.None);
            failedJob.Status = IngestionJobStatus.Failed;
            failedJob.CompletedAt = DateTimeOffset.UtcNow;
            failedJob.ErrorSummary = summary;
            failedRun.CompletedAt ??= failedJob.CompletedAt;
            failedRun.ArticlesFailed = Math.Max(failedRun.ArticlesFailed, 1);
            failedRun.ErrorSummary = summary;
            await db.SaveChangesAsync(CancellationToken.None);
        }
    }
}
